/**
 * MULTI-USER-ROLES-01: Team Member Management
 * 
 * PATCH  /api/team/[id] - Update member role
 * DELETE /api/team/[id] - Disable member
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireUser, requireApprovedTenant, getTenantId } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requirePermission, Permission, canManageRole, type GarageRoleType } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ============================================
// PATCH /api/team/[id] - Update member role
// ============================================

interface UpdateBody {
  role: "MANAGER" | "STAFF" | "RECEPTION" | "READONLY";
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const memberCtx = await requirePermission(user, Permission.TEAM_MANAGE);
    const garageId = memberCtx.garageId || getTenantId(user);
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json(failure("ID membre requis"), { status: 400 });
    }

    const body: UpdateBody = await req.json();
    const { role } = body;

    // Validate role
    const allowedRoles = ["MANAGER", "STAFF", "RECEPTION", "READONLY"];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(failure("Rôle invalide"), { status: 400 });
    }

    // Find member (multi-tenant check)
    const member = await prisma.garageMember.findFirst({
      where: { id, garageId },
      include: { user: { select: { email: true } } },
    });

    if (!member) {
      return NextResponse.json(failure("Membre introuvable"), { status: 404 });
    }

    // Cannot change OWNER role
    if (member.role === "OWNER") {
      return NextResponse.json(failure("Impossible de modifier le rôle du propriétaire"), { status: 403 });
    }

    // Check if actor can manage this role
    if (!canManageRole(memberCtx.role, member.role as GarageRoleType)) {
      return NextResponse.json(failure("Vous ne pouvez pas gérer ce membre"), { status: 403 });
    }

    // Cannot promote to a role higher than actor (except OWNER can do anything)
    if (memberCtx.role !== "OWNER" && !canManageRole(memberCtx.role, role as GarageRoleType)) {
      return NextResponse.json(failure("Vous ne pouvez pas attribuer ce rôle"), { status: 403 });
    }

    // Update role
    const updated = await prisma.garageMember.update({
      where: { id },
      data: { role: role as any },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "TEAM_ROLE_CHANGED",
        entityType: "GarageMember",
        entityId: id,
        metadata: {
          targetEmail: member.user?.email || member.invitedEmail,
          previousRole: member.role,
          newRole: role,
          actorEmail: user.email,
        },
      },
    });

    return NextResponse.json(success({
      member: {
        id: updated.id,
        role: updated.role,
        status: updated.status,
      },
    }));
  } catch (err) {
    console.error("Erreur API PATCH /api/team/[id] :", err);
    return toErrorResponse(err);
  }
}

// ============================================
// DELETE /api/team/[id] - Disable member
// ============================================

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const memberCtx = await requirePermission(user, Permission.TEAM_MANAGE);
    const garageId = memberCtx.garageId || getTenantId(user);
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json(failure("ID membre requis"), { status: 400 });
    }

    // Parse reason from body (optional)
    let reason = "";
    try {
      const body = await req.json();
      reason = body.reason || "";
    } catch {
      // No body is fine
    }

    // Find member (multi-tenant check)
    const member = await prisma.garageMember.findFirst({
      where: { id, garageId },
      include: { user: { select: { email: true } } },
    });

    if (!member) {
      return NextResponse.json(failure("Membre introuvable"), { status: 404 });
    }

    // Cannot disable OWNER
    if (member.role === "OWNER") {
      return NextResponse.json(failure("Impossible de désactiver le propriétaire"), { status: 403 });
    }

    // Cannot disable yourself
    if (member.userId === user.id) {
      return NextResponse.json(failure("Vous ne pouvez pas vous désactiver vous-même"), { status: 403 });
    }

    // Check if actor can manage this role
    if (!canManageRole(memberCtx.role, member.role as GarageRoleType)) {
      return NextResponse.json(failure("Vous ne pouvez pas gérer ce membre"), { status: 403 });
    }

    // Disable member
    const updated = await prisma.garageMember.update({
      where: { id },
      data: {
        status: "DISABLED",
        disabledAt: new Date(),
        disabledReason: reason || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "TEAM_MEMBER_DISABLED",
        entityType: "GarageMember",
        entityId: id,
        metadata: {
          targetEmail: member.user?.email || member.invitedEmail,
          targetRole: member.role,
          reason,
          actorEmail: user.email,
        },
      },
    });

    return NextResponse.json(success({
      member: {
        id: updated.id,
        status: updated.status,
      },
    }));
  } catch (err) {
    console.error("Erreur API DELETE /api/team/[id] :", err);
    return toErrorResponse(err);
  }
}
