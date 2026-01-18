/**
 * POST /api/import/clients/commit
 * IMPORT-ONBOARDING-01: Execute the import (write to DB)
 * 
 * Takes a batch ID from dry-run, performs actual inserts/updates.
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
  validateClientRows,
  clientDedupeKey,
  type ColumnMapping,
  type ClientRow,
} from "@/lib/csv";
import { decryptClients, encryptClientData } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  batchId: z.string().cuid(),
  csvContent: z.string().min(1), // Re-send CSV to avoid storing PII in batch
  updateExisting: z.boolean().default(false), // Whether to update existing or skip
});

interface CommitStats {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    
    // Check permission
    await requirePermission(user, Permission.CLIENTS_WRITE);
    
    // Check feature entitlement
    await requireFeature(garageId, FeatureKey.IMPORT);
    
    // Parse request
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("INVALID_REQUEST", "Requête invalide", parsed.error.flatten());
    }
    
    const { batchId, csvContent, updateExisting } = parsed.data;
    
    // Get batch and verify ownership
    const batch = await prisma.importBatch.findFirst({
      where: {
        id: batchId,
        garageId,
        kind: "CLIENTS",
        status: "DRY_RUN_DONE",
      },
    });
    
    if (!batch) {
      throw notFound("Batch d'import introuvable ou déjà traité");
    }
    
    // Parse mapping from batch
    const mapping: ColumnMapping = JSON.parse(String(batch.mappingJson) || "{}");
    
    // Re-parse CSV
    const csv = parseCSV(csvContent);
    const validation = validateClientRows(csv.rows, mapping);
    
    // Get existing clients for deduplication
    const existingClients = await prisma.client.findMany({
      where: { garageId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });
    const decryptedClients = decryptClients(existingClients);
    
    // Build dedupe map
    const existingDedupeMap = new Map<string, { id: number }>();
    for (const client of decryptedClients) {
      if (client.email) {
        existingDedupeMap.set(`email:${client.email.toLowerCase()}`, { id: client.id });
      }
      if (client.lastName && client.phone) {
        existingDedupeMap.set(`name_phone:${client.lastName.toLowerCase()}:${client.phone}`, { id: client.id });
      }
    }
    
    // Categorize rows
    const toCreate: ClientRow[] = [];
    const toUpdate: { row: ClientRow; existingId: number }[] = [];
    const seenInBatch = new Set<string>();
    
    for (const row of validation.valid) {
      const dedupeKey = clientDedupeKey(row);
      
      if (dedupeKey) {
        const existing = existingDedupeMap.get(dedupeKey);
        if (existing) {
          if (updateExisting) {
            toUpdate.push({ row, existingId: existing.id });
          }
          continue;
        }
        if (seenInBatch.has(dedupeKey)) continue;
        seenInBatch.add(dedupeKey);
      }
      
      toCreate.push(row);
    }
    
    // Execute in transaction
    const createdIds: number[] = [];
    const updatedIds: number[] = [];
    let errorCount = 0;
    
    await prisma.$transaction(async (tx) => {
      // Create new clients
      for (const row of toCreate) {
        try {
          const encrypted = encryptClientData({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email || null,
            phone: row.phone || null,
            address: row.address || null,
            notes: row.notes || null,
          });
          
          const client = await tx.client.create({
            data: {
              garageId,
              ...encrypted,
            },
          });
          
          createdIds.push(client.id);
        } catch {
          // Log error internally (no PII)
          errorCount++;
        }
      }
      
      // Update existing clients
      for (const item of toUpdate) {
        try {
          const encrypted = encryptClientData({
            firstName: item.row.firstName,
            lastName: item.row.lastName,
            email: item.row.email || null,
            phone: item.row.phone || null,
            address: item.row.address || null,
            notes: item.row.notes || null,
          });
          
          await tx.client.update({
            where: { id: item.existingId },
            data: encrypted,
          });
          
          updatedIds.push(item.existingId);
        } catch {
          errorCount++;
        }
      }
      
      // Update batch status
      const stats: CommitStats = {
        created: createdIds.length,
        updated: updatedIds.length,
        skipped: validation.skipped + (validation.valid.length - toCreate.length - toUpdate.length),
        errors: errorCount + validation.errors.length,
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
        skipped: validation.valid.length - toCreate.length - toUpdate.length + validation.skipped,
        errors: errorCount,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
