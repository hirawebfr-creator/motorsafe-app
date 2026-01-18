/**
 * POST /api/import/vehicules/commit
 * IMPORT-ONBOARDING-01: Execute vehicle import (write to DB)
 * 
 * Takes batch ID from dry-run, performs actual inserts/updates.
 * Updates batch status to IMPORTED and stores created IDs for rollback.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse, badRequest, notFound } from "@/lib/routeErrors";
import { requirePermission, Permission } from "@/lib/permissions";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { z } from "zod";
import {
  parseCSV,
  validateVehicleRows,
  vehicleDedupeKey,
  type ColumnMapping,
  type VehicleRow,
} from "@/lib/csv";
import { decryptClients } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  batchId: z.string().cuid(),
  csvContent: z.string().min(1),
  updateExisting: z.boolean().default(false),
  skipMissingClients: z.boolean().default(true), // Skip rows where client not found
});

interface CommitStats {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  clientsNotFound: number;
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    
    await requirePermission(user, Permission.VEHICLES_WRITE);
    await requireFeature(garageId, FeatureKey.IMPORT);
    
    // Parse request
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("INVALID_REQUEST", "Requête invalide", parsed.error.flatten());
    }
    
    const { batchId, csvContent, updateExisting, skipMissingClients } = parsed.data;
    
    // Get batch
    const batch = await prisma.importBatch.findFirst({
      where: {
        id: batchId,
        garageId,
        kind: "VEHICULES",
        status: "DRY_RUN_DONE",
      },
    });
    
    if (!batch) {
      throw notFound("Batch d'import introuvable ou déjà traité");
    }
    
    // Parse mapping
    const mapping: ColumnMapping = JSON.parse(String(batch.mappingJson) || "{}");
    
    // Re-parse CSV
    const csv = parseCSV(csvContent);
    const validation = validateVehicleRows(csv.rows, mapping);
    
    // Get existing data
    const [existingVehicles, existingClients] = await Promise.all([
      prisma.vehicle.findMany({
        where: { garageId, deletedAt: null },
        select: { id: true, plate: true, vin: true },
      }),
      prisma.client.findMany({
        where: { garageId, deletedAt: null },
        select: { id: true, email: true },
      }),
    ]);
    
    const decryptedClients = decryptClients(existingClients);
    
    // Build maps
    const existingVehicleMap = new Map<string, { id: string }>();
    for (const v of existingVehicles) {
      if (v.plate) existingVehicleMap.set(`plate:${v.plate}`, { id: v.id });
      if (v.vin) existingVehicleMap.set(`vin:${v.vin}`, { id: v.id });
    }
    
    const clientByEmail = new Map<string, number>();
    const clientById = new Set<number>();
    for (const c of decryptedClients) {
      if (c.email) clientByEmail.set(c.email.toLowerCase(), c.id);
      clientById.add(c.id);
    }
    
    // Categorize
    const toCreate: (VehicleRow & { resolvedClientId: number })[] = [];
    const toUpdate: { row: VehicleRow; existingId: string }[] = [];
    const seenInBatch = new Set<string>();
    let clientsNotFound = 0;
    
    for (const row of validation.valid) {
      // Resolve client
      let resolvedClientId: number | undefined;
      if (row.clientId) {
        const parsedId = parseInt(row.clientId, 10);
        if (clientById.has(parsedId)) {
          resolvedClientId = parsedId;
        }
      } else if (row.clientEmail) {
        resolvedClientId = clientByEmail.get(row.clientEmail.toLowerCase());
      }
      
      if (!resolvedClientId) {
        clientsNotFound++;
        if (skipMissingClients) continue;
        throw badRequest("CLIENT_NOT_FOUND", `Client introuvable pour véhicule ${row.plate}`);
      }
      
      const dedupeKey = vehicleDedupeKey(row);
      
      if (dedupeKey) {
        const existing = existingVehicleMap.get(dedupeKey);
        if (existing) {
          if (updateExisting) {
            toUpdate.push({ row, existingId: existing.id });
          }
          continue;
        }
        if (seenInBatch.has(dedupeKey)) continue;
        seenInBatch.add(dedupeKey);
      }
      
      toCreate.push({ ...row, resolvedClientId });
    }
    
    // Execute transaction
    const createdIds: string[] = [];
    const updatedIds: string[] = [];
    let errorCount = 0;
    
    await prisma.$transaction(async (tx) => {
      // Create vehicles
      for (const row of toCreate) {
        try {
          const vehicle = await tx.vehicle.create({
            data: {
              garageId,
              clientId: row.resolvedClientId,
              brand: row.brand,
              model: row.model,
              plate: row.plate,
              vin: row.vin || null,
              fuel: row.fuel || null,
              year: row.year || null,
            },
          });
          createdIds.push(vehicle.id);
        } catch {
          errorCount++;
        }
      }
      
      // Update vehicles
      for (const item of toUpdate) {
        try {
          await tx.vehicle.update({
            where: { id: item.existingId },
            data: {
              brand: item.row.brand,
              model: item.row.model,
              vin: item.row.vin || undefined,
              fuel: item.row.fuel || undefined,
              year: item.row.year || undefined,
            },
          });
          updatedIds.push(item.existingId);
        } catch {
          errorCount++;
        }
      }
      
      // Update batch
      const stats: CommitStats = {
        created: createdIds.length,
        updated: updatedIds.length,
        skipped: validation.skipped + clientsNotFound,
        errors: errorCount + validation.errors.length,
        clientsNotFound,
      };
      
      await tx.importBatch.update({
        where: { id: batchId },
        data: {
          status: errorCount > 0 && createdIds.length === 0 ? "FAILED" : "IMPORTED",
          statsJson: JSON.stringify(stats),
          createdIdsJson: JSON.stringify(createdIds),
          updatedAt: new Date(),
        },
      });
    });
    
    return NextResponse.json(
      success({
        batchId,
        created: createdIds.length,
        updated: updatedIds.length,
        skipped: validation.skipped + clientsNotFound,
        errors: errorCount,
        clientsNotFound,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
