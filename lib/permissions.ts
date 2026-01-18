/**
 * MULTI-USER-ROLES-01: Centralized Permissions System
 * 
 * Server-side permission enforcement for garage team members.
 * All permission checks MUST go through this module.
 */

import { prisma } from "@/lib/prisma";
import { RouteError } from "@/lib/routeErrors";
import type { SessionUser } from "@/lib/auth";

// ============================================
// PERMISSION KEYS
// ============================================

export const Permission = {
  // Client management
  CLIENTS_READ: "CLIENTS_READ",
  CLIENTS_WRITE: "CLIENTS_WRITE",
  CLIENTS_DELETE: "CLIENTS_DELETE",
  
  // Vehicle management
  VEHICLES_READ: "VEHICLES_READ",
  VEHICLES_WRITE: "VEHICLES_WRITE",
  VEHICLES_DELETE: "VEHICLES_DELETE",
  
  // Intervention management
  INTERVENTIONS_READ: "INTERVENTIONS_READ",
  INTERVENTIONS_WRITE: "INTERVENTIONS_WRITE",
  INTERVENTIONS_DELETE: "INTERVENTIONS_DELETE",
  
  // Documents
  DOCUMENTS_READ: "DOCUMENTS_READ",
  DOCUMENTS_WRITE: "DOCUMENTS_WRITE",
  DOCUMENTS_DELETE: "DOCUMENTS_DELETE",
  
  // Quotes & Invoices
  QUOTES_READ: "QUOTES_READ",
  QUOTES_WRITE: "QUOTES_WRITE",
  INVOICES_READ: "INVOICES_READ",
  INVOICES_WRITE: "INVOICES_WRITE",
  
  // Billing & Payments (sensitive)
  BILLING_READ: "BILLING_READ",
  BILLING_MANAGE: "BILLING_MANAGE",
  PAYMENTS_MANAGE: "PAYMENTS_MANAGE",
  
  // Settings (sensitive)
  SETTINGS_READ: "SETTINGS_READ",
  SETTINGS_MANAGE: "SETTINGS_MANAGE",
  RETENTION_MANAGE: "RETENTION_MANAGE",
  
  // Export (sensitive)
  EXPORT_ZIP: "EXPORT_ZIP",
  
  // Team management
  TEAM_READ: "TEAM_READ",
  TEAM_MANAGE: "TEAM_MANAGE",
  
  // AI features
  AI_ASSIST: "AI_ASSIST",
  
  // Planning
  APPOINTMENTS_READ: "APPOINTMENTS_READ",
  APPOINTMENTS_WRITE: "APPOINTMENTS_WRITE",
} as const;

export type PermissionKey = typeof Permission[keyof typeof Permission];

// ============================================
// GARAGE ROLES
// ============================================

export type GarageRoleType = "OWNER" | "MANAGER" | "STAFF" | "RECEPTION" | "READONLY";

// ============================================
// ROLE -> PERMISSIONS MAPPING
// ============================================

const ROLE_PERMISSIONS: Record<GarageRoleType, PermissionKey[]> = {
  // OWNER: Full access
  OWNER: Object.values(Permission),
  
  // MANAGER: Almost full access, no settings/retention
  MANAGER: [
    Permission.CLIENTS_READ,
    Permission.CLIENTS_WRITE,
    Permission.CLIENTS_DELETE,
    Permission.VEHICLES_READ,
    Permission.VEHICLES_WRITE,
    Permission.VEHICLES_DELETE,
    Permission.INTERVENTIONS_READ,
    Permission.INTERVENTIONS_WRITE,
    Permission.INTERVENTIONS_DELETE,
    Permission.DOCUMENTS_READ,
    Permission.DOCUMENTS_WRITE,
    Permission.DOCUMENTS_DELETE,
    Permission.QUOTES_READ,
    Permission.QUOTES_WRITE,
    Permission.INVOICES_READ,
    Permission.INVOICES_WRITE,
    Permission.BILLING_READ,
    Permission.BILLING_MANAGE,
    Permission.PAYMENTS_MANAGE,
    Permission.EXPORT_ZIP,
    Permission.TEAM_READ,
    Permission.TEAM_MANAGE,
    Permission.AI_ASSIST,
    Permission.APPOINTMENTS_READ,
    Permission.APPOINTMENTS_WRITE,
    Permission.SETTINGS_READ,
  ],
  
  // STAFF: Work on interventions, no billing/settings
  STAFF: [
    Permission.CLIENTS_READ,
    Permission.CLIENTS_WRITE,
    Permission.VEHICLES_READ,
    Permission.VEHICLES_WRITE,
    Permission.INTERVENTIONS_READ,
    Permission.INTERVENTIONS_WRITE,
    Permission.DOCUMENTS_READ,
    Permission.DOCUMENTS_WRITE,
    Permission.QUOTES_READ,
    Permission.INVOICES_READ,
    Permission.APPOINTMENTS_READ,
    Permission.APPOINTMENTS_WRITE,
    Permission.TEAM_READ,
  ],
  
  // RECEPTION: Client-facing, scheduling, no interventions write
  RECEPTION: [
    Permission.CLIENTS_READ,
    Permission.CLIENTS_WRITE,
    Permission.VEHICLES_READ,
    Permission.VEHICLES_WRITE,
    Permission.INTERVENTIONS_READ,
    Permission.DOCUMENTS_READ,
    Permission.QUOTES_READ,
    Permission.QUOTES_WRITE,
    Permission.INVOICES_READ,
    Permission.INVOICES_WRITE,
    Permission.APPOINTMENTS_READ,
    Permission.APPOINTMENTS_WRITE,
    Permission.TEAM_READ,
  ],
  
  // READONLY: View only
  READONLY: [
    Permission.CLIENTS_READ,
    Permission.VEHICLES_READ,
    Permission.INTERVENTIONS_READ,
    Permission.DOCUMENTS_READ,
    Permission.QUOTES_READ,
    Permission.INVOICES_READ,
    Permission.APPOINTMENTS_READ,
    Permission.TEAM_READ,
  ],
};

// ============================================
// MEMBER CONTEXT
// ============================================

export interface MemberContext {
  userId: string;
  garageId: number;
  role: GarageRoleType;
  memberId: string;
  permissions: PermissionKey[];
}

/**
 * Get member context for a user in a garage.
 * Handles backward compatibility with legacy User.garageId relation.
 */
export async function getMemberContext(user: SessionUser): Promise<MemberContext | null> {
  // ADMIN always has full access
  if (user.role === "ADMIN") {
    return null; // Admin bypasses permission system
  }
  
  const garageId = user.garageId;
  if (!garageId) return null;
  
  // Try to find membership
  const member = await prisma.garageMember.findFirst({
    where: {
      garageId,
      userId: user.id,
      status: "ACTIVE",
    },
  });
  
  if (member) {
    const role = member.role as GarageRoleType;
    return {
      userId: user.id,
      garageId,
      role,
      memberId: member.id,
      permissions: ROLE_PERMISSIONS[role] ?? [],
    };
  }
  
  // Backward compatibility: User with garageId but no membership = OWNER
  // This handles existing users before multi-user system
  const isLegacyOwner = await prisma.user.findFirst({
    where: {
      id: user.id,
      garageId,
      role: { in: ["GARAGE", "OWNER"] },
    },
  });
  
  if (isLegacyOwner) {
    // Create implicit OWNER membership for legacy users
    const newMember = await prisma.garageMember.upsert({
      where: {
        garageId_userId: { garageId, userId: user.id },
      },
      create: {
        garageId,
        userId: user.id,
        role: "OWNER",
        status: "ACTIVE",
        acceptedAt: new Date(),
      },
      update: {},
    });
    
    return {
      userId: user.id,
      garageId,
      role: "OWNER",
      memberId: newMember.id,
      permissions: ROLE_PERMISSIONS.OWNER,
    };
  }
  
  return null;
}

// ============================================
// PERMISSION CHECK HELPERS
// ============================================

/**
 * Check if user has a specific permission.
 * Returns true if allowed, false otherwise.
 */
export async function hasPermission(user: SessionUser, permission: PermissionKey): Promise<boolean> {
  // ADMIN bypasses all checks
  if (user.role === "ADMIN") return true;
  
  const ctx = await getMemberContext(user);
  if (!ctx) return false;
  
  return ctx.permissions.includes(permission);
}

/**
 * Require a specific permission. Throws 403 if denied.
 */
export async function requirePermission(user: SessionUser, permission: PermissionKey): Promise<MemberContext> {
  // ADMIN bypasses all checks
  if (user.role === "ADMIN") {
    return {
      userId: user.id,
      garageId: 0, // Admin can operate on any garage
      role: "OWNER",
      memberId: "admin",
      permissions: Object.values(Permission),
    };
  }
  
  const ctx = await getMemberContext(user);
  
  if (!ctx) {
    throw new RouteError(403, "FORBIDDEN", "Accès refusé - membre introuvable.");
  }
  
  if (!ctx.permissions.includes(permission)) {
    throw new RouteError(403, "FORBIDDEN", "Vous n'avez pas la permission pour cette action.");
  }
  
  return ctx;
}

/**
 * Require one of the specified roles. Throws 403 if denied.
 */
export async function requireGarageRole(user: SessionUser, allowedRoles: GarageRoleType[]): Promise<MemberContext> {
  // ADMIN bypasses all checks
  if (user.role === "ADMIN") {
    return {
      userId: user.id,
      garageId: 0,
      role: "OWNER",
      memberId: "admin",
      permissions: Object.values(Permission),
    };
  }
  
  const ctx = await getMemberContext(user);
  
  if (!ctx) {
    throw new RouteError(403, "FORBIDDEN", "Accès refusé - membre introuvable.");
  }
  
  if (!allowedRoles.includes(ctx.role)) {
    throw new RouteError(403, "FORBIDDEN", "Votre rôle ne permet pas cette action.");
  }
  
  return ctx;
}

// ============================================
// USER QUOTA CHECK
// ============================================

import { getGarageEntitlements } from "@/lib/entitlements";

/**
 * Check if garage can add more users based on plan limits.
 * Returns { allowed: boolean, current: number, max: number }
 */
export async function checkUserQuota(garageId: number): Promise<{
  allowed: boolean;
  current: number;
  max: number;
}> {
  const entitlements = await getGarageEntitlements(garageId);
  const maxUsers = entitlements.limits.users;
  
  // Count active + invited members
  const currentCount = await prisma.garageMember.count({
    where: {
      garageId,
      status: { in: ["ACTIVE", "INVITED"] },
    },
  });
  
  return {
    allowed: currentCount < maxUsers,
    current: currentCount,
    max: maxUsers,
  };
}

/**
 * Require that garage can add more users. Throws 402 if quota exceeded.
 */
export async function requireUserQuota(garageId: number): Promise<void> {
  const quota = await checkUserQuota(garageId);
  
  if (!quota.allowed) {
    throw new RouteError(
      402,
      "QUOTA_EXCEEDED",
      `Limite d'utilisateurs atteinte (${quota.current}/${quota.max}). Passez au plan supérieur pour ajouter plus de membres.`
    );
  }
}

// ============================================
// HELPER: Get permissions for a role
// ============================================

export function getPermissionsForRole(role: GarageRoleType): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// ============================================
// HELPER: Check if role can manage another role
// ============================================

const ROLE_HIERARCHY: Record<GarageRoleType, number> = {
  OWNER: 100,
  MANAGER: 80,
  STAFF: 40,
  RECEPTION: 40,
  READONLY: 10,
};

export function canManageRole(actorRole: GarageRoleType, targetRole: GarageRoleType): boolean {
  // OWNER can manage anyone except other OWNERs
  if (actorRole === "OWNER") return true;
  
  // MANAGER can manage anyone below them
  if (actorRole === "MANAGER") {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
  }
  
  // Others cannot manage roles
  return false;
}
