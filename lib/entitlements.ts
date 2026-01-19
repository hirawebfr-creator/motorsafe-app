/**
 * Entitlements System - Feature Gating by Plan
 * 
 * Central source of truth for what each plan can access.
 * All feature gates MUST go through this module for server-side enforcement.
 */

import { prisma } from "@/lib/prisma";
import { RouteError } from "@/lib/routeErrors";

// ============================================
// FEATURE KEYS (enum-like constants)
// ============================================

export const FeatureKey = {
  // Core features
  SIGNATURE: "SIGNATURE",
  PDF_MASTER: "PDF_MASTER",
  EXPORT_ZIP: "EXPORT_ZIP",
  VEHICLE_LOOKUP: "VEHICLE_LOOKUP",
  
  // Document types
  INSURANCE_DOC: "INSURANCE_DOC",
  LEGAL_MEMO: "LEGAL_MEMO",
  INCIDENT_REPORT: "INCIDENT_REPORT",
  
  // Advanced features
  DEVIS_FACTURES: "DEVIS_FACTURES",
  ADVANCED_STATS: "ADVANCED_STATS",
  MULTI_USERS: "MULTI_USERS",
  PRIORITY_SUPPORT: "PRIORITY_SUPPORT",
  
  // PAYMENTS-01: Online invoice payments via Stripe
  PAYMENTS: "PAYMENTS",
  
  // APPOINTMENTS-01: Appointment scheduling with reminders
  APPOINTMENTS: "APPOINTMENTS",
  
  // WORKSHOP-OPS-01: Workshop operations features
  REPAIR_ORDER: "REPAIR_ORDER",       // Ordre de Réparation
  RETURN_REPORT: "RETURN_REPORT",     // PV de restitution
  LOAN_VEHICLE: "LOAN_VEHICLE",       // Véhicule de prêt
  
  // WHITE-LABEL-PARTNERS-01: Branding features
  BRANDING: "BRANDING",               // Logo sur PDF/emails (STARTER+)
  PARTNER_BADGE: "PARTNER_BADGE",     // Badge partenaire + page publique (PRO)
  
  // IMPORT-ONBOARDING-01: CSV import feature
  IMPORT: "IMPORT",                   // CSV import clients/vehicles (STARTER+)
  
  // LEGAL-PACK-01: Legal document features
  CUSTOM_CLAUSES: "CUSTOM_CLAUSES",   // Custom clause sets per intervention type (PRO only)
  
  // Future (gated but not implemented)
  AI_ASSIST: "AI_ASSIST",
} as const;

export type FeatureKeyType = typeof FeatureKey[keyof typeof FeatureKey];

// ============================================
// PLAN TYPES
// ============================================

export type PlanKey = "FREE" | "STARTER" | "PRO";

export type SubscriptionStatus = 
  | "INCOMPLETE" 
  | "INCOMPLETE_EXPIRED" 
  | "TRIALING" 
  | "ACTIVE" 
  | "PAST_DUE" 
  | "CANCELED" 
  | "UNPAID";

// ============================================
// PLAN ENTITLEMENTS CONFIG
// ============================================
// Easy to adjust without refactoring code
// Quotas aligned with business model (protect API costs)

export interface PlanEntitlements {
  features: FeatureKeyType[];
  quotas: {
    vehicleLookupPerMonth: number;
    aiRequestsPerMonth: number;
    signaturesPerMonth: number;  // -1 = unlimited
    importRowsPerBatch: number;  // IMPORT-ONBOARDING-01: max rows per CSV import
  };
  limits: {
    clients: number;
    vehicules: number;
    interventionsPerWeek: number;
    users: number;
  };
}

export const PLAN_ENTITLEMENTS: Record<PlanKey, PlanEntitlements> = {
  // FREE = Trial 30 days
  FREE: {
    features: [
      // Trial gets basic features with watermark/limits
      FeatureKey.SIGNATURE,
      FeatureKey.PDF_MASTER,
      FeatureKey.VEHICLE_LOOKUP,
    ],
    quotas: {
      vehicleLookupPerMonth: 20,
      aiRequestsPerMonth: 30,
      signaturesPerMonth: 20,
      importRowsPerBatch: 20,  // IMPORT-ONBOARDING-01: Trial limit
    },
    limits: {
      clients: 30,
      vehicules: 30,
      interventionsPerWeek: Infinity,
      users: 1,
    },
  },
  
  // STARTER = Essentiel 49€/mo
  STARTER: {
    features: [
      FeatureKey.SIGNATURE,
      FeatureKey.PDF_MASTER,
      FeatureKey.EXPORT_ZIP,
      FeatureKey.VEHICLE_LOOKUP,
      FeatureKey.INSURANCE_DOC,
      FeatureKey.DEVIS_FACTURES,
      FeatureKey.APPOINTMENTS, // APPOINTMENTS-01: ESSENTIAL+
      FeatureKey.REPAIR_ORDER, // WORKSHOP-OPS-01: OR + signatures
      FeatureKey.RETURN_REPORT, // WORKSHOP-OPS-01: PV restitution
      FeatureKey.BRANDING, // WHITE-LABEL-PARTNERS-01: Logo sur PDF/emails
      FeatureKey.IMPORT, // IMPORT-ONBOARDING-01: CSV import
    ],
    quotas: {
      vehicleLookupPerMonth: 60,
      aiRequestsPerMonth: 150,
      signaturesPerMonth: -1,  // unlimited
      importRowsPerBatch: 2000,  // IMPORT-ONBOARDING-01: ESSENTIAL limit
    },
    limits: {
      clients: Infinity,
      vehicules: Infinity,
      interventionsPerWeek: Infinity,
      users: 2,
    },
  },
  
  // PRO = 129€/mo
  PRO: {
    features: [
      FeatureKey.SIGNATURE,
      FeatureKey.PDF_MASTER,
      FeatureKey.EXPORT_ZIP,
      FeatureKey.VEHICLE_LOOKUP,
      FeatureKey.INSURANCE_DOC,
      FeatureKey.LEGAL_MEMO,
      FeatureKey.INCIDENT_REPORT,
      FeatureKey.DEVIS_FACTURES,
      FeatureKey.ADVANCED_STATS,
      FeatureKey.MULTI_USERS,
      FeatureKey.PRIORITY_SUPPORT,
      FeatureKey.AI_ASSIST,
      FeatureKey.PAYMENTS, // PAYMENTS-01: PRO only for MVP
      FeatureKey.APPOINTMENTS, // APPOINTMENTS-01: ESSENTIAL+
      FeatureKey.REPAIR_ORDER, // WORKSHOP-OPS-01: OR + signatures
      FeatureKey.RETURN_REPORT, // WORKSHOP-OPS-01: PV restitution
      FeatureKey.LOAN_VEHICLE, // WORKSHOP-OPS-01: Véhicule de prêt (PRO only)
      FeatureKey.BRANDING, // WHITE-LABEL-PARTNERS-01: Logo sur PDF/emails
      FeatureKey.PARTNER_BADGE, // WHITE-LABEL-PARTNERS-01: Badge partenaire + page publique
      FeatureKey.IMPORT, // IMPORT-ONBOARDING-01: CSV import
      FeatureKey.CUSTOM_CLAUSES, // LEGAL-PACK-01: Custom clause sets (PRO only)
    ],
    quotas: {
      vehicleLookupPerMonth: 400,
      aiRequestsPerMonth: 800,
      signaturesPerMonth: -1,  // unlimited
      importRowsPerBatch: -1,  // IMPORT-ONBOARDING-01: PRO unlimited
    },
    limits: {
      clients: Infinity,
      vehicules: Infinity,
      interventionsPerWeek: Infinity,
      users: 6,
    },
  },
};

// ============================================
// ACTIVE STATUS HELPER
// ============================================

const ACTIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING", "PAST_DUE"];

export function isSubscriptionActive(status: SubscriptionStatus | string | null): boolean {
  if (!status) return false;
  return ACTIVE_STATUSES.includes(status.toUpperCase() as SubscriptionStatus);
}

// ============================================
// GARAGE ENTITLEMENTS FETCHER
// ============================================

export interface GarageEntitlements {
  garageId: number;
  planKey: PlanKey;
  subscriptionStatus: SubscriptionStatus;
  isActive: boolean;
  features: FeatureKeyType[];
  quotas: PlanEntitlements["quotas"];
  limits: PlanEntitlements["limits"];
}

/**
 * Fetch entitlements for a garage
 * Returns the effective plan and all allowed features
 */
export async function getGarageEntitlements(garageId: number): Promise<GarageEntitlements> {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: {
      id: true,
      plan: true,
      subscriptionStatus: true,
    },
  });

  if (!garage) {
    throw new RouteError(404, "NOT_FOUND", "Garage introuvable");
  }

  const planKey = (garage.plan as PlanKey) ?? "FREE";
  const subscriptionStatus = (garage.subscriptionStatus as SubscriptionStatus) ?? "INCOMPLETE";
  const isActive = isSubscriptionActive(subscriptionStatus);

  // If subscription is not active, downgrade to FREE entitlements
  const effectivePlan = isActive ? planKey : "FREE";
  const entitlements = PLAN_ENTITLEMENTS[effectivePlan];

  return {
    garageId: garage.id,
    planKey: effectivePlan,
    subscriptionStatus,
    isActive,
    features: entitlements.features,
    quotas: entitlements.quotas,
    limits: entitlements.limits,
  };
}

/**
 * Check if a garage has access to a specific feature
 */
export async function hasFeature(garageId: number, feature: FeatureKeyType): Promise<boolean> {
  const entitlements = await getGarageEntitlements(garageId);
  return entitlements.features.includes(feature);
}

/**
 * Get display name for a plan (used in UI)
 * WHITE-LABEL-PARTNERS-01
 */
export function getPlanDisplayName(plan: PlanKey | string): string {
  switch (plan) {
    case "FREE":
      return "Essai";
    case "STARTER":
      return "Essentiel";
    case "PRO":
      return "Pro";
    default:
      return "Essai";
  }
}

// ============================================
// ENFORCEMENT HELPERS (throw on deny)
// ============================================

/**
 * Require an active subscription (at least STARTER)
 * Throws SUBSCRIPTION_REQUIRED if not active
 */
export async function requireActivePlan(garageId: number): Promise<GarageEntitlements> {
  const entitlements = await getGarageEntitlements(garageId);
  
  if (!entitlements.isActive || entitlements.planKey === "FREE") {
    throw new RouteError(
      402,
      "SUBSCRIPTION_REQUIRED",
      "Abonnement requis pour accéder à cette fonctionnalité. Passez au plan Starter ou Pro."
    );
  }
  
  return entitlements;
}

/**
 * Require a specific feature
 * Throws FEATURE_NOT_AVAILABLE if not allowed
 */
export async function requireFeature(garageId: number, feature: FeatureKeyType): Promise<GarageEntitlements> {
  const entitlements = await getGarageEntitlements(garageId);

  if (!entitlements.isActive) {
    throw new RouteError(
      402,
      "SUBSCRIPTION_REQUIRED",
      "Abonnement requis pour accéder à cette fonctionnalité."
    );
  }

  if (!entitlements.features.includes(feature)) {
    throw new RouteError(
      403,
      "FEATURE_NOT_AVAILABLE",
      `Cette fonctionnalité nécessite un plan supérieur. Passez au plan Pro pour y accéder.`
    );
  }

  return entitlements;
}

/**
 * Require PRO plan specifically
 */
export async function requireProPlan(garageId: number): Promise<GarageEntitlements> {
  const entitlements = await getGarageEntitlements(garageId);

  if (!entitlements.isActive || entitlements.planKey !== "PRO") {
    throw new RouteError(
      403,
      "PRO_REQUIRED",
      "Cette fonctionnalité est réservée au plan Pro."
    );
  }

  return entitlements;
}

// ============================================
// QUOTA USAGE TRACKING
// ============================================

/**
 * Get current month key for quota tracking (e.g., "2026-01")
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get start of current month as Date
 */
export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export type QuotaType = keyof PlanEntitlements["quotas"];

export interface QuotaUsageResult {
  type: QuotaType;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}

/**
 * Get current quota usage for a garage
 * Fetches counts from respective tables based on quota type
 */
export async function getQuotaUsage(
  garageId: number,
  quotaType: QuotaType
): Promise<QuotaUsageResult> {
  const entitlements = await getGarageEntitlements(garageId);
  const limit = entitlements.quotas[quotaType];
  const unlimited = limit === -1;
  
  let used = 0;
  const monthKey = getCurrentMonthKey();
  const startOfMonth = getStartOfMonth();
  
  switch (quotaType) {
    case "vehicleLookupPerMonth": {
      const usage = await prisma.vehicleLookupUsage.findUnique({
        where: { garageId_monthKey: { garageId, monthKey } },
        select: { count: true },
      });
      used = usage?.count ?? 0;
      break;
    }
    
    case "aiRequestsPerMonth": {
      const count = await prisma.aiUsageLog.count({
        where: {
          garageId,
          createdAt: { gte: startOfMonth },
        },
      });
      used = count;
      break;
    }
    
    case "signaturesPerMonth": {
      const count = await prisma.signatureRequest.count({
        where: {
          garageId,
          createdAt: { gte: startOfMonth },
          status: { not: "DRAFT" },  // Only count sent signatures
        },
      });
      used = count;
      break;
    }
  }
  
  return {
    type: quotaType,
    used,
    limit: unlimited ? Infinity : limit,
    remaining: unlimited ? Infinity : Math.max(0, limit - used),
    unlimited,
  };
}

/**
 * Get all quota usages for a garage (for billing UI)
 */
export async function getAllQuotaUsages(garageId: number): Promise<QuotaUsageResult[]> {
  const quotaTypes: QuotaType[] = [
    "vehicleLookupPerMonth",
    "aiRequestsPerMonth",
    "signaturesPerMonth",
  ];
  
  return Promise.all(quotaTypes.map((type) => getQuotaUsage(garageId, type)));
}

/**
 * Increment vehicle lookup usage
 * Uses upsert for atomic operation
 * AUTOMATIONS-01: Creates quota alert job if threshold reached
 */
export async function incrementLookupUsage(garageId: number): Promise<void> {
  const monthKey = getCurrentMonthKey();
  
  const result = await prisma.vehicleLookupUsage.upsert({
    where: { garageId_monthKey: { garageId, monthKey } },
    create: { garageId, monthKey, count: 1 },
    update: { count: { increment: 1 } },
  });
  
  // Check if we crossed quota threshold (80% or 100%)
  try {
    const entitlements = await getGarageEntitlements(garageId);
    const limit = entitlements.quotas.vehicleLookupPerMonth;
    if (limit > 0) { // Not unlimited
      const usage = result.count;
      const pct = (usage / limit) * 100;
      
      if (pct >= 80 && pct < 100) {
        // Dynamically import to avoid circular dependency
        const { createQuotaAlertJob } = await import("@/lib/automations");
        await createQuotaAlertJob(garageId, "vehicleLookup", 80, monthKey);
      } else if (pct >= 100) {
        const { createQuotaAlertJob } = await import("@/lib/automations");
        await createQuotaAlertJob(garageId, "vehicleLookup", 100, monthKey);
      }
    }
  } catch (alertErr) {
    // Don't fail the main operation if alert fails
    console.warn("[Quota] Failed to create quota alert:", alertErr);
  }
}

// ============================================
// QUOTA CHECK HELPERS (enhanced)
// ============================================

/**
 * Check if quota allows an action (does not throw)
 * Now fetches actual usage from DB
 */
export async function checkQuota(
  garageId: number,
  quotaType: QuotaType
): Promise<{ allowed: boolean; limit: number; remaining: number; used: number }> {
  const usage = await getQuotaUsage(garageId, quotaType);
  
  return {
    allowed: usage.unlimited || usage.used < usage.limit,
    limit: usage.limit === Infinity ? -1 : usage.limit,
    remaining: usage.remaining === Infinity ? -1 : usage.remaining,
    used: usage.used,
  };
}

/**
 * Require quota available (throws QUOTA_EXCEEDED if not)
 */
export async function requireQuota(
  garageId: number,
  quotaType: QuotaType
): Promise<void> {
  const { allowed, limit } = await checkQuota(garageId, quotaType);
  
  if (!allowed) {
    const quotaNames: Record<QuotaType, string> = {
      vehicleLookupPerMonth: "Recherches véhicule",
      aiRequestsPerMonth: "Requêtes IA",
      signaturesPerMonth: "Signatures",
      importRowsPerBatch: "Lignes par import CSV",
    };
    
    throw new RouteError(
      429,
      "QUOTA_EXCEEDED",
      `Quota mensuel atteint pour "${quotaNames[quotaType]}" (${limit}). Passez au plan supérieur pour plus de quota.`
    );
  }
}

// ============================================
// MULTI-TENANT SCOPE ASSERTION
// ============================================

/**
 * Assert that a resource belongs to the current garage
 * Throws 404 (not 403) to avoid leaking resource existence
 */
export function assertGarageScope(
  resourceGarageId: number | null | undefined,
  currentGarageId: number
): void {
  if (resourceGarageId !== currentGarageId) {
    // Return 404 to avoid leaking existence of resources from other garages
    throw new RouteError(404, "NOT_FOUND", "Ressource introuvable");
  }
}

/**
 * Assert scope for admin (who can access any garage) or regular user
 */
export function assertGarageScopeOrAdmin(
  resourceGarageId: number | null | undefined,
  currentGarageId: number | null,
  isAdmin: boolean
): void {
  if (isAdmin) return; // Admins can access any garage
  
  if (!currentGarageId || resourceGarageId !== currentGarageId) {
    throw new RouteError(404, "NOT_FOUND", "Ressource introuvable");
  }
}

// ============================================
// UI/API RESPONSE HELPER
// ============================================

/**
 * Get entitlements for API response (billing/status)
 * Safe to expose to frontend
 */
export async function getEntitlementsForResponse(garageId: number) {
  const entitlements = await getGarageEntitlements(garageId);
  const quotaUsages = await getAllQuotaUsages(garageId);
  
  // Convert quota usages to a map
  const quotaUsageMap: Record<string, { used: number; limit: number; remaining: number; unlimited: boolean }> = {};
  for (const usage of quotaUsages) {
    quotaUsageMap[usage.type] = {
      used: usage.used,
      limit: usage.limit === Infinity ? -1 : usage.limit,
      remaining: usage.remaining === Infinity ? -1 : usage.remaining,
      unlimited: usage.unlimited,
    };
  }
  
  return {
    planKey: entitlements.planKey,
    subscriptionStatus: entitlements.subscriptionStatus,
    isActive: entitlements.isActive,
    featuresAllowed: entitlements.features,
    quotas: entitlements.quotas,
    quotaUsage: quotaUsageMap,
    limits: {
      clients: entitlements.limits.clients === Infinity ? null : entitlements.limits.clients,
      vehicules: entitlements.limits.vehicules === Infinity ? null : entitlements.limits.vehicules,
      interventionsPerWeek: entitlements.limits.interventionsPerWeek === Infinity ? null : entitlements.limits.interventionsPerWeek,
      users: entitlements.limits.users,
    },
  };
}
