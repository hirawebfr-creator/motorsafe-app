/**
 * POST /api/import/clients/dry-run
 * IMPORT-ONBOARDING-01: Validate CSV without writing to DB
 * 
 * Returns validation results, deduplication info, and preview data.
 * Creates ImportBatch in DRAFT status.
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
  validateClientRows,
  clientDedupeKey,
  MAX_CSV_SIZE_BYTES,
  MAX_ERROR_SAMPLES,
  type ColumnMapping,
  type ClientRow,
} from "@/lib/csv";
import { decryptClients } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  csvContent: z.string().min(1).max(MAX_CSV_SIZE_BYTES),
  mapping: z.record(z.string(), z.string().nullable()).optional(), // Manual mapping override
});

interface DryRunStats {
  totalRows: number;
  toCreate: number;
  toUpdate: number;
  skipped: number;
  errorsCount: number;
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    
    // Check permission
    await requirePermission(user, Permission.CLIENTS_WRITE);
    
    // Check feature entitlement
    await requireFeature(garageId, FeatureKey.IMPORT);
    
    // Get row limit quota
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
    
    // Check row limit (quota)
    if (rowLimit > 0 && csv.rows.length > rowLimit) {
      throw badRequest(
        "ROW_LIMIT_EXCEEDED",
        `Limite de ${rowLimit} lignes dépassée (${csv.rows.length} lignes). Passez au plan supérieur.`
      );
    }
    
    // Auto-map or use provided mapping
    const mapping: ColumnMapping = manualMapping || autoMapColumns(csv.headers, "clients");
    
    // Validate rows
    const validation = validateClientRows(csv.rows, mapping);
    
    // Get existing clients for deduplication
    const existingClients = await prisma.client.findMany({
      where: { garageId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });
    
    // Decrypt for comparison
    const decryptedClients = decryptClients(existingClients);
    
    // Build dedupe map from existing clients
    const existingDedupeMap = new Map<string, { id: number }>();
    for (const client of decryptedClients) {
      // By email
      if (client.email) {
        existingDedupeMap.set(`email:${client.email.toLowerCase()}`, { id: client.id });
      }
      // By lastName + phone
      if (client.lastName && client.phone) {
        existingDedupeMap.set(`name_phone:${client.lastName.toLowerCase()}:${client.phone}`, { id: client.id });
      }
    }
    
    // Categorize validated rows
    const toCreate: ClientRow[] = [];
    const toUpdate: { row: ClientRow; existingId: number }[] = [];
    const duplicatesInBatch: { row: ClientRow; reason: string }[] = [];
    
    const seenInBatch = new Set<string>();
    
    for (const row of validation.valid) {
      const dedupeKey = clientDedupeKey(row);
      
      if (dedupeKey) {
        // Check for duplicate in existing DB
        const existing = existingDedupeMap.get(dedupeKey);
        if (existing) {
          toUpdate.push({ row, existingId: existing.id });
          continue;
        }
        
        // Check for duplicate in same batch
        if (seenInBatch.has(dedupeKey)) {
          duplicatesInBatch.push({
            row,
            reason: `Doublon dans le fichier: ${dedupeKey.startsWith("email:") ? "email" : "nom+téléphone"}`,
          });
          continue;
        }
        
        seenInBatch.add(dedupeKey);
      }
      
      toCreate.push(row);
    }
    
    // Prepare stats
    const stats: DryRunStats = {
      totalRows: csv.rows.length,
      toCreate: toCreate.length,
      toUpdate: toUpdate.length,
      skipped: validation.skipped + duplicatesInBatch.length,
      errorsCount: validation.errors.length,
    };
    
    // Create ImportBatch in DRAFT status
    const batch = await prisma.importBatch.create({
      data: {
        garageId,
        kind: "CLIENTS",
        status: "DRY_RUN_DONE",
        createdByUserId: user.id,
        mappingJson: JSON.stringify(mapping),
        statsJson: JSON.stringify(stats),
        errorSampleJson: JSON.stringify(validation.errors.slice(0, MAX_ERROR_SAMPLES)),
        createdIdsJson: JSON.stringify([]), // Not yet created
      },
    });
    
    // Preview data (first 10 rows to create, first 5 to update)
    const preview = {
      toCreate: toCreate.slice(0, 10),
      toUpdate: toUpdate.slice(0, 5).map((u) => ({
        existingId: String(u.existingId),
        updates: u.row,
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
