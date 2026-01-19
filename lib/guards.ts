/**
 * SECURITY-AUDIT-01: Authentication & Authorization Guards
 *
 * This module provides all authentication, authorization, and multi-tenant
 * isolation guards for API routes.
 *
 * KEY SECURITY PRINCIPLES:
 * 1. Every tenanted route MUST use garageId scope (see tenantWhere helper)
 * 2. Wrong tenant = 404 NOT 403 (prevents enumeration attacks)
 * 3. Use assertRecordBelongsToTenant AFTER fetching records
 * 4. ADMIN users can access all data (for support/debugging)
 *
 * @see docs/SECURITY_CHECKLIST.md for complete security documentation
 *
 * @example
 * // Standard protected route pattern:
 * export async function GET(req: Request) {
 *   const user = requireApprovedTenant(await requireUser(req));
 *   const where = tenantWhere(user, { deletedAt: null });
 *   const records = await prisma.client.findMany({ where });
 *   return NextResponse.json(success(records));
 * }
 *
 * @example
 * // Checking record ownership:
 * const record = await prisma.intervention.findUnique({ where: { id } });
 * assertRecordBelongsToTenant(record, user.garageId, "Intervention");
 */
import { getSessionUser, isApprovedGarage, type SessionUser } from "@/lib/auth";
import { RouteError } from "@/lib/routeErrors";

export type AppRole = SessionUser["role"];
export type Plan = "FREE" | "STARTER" | "PRO";

// ============================================
// LIMITES PAR PLAN
// ============================================
// FREE: limites sur 7 jours glissants
// STARTER/PRO: limites globales ou illimitées
export const PLAN_LIMITS = {
  FREE: {
    clients: 5,
    vehicules: 5,
    interventionsPer7Days: 5,
    pdfDownloadsPer7Days: 5,
    hasDevisFactures: false,
    hasDocuments: false,
    hasAdvancedStats: false,
    hasMultiUsers: false,
    hasPrioritySupport: false,
  },
  STARTER: {
    clients: 50,
    vehicules: 50,
    interventionsPer7Days: Infinity,
    pdfDownloadsPer7Days: Infinity,
    hasDevisFactures: true,
    hasDocuments: true,
    hasAdvancedStats: false,
    hasMultiUsers: false,
    hasPrioritySupport: false,
  },
  PRO: {
    clients: Infinity,
    vehicules: Infinity,
    interventionsPer7Days: Infinity,
    pdfDownloadsPer7Days: Infinity,
    hasDevisFactures: true,
    hasDocuments: true,
    hasAdvancedStats: true,
    hasMultiUsers: true,
    hasPrioritySupport: true,
  },
} as const;

// Message d'upgrade pour le plan FREE
export const FREE_UPGRADE_MESSAGE = "Passez au plan Starter (49€/mois) ou Pro (129€/mois) pour débloquer plus de fonctionnalités !";

// ============================================
// GUARDS DE BASE
// ============================================

export async function requireUser(req: Request): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new RouteError(401, "UNAUTHORIZED", "Non autorise");
  return user;
}

export function requireApprovedTenant(user: SessionUser): SessionUser {
  if (!isApprovedGarage(user)) {
    throw new RouteError(403, "FORBIDDEN", "Compte en attente de validation.");
  }
  return user;
}

export function getTenantId(user: SessionUser): number {
  if (user.role === "ADMIN") {
    throw new RouteError(400, "TENANT_REQUIRED", "Tenant requis pour cette action.");
  }
  if (!user.garageId) {
    throw new RouteError(400, "TENANT_REQUIRED", "Garage invalide.");
  }
  return user.garageId;
}

/**
 * Pour les admins: permet d'émuler un garage via header ou query param
 * Retourne le garageId à utiliser (réel ou émulé)
 */
export function getTenantIdWithAdminOverride(user: SessionUser, req?: Request): number | null {
  // Si pas admin, comportement normal
  if (user.role !== "ADMIN") {
    if (!user.garageId) return null;
    return user.garageId;
  }
  
  // Admin: vérifier header ou query param pour émulation
  if (req) {
    // Check header first: X-Emulate-Garage
    const emulateHeader = req.headers.get("x-emulate-garage");
    if (emulateHeader) {
      const garageId = parseInt(emulateHeader, 10);
      if (!isNaN(garageId) && garageId > 0) return garageId;
    }
    
    // Check query param: ?garageId=123
    try {
      const url = new URL(req.url);
      const garageIdParam = url.searchParams.get("garageId");
      if (garageIdParam) {
        const garageId = parseInt(garageIdParam, 10);
        if (!isNaN(garageId) && garageId > 0) return garageId;
      }
    } catch {
      // URL parse error, ignore
    }
  }
  
  // Admin sans émulation: retourne null (accès global)
  return null;
}

/**
 * Version qui throw si pas de garage (pour endpoints qui exigent un tenant)
 */
export function requireTenantIdWithAdminOverride(user: SessionUser, req?: Request): number {
  const garageId = getTenantIdWithAdminOverride(user, req);
  if (!garageId) {
    if (user.role === "ADMIN") {
      throw new RouteError(400, "TENANT_REQUIRED", "Sélectionnez un garage à émuler (header X-Emulate-Garage ou ?garageId=)");
    }
    throw new RouteError(400, "TENANT_REQUIRED", "Garage invalide.");
  }
  return garageId;
}

export function requireRole(user: SessionUser, roles: AppRole[]) {
  if (roles.includes(user.role)) return;

  // Backward-compat: GARAGE historically == tenant owner.
  const normalized = user.role === "GARAGE" ? "OWNER" : user.role;
  const normalizedRoles = roles.map((r) => (r === "GARAGE" ? "OWNER" : r));

  if (normalizedRoles.includes(normalized as any)) return;

  throw new RouteError(403, "FORBIDDEN", "Acces refuse.");
}

// ============================================
// GUARDS D'ABONNEMENT
// ============================================

/** Retourne le plan effectif de l'utilisateur */
export function getUserPlan(user: SessionUser): Plan {
  if (user.role === "ADMIN") return "PRO"; // Admins ont accès PRO
  
  const status = user.garage?.subscriptionStatus;
  const isActive = status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
  
  if (!isActive) return "FREE";
  
  return (user.garage?.plan as Plan) ?? "FREE";
}

/** Vérifie si l'utilisateur a au moins le plan minimum requis */
export function hasPlan(user: SessionUser, minPlan: Plan): boolean {
  const userPlan = getUserPlan(user);
  const planOrder: Plan[] = ["FREE", "STARTER", "PRO"];
  return planOrder.indexOf(userPlan) >= planOrder.indexOf(minPlan);
}

/** Retourne les limites du plan de l'utilisateur */
export function getPlanLimits(user: SessionUser) {
  const plan = getUserPlan(user);
  return PLAN_LIMITS[plan];
}

// Compatibilité avec l'ancien code
export function isProActive(user: SessionUser) {
  return hasPlan(user, "PRO");
}

/** Exige au moins STARTER (ou plus) pour accéder */
export function requireStarterOrHigher(user: SessionUser) {
  if (user.role === "ADMIN") return;
  if (!hasPlan(user, "STARTER")) {
    throw new RouteError(402, "SUBSCRIPTION_REQUIRED", "Abonnement Starter ou Pro requis.");
  }
}

/** Exige PRO pour accéder */
export function requirePro(user: SessionUser) {
  if (user.role === "ADMIN") return;
  if (!hasPlan(user, "PRO")) {
    throw new RouteError(402, "SUBSCRIPTION_REQUIRED", "Abonnement Pro requis.");
  }
}

/** Alias pour compatibilité - exige STARTER minimum */
export function requireActiveSubscription(user: SessionUser) {
  requireStarterOrHigher(user);
}

// ============================================
// GUARDS POUR ROUTES PUBLIQUES (tokenisées)
// ============================================

type GarageSubscriptionStatus = "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID";
type GaragePlan = "FREE" | "STARTER" | "PRO";

interface GarageSubscriptionInfo {
  subscriptionStatus: GarageSubscriptionStatus;
  plan: GaragePlan;
}

/** Vérifie si un garage a un abonnement actif (pour routes publiques tokenisées) */
export function isGarageSubscriptionActive(garage: GarageSubscriptionInfo): boolean {
  const status = garage.subscriptionStatus;
  const isActive = status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
  if (!isActive) return false;
  // Check plan is at least STARTER
  const plan = garage.plan;
  return plan === "STARTER" || plan === "PRO";
}

/** Throws SUBSCRIPTION_INACTIVE si le garage n'a pas d'abonnement actif (pour routes publiques) */
export function assertGarageHasActiveSubscription(garage: GarageSubscriptionInfo): void {
  if (!isGarageSubscriptionActive(garage)) {
    throw new RouteError(
      402,
      "SUBSCRIPTION_INACTIVE",
      "Le garage n'a pas d'abonnement actif. Veuillez contacter le garage pour qu'il activate son abonnement."
    );
  }
}

// ============================================
// GUARDS MULTI-TENANT SECURITY
// ============================================

/**
 * SECURITY-AUDIT-01: Assert that a fetched record belongs to the user's garage
 * 
 * CRITICAL: Use this AFTER fetching a record to ensure it belongs to the tenant.
 * Always throws 404 (not 403) to prevent enumeration attacks.
 * 
 * @example
 * const client = await prisma.client.findUnique({ where: { id } });
 * assertRecordBelongsToTenant(client, user.garageId);
 * // If client doesn't belong to garage, throws 404
 */
export function assertRecordBelongsToTenant<T extends { garageId?: number | null }>(
  record: T | null | undefined,
  userGarageId: number | null,
  entityName = "Ressource"
): asserts record is T {
  // Record not found
  if (!record) {
    throw new RouteError(404, "NOT_FOUND", `${entityName} introuvable`);
  }
  
  // Skip check for ADMIN (they can access all)
  if (userGarageId === null) {
    return;
  }
  
  // Record doesn't belong to user's garage - return 404 (not 403!) to prevent enumeration
  if (record.garageId !== userGarageId) {
    throw new RouteError(404, "NOT_FOUND", `${entityName} introuvable`);
  }
}

/**
 * SECURITY-AUDIT-01: Assert for organisationId field (used by quotes/invoices)
 */
export function assertRecordBelongsToOrganisation<T extends { organisationId?: number | null }>(
  record: T | null | undefined,
  userGarageId: number | null,
  entityName = "Ressource"
): asserts record is T {
  if (!record) {
    throw new RouteError(404, "NOT_FOUND", `${entityName} introuvable`);
  }
  
  if (userGarageId === null) {
    return; // ADMIN bypass
  }
  
  if (record.organisationId !== userGarageId) {
    throw new RouteError(404, "NOT_FOUND", `${entityName} introuvable`);
  }
}

/**
 * SECURITY-AUDIT-01: Build a Prisma where clause that enforces tenant isolation
 * 
 * @example
 * const where = tenantWhere(user, { status: "ACTIVE" });
 * // Returns: { status: "ACTIVE", garageId: 123 } for regular users
 * // Returns: { status: "ACTIVE" } for ADMIN
 */
export function tenantWhere(
  user: SessionUser,
  baseWhere: Record<string, unknown> = {},
  garageIdField = "garageId"
): Record<string, unknown> {
  if (user.role === "ADMIN") {
    return baseWhere;
  }
  
  return {
    ...baseWhere,
    [garageIdField]: user.garageId ?? -1,
  };
}

/**
 * SECURITY-AUDIT-01: Build a Prisma where clause for organisation field
 */
export function organisationWhere(
  user: SessionUser,
  baseWhere: Record<string, unknown> = {}
): Record<string, unknown> {
  return tenantWhere(user, baseWhere, "organisationId");
}

/**
 * SECURITY-AUDIT-01: Safe 404 helper - always returns 404 for security
 * Use this instead of conditional 403/404 to prevent enumeration
 */
export function throwNotFound(entityName = "Ressource"): never {
  throw new RouteError(404, "NOT_FOUND", `${entityName} introuvable`);
}
