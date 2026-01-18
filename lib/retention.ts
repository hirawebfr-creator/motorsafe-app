/**
 * DATA-COMPLIANCE-01: RGPD / GDPR Retention Policy
 *
 * Categories:
 *   EVIDENCE_10Y   - Legal proof (signed documents, evidence chain)
 *   ACCOUNTING_10Y - Fiscal obligations (invoices, payments)
 *   OPERATIONAL_12M - Operational data (notifications, logs, caches)
 *
 * Rules:
 *   1. Dispute mode BLOCKS all purge for the intervention and related entities
 *   2. Active clients (with open interventions) cannot be anonymized
 *   3. Garage-level retention settings can EXTEND but not REDUCE legal minimums
 */

import { prisma } from "@/lib/prisma";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const RETENTION_DEFAULTS = {
  /** Legal proof - 10 years minimum (French law) */
  EVIDENCE_YEARS: 10,
  /** Accounting - 10 years minimum (fiscal law) */
  ACCOUNTING_YEARS: 10,
  /** Operational data - 12 months (GDPR data minimization) */
  OPERATIONAL_DAYS: 365,
  /** Expired sessions - 30 days */
  SESSION_DAYS: 30,
  /** Rate limit buckets - 7 days */
  RATE_LIMIT_DAYS: 7,
  /** Vehicle lookup cache - respects expiresAt field */
  LOOKUP_CACHE_DAYS: 30,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type RetentionCategory = "EVIDENCE_10Y" | "ACCOUNTING_10Y" | "OPERATIONAL_12M";

export interface RetentionStats {
  category: RetentionCategory | "SESSION" | "CACHE";
  table: string;
  deleted: number;
  errors: string[];
}

export interface PurgeResult {
  garageId: number;
  startedAt: Date;
  completedAt: Date;
  stats: RetentionStats[];
  totalDeleted: number;
  skippedDueToDispute: number;
  success: boolean;
  error?: string;
}

export interface GarageRetentionSettings {
  retentionSignedDocsYears: number;
  retentionAccountingYears: number;
  retentionOperationalDays: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Calculate date N years ago (for EVIDENCE_10Y, ACCOUNTING_10Y categories) */
export function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Get effective retention settings for a garage
 * Settings can only EXTEND, never reduce legal minimums
 */
export function getEffectiveRetention(settings: GarageRetentionSettings): GarageRetentionSettings {
  return {
    retentionSignedDocsYears: Math.max(settings.retentionSignedDocsYears, RETENTION_DEFAULTS.EVIDENCE_YEARS),
    retentionAccountingYears: Math.max(settings.retentionAccountingYears, RETENTION_DEFAULTS.ACCOUNTING_YEARS),
    retentionOperationalDays: Math.max(settings.retentionOperationalDays, RETENTION_DEFAULTS.OPERATIONAL_DAYS),
  };
}

// ============================================================================
// DISPUTE PROTECTION
// ============================================================================

/**
 * Get all intervention IDs that are currently in dispute mode
 * These MUST NOT be purged or have related data deleted
 */
async function getDisputedInterventionIds(garageId: number): Promise<Set<string>> {
  const disputed = await prisma.intervention.findMany({
    where: {
      garageId,
      disputeStatus: "OPEN",
    },
    select: { id: true },
  });
  return new Set(disputed.map((i) => i.id));
}

/**
 * Get all client IDs that have open interventions
 * These clients cannot be anonymized
 * Exported for use in anonymization checks
 */
export async function getActiveClientIds(garageId: number): Promise<Set<number>> {
  const activeVehicles = await prisma.vehicle.findMany({
    where: {
      garageId,
      interventions: {
        some: {
          status: { in: ["DRAFT", "OPEN"] },
        },
      },
    },
    select: { clientId: true },
  });
  return new Set(activeVehicles.map((v) => v.clientId));
}

// ============================================================================
// PURGE FUNCTIONS - OPERATIONAL (12 months)
// ============================================================================

async function purgeNotifications(
  garageId: number,
  cutoffDate: Date,
  stats: RetentionStats[]
): Promise<void> {
  const result = await prisma.notification.deleteMany({
    where: {
      garageId,
      createdAt: { lt: cutoffDate },
    },
  });
  stats.push({
    category: "OPERATIONAL_12M",
    table: "Notification",
    deleted: result.count,
    errors: [],
  });
}

async function purgeAutomationJobs(
  garageId: number,
  cutoffDate: Date,
  stats: RetentionStats[]
): Promise<void> {
  const result = await prisma.automationJob.deleteMany({
    where: {
      garageId,
      status: { in: ["DONE", "FAILED", "CANCELLED"] },
      updatedAt: { lt: cutoffDate },
    },
  });
  stats.push({
    category: "OPERATIONAL_12M",
    table: "AutomationJob",
    deleted: result.count,
    errors: [],
  });
}

async function purgeAiUsageLogs(
  garageId: number,
  cutoffDate: Date,
  stats: RetentionStats[]
): Promise<void> {
  const result = await prisma.aiUsageLog.deleteMany({
    where: {
      garageId,
      createdAt: { lt: cutoffDate },
    },
  });
  stats.push({
    category: "OPERATIONAL_12M",
    table: "AiUsageLog",
    deleted: result.count,
    errors: [],
  });
}

async function purgeVehicleLookupLogs(
  garageId: number,
  cutoffDate: Date,
  stats: RetentionStats[]
): Promise<void> {
  const result = await prisma.vehicleLookupLog.deleteMany({
    where: {
      garageId,
      createdAt: { lt: cutoffDate },
    },
  });
  stats.push({
    category: "OPERATIONAL_12M",
    table: "VehicleLookupLog",
    deleted: result.count,
    errors: [],
  });
}

// ============================================================================
// PURGE FUNCTIONS - CACHE & SESSIONS
// ============================================================================

async function purgeExpiredSessions(stats: RetentionStats[]): Promise<void> {
  const cutoff = daysAgo(RETENTION_DEFAULTS.SESSION_DAYS);
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: cutoff },
    },
  });
  stats.push({
    category: "SESSION",
    table: "Session",
    deleted: result.count,
    errors: [],
  });
}

async function purgeRateLimitBuckets(stats: RetentionStats[]): Promise<void> {
  const cutoff = daysAgo(RETENTION_DEFAULTS.RATE_LIMIT_DAYS);
  const result = await prisma.rateLimitBucket.deleteMany({
    where: {
      windowStart: { lt: cutoff },
    },
  });
  stats.push({
    category: "CACHE",
    table: "RateLimitBucket",
    deleted: result.count,
    errors: [],
  });
}

async function purgeVehicleLookupCache(garageId: number, stats: RetentionStats[]): Promise<void> {
  const now = new Date();
  const result = await prisma.vehicleLookupCache.deleteMany({
    where: {
      garageId,
      expiresAt: { lt: now },
    },
  });
  stats.push({
    category: "CACHE",
    table: "VehicleLookupCache",
    deleted: result.count,
    errors: [],
  });
}

async function purgeExpiredDownloadTokens(
  garageId: number,
  disputedIds: Set<string>,
  stats: RetentionStats[]
): Promise<void> {
  const now = new Date();
  
  // Download tokens for interventions
  const interventionTokens = await prisma.downloadToken.findMany({
    where: {
      expiresAt: { lt: now },
      intervention: { garageId },
    },
    select: { id: true, interventionId: true },
  });
  
  const toDelete = interventionTokens.filter((t) => !disputedIds.has(t.interventionId));
  if (toDelete.length > 0) {
    await prisma.downloadToken.deleteMany({
      where: { id: { in: toDelete.map((t) => t.id) } },
    });
  }
  
  stats.push({
    category: "CACHE",
    table: "DownloadToken",
    deleted: toDelete.length,
    errors: [],
  });
}

async function purgeExpiredQuoteDownloadTokens(
  garageId: number,
  stats: RetentionStats[]
): Promise<void> {
  const now = new Date();
  const result = await prisma.quoteDownloadToken.deleteMany({
    where: {
      expiresAt: { lt: now },
      quote: { organisationId: garageId },
    },
  });
  stats.push({
    category: "CACHE",
    table: "QuoteDownloadToken",
    deleted: result.count,
    errors: [],
  });
}

async function purgeExpiredInvoiceDownloadTokens(
  garageId: number,
  stats: RetentionStats[]
): Promise<void> {
  const now = new Date();
  const result = await prisma.invoiceDownloadToken.deleteMany({
    where: {
      expiresAt: { lt: now },
      invoice: { organisationId: garageId },
    },
  });
  stats.push({
    category: "CACHE",
    table: "InvoiceDownloadToken",
    deleted: result.count,
    errors: [],
  });
}

// ============================================================================
// GLOBAL PURGE (not garage-specific)
// ============================================================================

async function purgeGlobalOperational(stats: RetentionStats[]): Promise<void> {
  const cutoff = daysAgo(RETENTION_DEFAULTS.OPERATIONAL_DAYS);
  
  // System events - keep only last 12 months
  const systemResult = await prisma.systemEvent.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });
  stats.push({
    category: "OPERATIONAL_12M",
    table: "SystemEvent",
    deleted: systemResult.count,
    errors: [],
  });
}

// ============================================================================
// MAIN PURGE FUNCTION
// ============================================================================

/**
 * Run retention purge for a specific garage
 * Respects dispute mode and legal minimums
 */
export async function runGarageRetentionPurge(garageId: number): Promise<PurgeResult> {
  const startedAt = new Date();
  const stats: RetentionStats[] = [];
  let skippedDueToDispute = 0;
  
  try {
    // Get garage settings
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: {
        retentionSignedDocsYears: true,
        retentionAccountingYears: true,
        retentionOperationalDays: true,
      },
    });
    
    if (!garage) {
      throw new Error(`Garage ${garageId} not found`);
    }
    
    const settings = getEffectiveRetention(garage);
    const operationalCutoff = daysAgo(settings.retentionOperationalDays);
    
    // Get protected entities
    const disputedIds = await getDisputedInterventionIds(garageId);
    skippedDueToDispute = disputedIds.size;
    
    // Run purges in order (least critical first)
    await purgeVehicleLookupCache(garageId, stats);
    await purgeExpiredDownloadTokens(garageId, disputedIds, stats);
    await purgeExpiredQuoteDownloadTokens(garageId, stats);
    await purgeExpiredInvoiceDownloadTokens(garageId, stats);
    await purgeNotifications(garageId, operationalCutoff, stats);
    await purgeAutomationJobs(garageId, operationalCutoff, stats);
    await purgeAiUsageLogs(garageId, operationalCutoff, stats);
    await purgeVehicleLookupLogs(garageId, operationalCutoff, stats);
    
    const totalDeleted = stats.reduce((sum, s) => sum + s.deleted, 0);
    
    return {
      garageId,
      startedAt,
      completedAt: new Date(),
      stats,
      totalDeleted,
      skippedDueToDispute,
      success: true,
    };
  } catch (error) {
    return {
      garageId,
      startedAt,
      completedAt: new Date(),
      stats,
      totalDeleted: stats.reduce((sum, s) => sum + s.deleted, 0),
      skippedDueToDispute,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run global retention purge (sessions, rate limits, system events)
 * Should be called once per cron run, not per garage
 */
export async function runGlobalRetentionPurge(): Promise<RetentionStats[]> {
  const stats: RetentionStats[] = [];
  
  await purgeExpiredSessions(stats);
  await purgeRateLimitBuckets(stats);
  await purgeGlobalOperational(stats);
  
  return stats;
}

/**
 * Run retention purge for all garages
 * Called by the cron endpoint
 */
export async function runAllGaragesPurge(): Promise<{
  globalStats: RetentionStats[];
  garageResults: PurgeResult[];
  totalDeleted: number;
}> {
  // First run global purge
  const globalStats = await runGlobalRetentionPurge();
  
  // Get all garages
  const garages = await prisma.garage.findMany({
    select: { id: true },
  });
  
  // Run purge for each garage
  const garageResults: PurgeResult[] = [];
  for (const garage of garages) {
    const result = await runGarageRetentionPurge(garage.id);
    garageResults.push(result);
  }
  
  const globalDeleted = globalStats.reduce((sum, s) => sum + s.deleted, 0);
  const garageDeleted = garageResults.reduce((sum, r) => sum + r.totalDeleted, 0);
  
  return {
    globalStats,
    garageResults,
    totalDeleted: globalDeleted + garageDeleted,
  };
}

// ============================================================================
// CLIENT ANONYMIZATION (GDPR Right to Erasure)
// ============================================================================

/**
 * Anonymize a client's personal data
 * Preserves linked records for accounting but removes PII
 */
export async function anonymizeClient(
  garageId: number,
  clientId: number,
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if client exists and belongs to garage
    const client = await prisma.client.findFirst({
      where: { id: clientId, garageId },
      include: {
        vehicles: {
          include: {
            interventions: {
              where: { status: { in: ["DRAFT", "OPEN"] } },
            },
          },
        },
      },
    });
    
    if (!client) {
      return { success: false, error: "Client not found" };
    }
    
    if (client.anonymizedAt) {
      return { success: false, error: "Client already anonymized" };
    }
    
    // Check for open interventions
    const hasOpenInterventions = client.vehicles.some((v) => v.interventions.length > 0);
    if (hasOpenInterventions) {
      return { success: false, error: "Cannot anonymize: client has open interventions" };
    }
    
    // Check for disputed interventions
    const disputedInterventions = await prisma.intervention.findFirst({
      where: {
        vehicle: { clientId },
        disputeStatus: "OPEN",
      },
    });
    if (disputedInterventions) {
      return { success: false, error: "Cannot anonymize: client has disputed interventions" };
    }
    
    // Create evidence chain entry BEFORE anonymization
    const snapshot = {
      clientId: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
    };
    const snapshotJson = JSON.stringify(snapshot);
    const crypto = await import("crypto");
    const payloadHash = crypto.createHash("sha256").update(snapshotJson).digest("hex");
    
    // Get previous chain entry for this entity
    const previousEntry = await prisma.evidenceChain.findFirst({
      where: { garageId, entityType: "client", entityId: String(clientId) },
      orderBy: { createdAt: "desc" },
    });
    
    const previousHash = previousEntry?.chainHash || null;
    const chainHash = crypto
      .createHash("sha256")
      .update((previousHash || "") + payloadHash)
      .digest("hex");
    
    // Run anonymization in transaction
    await prisma.$transaction([
      // Create evidence chain entry
      prisma.evidenceChain.create({
        data: {
          garageId,
          entityType: "client",
          entityId: String(clientId),
          eventType: "anonymize",
          payload: snapshotJson,
          payloadHash,
          previousHash,
          chainHash,
          userId,
          reason,
        },
      }),
      // Anonymize client
      prisma.client.update({
        where: { id: clientId },
        data: {
          firstName: "[ANONYMISÉ]",
          lastName: "[ANONYMISÉ]",
          email: null,
          phone: null,
          address: null,
          notes: null,
          anonymizedAt: new Date(),
          anonymizedBy: userId,
        },
      }),
    ]);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// GDPR DATA EXPORT
// ============================================================================

export interface GdprExportData {
  exportedAt: string;
  exportedBy: string;
  garage?: {
    id: number;
    name: string;
    siret: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    vehicles: {
      id: string;
      brand: string;
      model: string;
      plate: string;
      vin: string | null;
    }[];
    interventions: {
      id: string;
      type: string;
      status: string;
      createdAt: string;
    }[];
    quotes: { id: string; quoteNumber: string | null; createdAt: string }[];
    invoices: { id: string; invoiceNumber: string | null; createdAt: string }[];
  };
}

/**
 * Export all data for a garage (admin GDPR export)
 */
export async function exportGarageData(garageId: number, userId: string): Promise<GdprExportData> {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: {
      id: true,
      name: true,
      siret: true,
      email: true,
      phone: true,
      address: true,
    },
  });
  
  if (!garage) {
    throw new Error(`Garage ${garageId} not found`);
  }
  
  // Log the export in evidence chain
  const crypto = await import("crypto");
  const payload = JSON.stringify({ garageId, exportedBy: userId, exportedAt: new Date().toISOString() });
  const payloadHash = crypto.createHash("sha256").update(payload).digest("hex");
  
  const previousEntry = await prisma.evidenceChain.findFirst({
    where: { garageId, entityType: "garage", entityId: String(garageId), eventType: "export" },
    orderBy: { createdAt: "desc" },
  });
  
  const previousHash = previousEntry?.chainHash || null;
  const chainHash = crypto.createHash("sha256").update((previousHash || "") + payloadHash).digest("hex");
  
  await prisma.evidenceChain.create({
    data: {
      garageId,
      entityType: "garage",
      entityId: String(garageId),
      eventType: "export",
      payload,
      payloadHash,
      previousHash,
      chainHash,
      userId,
      reason: "GDPR data export request",
    },
  });
  
  return {
    exportedAt: new Date().toISOString(),
    exportedBy: userId,
    garage,
  };
}

/**
 * Export all data for a client (GDPR right of access)
 */
export async function exportClientData(
  garageId: number,
  clientId: number,
  userId: string
): Promise<GdprExportData> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, garageId },
    include: {
      vehicles: {
        select: {
          id: true,
          brand: true,
          model: true,
          plate: true,
          vin: true,
          interventions: {
            select: {
              id: true,
              type: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
      quotes: {
        select: {
          id: true,
          quoteNumber: true,
          createdAt: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          createdAt: true,
        },
      },
    },
  });
  
  if (!client) {
    throw new Error(`Client ${clientId} not found in garage ${garageId}`);
  }
  
  // Flatten interventions from all vehicles
  const interventions = client.vehicles.flatMap((v) => v.interventions);
  
  // Log the export in evidence chain
  const crypto = await import("crypto");
  const payload = JSON.stringify({
    garageId,
    clientId,
    exportedBy: userId,
    exportedAt: new Date().toISOString(),
  });
  const payloadHash = crypto.createHash("sha256").update(payload).digest("hex");
  
  const previousEntry = await prisma.evidenceChain.findFirst({
    where: { garageId, entityType: "client", entityId: String(clientId), eventType: "export" },
    orderBy: { createdAt: "desc" },
  });
  
  const previousHash = previousEntry?.chainHash || null;
  const chainHash = crypto.createHash("sha256").update((previousHash || "") + payloadHash).digest("hex");
  
  await prisma.evidenceChain.create({
    data: {
      garageId,
      entityType: "client",
      entityId: String(clientId),
      eventType: "export",
      payload,
      payloadHash,
      previousHash,
      chainHash,
      userId,
      reason: "GDPR client data export request",
    },
  });
  
  return {
    exportedAt: new Date().toISOString(),
    exportedBy: userId,
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      createdAt: client.createdAt.toISOString(),
      vehicles: client.vehicles.map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        plate: v.plate,
        vin: v.vin,
      })),
      interventions: interventions.map((i) => ({
        id: i.id,
        type: i.type,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
      })),
      quotes: client.quotes.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        createdAt: q.createdAt.toISOString(),
      })),
      invoices: client.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        createdAt: inv.createdAt.toISOString(),
      })),
    },
  };
}
