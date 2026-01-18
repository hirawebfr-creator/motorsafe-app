/**
 * POST /api/import/vehicules/dry-run
 * IMPORT-ONBOARDING-01: Validate vehicle CSV without writing to DB
 * 
 * Validates plates/VINs, checks client links, returns preview.
 * Creates ImportBatch in DRY_RUN_DONE status.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse, badRequest } from "@/lib/routeErrors";
import { requirePermission, Permission } from "@/lib/permissions";
import { requireFeature, getGarageEntitlements, FeatureKey } from "@/lib/entitlements";
import { z } from "zod";
import {
  parseCSV,
  autoMapColumns,
  validateVehicleRows,
  vehicleDedupeKey,
  MAX_CSV_SIZE_BYTES,
  MAX_ERROR_SAMPLES,
  type ColumnMapping,
  type VehicleRow,
} from "@/lib/csv";
import { decryptClients } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  csvContent: z.string().min(1).max(MAX_CSV_SIZE_BYTES),
  mapping: z.record(z.string(), z.string().nullable()).optional(),
});

interface DryRunStats {
  totalRows: number;
  toCreate: number;
  toUpdate: number;
  skipped: number;
  errorsCount: number;
  clientsNotFound: number;
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    
    await requirePermission(user, Permission.VEHICLES_WRITE);
    await requireFeature(garageId, FeatureKey.IMPORT);
    
    const entitlements = await getGarageEntitlements(garageId);
    const rowLimit = entitlements.quotas.importRowsPerBatch;
    
    // Parse request
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("INVALID_REQUEST", "Requête invalide", parsed.error.flatten());
    }
    
    const { csvContent, mapping: manualMapping } = parsed.data;
    
    // Check size
    const sizeBytes = new TextEncoder().encode(csvContent).length;
    if (sizeBytes > MAX_CSV_SIZE_BYTES) {
      throw badRequest("FILE_TOO_LARGE", `Fichier trop volumineux (max ${MAX_CSV_SIZE_BYTES / 1024 / 1024}MB)`);
    }
    
    // Parse CSV
    const csv = parseCSV(csvContent);
    if (csv.rows.length === 0) {
      throw badRequest("EMPTY_FILE", "Le fichier CSV est vide");
    }
    
    // Check quota
    if (rowLimit > 0 && csv.rows.length > rowLimit) {
      throw badRequest(
        "ROW_LIMIT_EXCEEDED",
        `Limite de ${rowLimit} lignes dépassée (${csv.rows.length} lignes). Passez au plan supérieur.`
      );
    }
    
    // Map columns
    const mapping: ColumnMapping = manualMapping || autoMapColumns(csv.headers, "vehicules");
    
    // Validate rows
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
    
    // Build dedupe map for vehicles
    const existingVehicleMap = new Map<string, { id: string }>();
    for (const v of existingVehicles) {
      if (v.plate) {
        existingVehicleMap.set(`plate:${v.plate}`, { id: v.id });
      }
      if (v.vin) {
        existingVehicleMap.set(`vin:${v.vin}`, { id: v.id });
      }
    }
    
    // Build client lookup by email
    const clientByEmail = new Map<string, number>();
    for (const c of decryptedClients) {
      if (c.email) {
        clientByEmail.set(c.email.toLowerCase(), c.id);
      }
    }
    
    // Categorize rows
    const toCreate: (VehicleRow & { resolvedClientId?: number })[] = [];
    const toUpdate: { row: VehicleRow; existingId: string }[] = [];
    const clientsNotFoundRows: VehicleRow[] = [];
    const duplicatesInBatch: { row: VehicleRow; reason: string }[] = [];
    
    const seenInBatch = new Set<string>();
    
    for (const row of validation.valid) {
      // Resolve client
      let resolvedClientId: number | undefined;
      if (row.clientId) {
        resolvedClientId = parseInt(row.clientId, 10);
      } else if (row.clientEmail) {
        resolvedClientId = clientByEmail.get(row.clientEmail.toLowerCase());
        if (!resolvedClientId) {
          clientsNotFoundRows.push(row);
          continue;
        }
      }
      
      const dedupeKey = vehicleDedupeKey(row);
      
      if (dedupeKey) {
        // Check existing in DB
        const existing = existingVehicleMap.get(dedupeKey);
        if (existing) {
          toUpdate.push({ row, existingId: existing.id });
          continue;
        }
        
        // Check duplicate in batch
        if (seenInBatch.has(dedupeKey)) {
          duplicatesInBatch.push({
            row,
            reason: `Doublon dans le fichier: ${dedupeKey.startsWith("plate:") ? "immatriculation" : "VIN"}`,
          });
          continue;
        }
        
        seenInBatch.add(dedupeKey);
      }
      
      toCreate.push({ ...row, resolvedClientId });
    }
    
    // Stats
    const stats: DryRunStats = {
      totalRows: csv.rows.length,
      toCreate: toCreate.length,
      toUpdate: toUpdate.length,
      skipped: validation.skipped + duplicatesInBatch.length,
      errorsCount: validation.errors.length,
      clientsNotFound: clientsNotFoundRows.length,
    };
    
    // Create batch
    const batch = await prisma.importBatch.create({
      data: {
        garageId,
        kind: "VEHICULES",
        status: "DRY_RUN_DONE",
        createdByUserId: user.id,
        mappingJson: JSON.stringify(mapping),
        statsJson: JSON.stringify(stats),
        errorSampleJson: JSON.stringify(validation.errors.slice(0, MAX_ERROR_SAMPLES)),
        createdIdsJson: JSON.stringify([]),
      },
    });
    
    // Preview
    const preview = {
      toCreate: toCreate.slice(0, 10).map((r) => ({
        brand: r.brand,
        model: r.model,
        plate: r.plate,
        clientId: r.resolvedClientId,
      })),
      toUpdate: toUpdate.slice(0, 5).map((u) => ({
        existingId: u.existingId,
        plate: u.row.plate,
        updates: { brand: u.row.brand, model: u.row.model },
      })),
      clientsNotFound: clientsNotFoundRows.slice(0, 5).map((r) => ({
        plate: r.plate,
        clientEmail: r.clientEmail,
      })),
    };
    
    return NextResponse.json(
      success({
        batchId: batch.id,
        stats,
        errors: validation.errors.slice(0, MAX_ERROR_SAMPLES),
        duplicatesInBatch: duplicatesInBatch.length,
        preview,
        headers: csv.headers,
        mapping,
        delimiter: csv.delimiter,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
