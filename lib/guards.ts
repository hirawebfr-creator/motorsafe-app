import { getSessionUser, isApprovedGarage, type SessionUser } from "@/lib/auth";
import { RouteError } from "@/lib/routeErrors";

export type AppRole = SessionUser["role"];

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

export function isProActive(user: SessionUser) {
  return user.garage?.plan === "PRO" && user.garage?.subscriptionStatus === "ACTIVE";
}

export function requireActiveSubscription(user: SessionUser) {
  if (user.role === "ADMIN") return;
  if (!isProActive(user)) {
    throw new RouteError(402, "SUBSCRIPTION_REQUIRED", "Abonnement requis.");
  }
}
