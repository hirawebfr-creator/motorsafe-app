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
