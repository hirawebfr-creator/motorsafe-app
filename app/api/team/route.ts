/**
 * MULTI-USER-ROLES-01: Team Management API
 * 
 * GET  /api/team - List team members
 * POST /api/team - Invite new member
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireUser, requireApprovedTenant, getTenantId } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requirePermission, requireUserQuota, Permission, checkUserQuota } from "@/lib/permissions";
import { sendTeamInviteEmail } from "@/lib/email";
import { createHash, randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================
// GET /api/team - List team members
// ============================================

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const memberCtx = await requirePermission(user, Permission.TEAM_READ);
    const garageId = memberCtx.garageId || getTenantId(user);

    const members = await prisma.garageMember.findMany({
      where: { garageId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { invitedAt: "asc" },
      ],
    });

    // Get quota info
    const quota = await checkUserQuota(garageId);

    const data = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user?.email || m.invitedEmail,
      role: m.role,
      status: m.status,
      invitedAt: m.invitedAt,
      acceptedAt: m.acceptedAt,
      disabledAt: m.disabledAt,
    }));

    return NextResponse.json(success({
      members: data,
      quota: {
        current: quota.current,
        max: quota.max,
        canInvite: quota.allowed,
      },
    }));
  } catch (err) {
    console.error("Erreur API GET /api/team :", err);
    return toErrorResponse(err);
  }
}

// ============================================
// POST /api/team - Invite new member
// ============================================

interface InviteBody {
  email: string;
  role: "MANAGER" | "STAFF" | "RECEPTION" | "READONLY";
  message?: string;
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const memberCtx = await requirePermission(user, Permission.TEAM_MANAGE);
    const garageId = memberCtx.garageId || getTenantId(user);

    // Check quota
    await requireUserQuota(garageId);

    const body: InviteBody = await req.json();
    const { email, role, message } = body;

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(failure("Email invalide"), { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate role (cannot invite OWNER)
    const allowedRoles = ["MANAGER", "STAFF", "RECEPTION", "READONLY"];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(failure("Rôle invalide"), { status: 400 });
    }

    // Check if already a member
    const existingMember = await prisma.garageMember.findFirst({
      where: {
        garageId,
        OR: [
          { invitedEmail: normalizedEmail },
          { user: { email: normalizedEmail } },
        ],
      },
    });

    if (existingMember) {
      if (existingMember.status === "ACTIVE") {
        return NextResponse.json(failure("Cet utilisateur est déjà membre de l'équipe"), { status: 409 });
      }
      if (existingMember.status === "INVITED") {
        return NextResponse.json(failure("Une invitation est déjà en attente pour cet email"), { status: 409 });
      }
      if (existingMember.status === "DISABLED") {
        // Reactivate disabled member with new invitation
        // Continue to create new invite token
      }
    }

    // Check if user already exists in system
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Generate invite token (32 bytes = 64 hex chars)
    const inviteToken = randomBytes(32).toString("hex");
    const inviteTokenHash = createHash("sha256").update(inviteToken).digest("hex");
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create or update membership
    let member;
    if (existingMember) {
      // Reactivate disabled member
      member = await prisma.garageMember.update({
        where: { id: existingMember.id },
        data: {
          role: role as any,
          status: existingUser ? "ACTIVE" : "INVITED",
          userId: existingUser?.id || null,
          invitedEmail: existingUser ? null : normalizedEmail,
          inviteTokenHash: existingUser ? null : inviteTokenHash,
          inviteExpiresAt: existingUser ? null : inviteExpiresAt,
          invitedAt: new Date(),
          acceptedAt: existingUser ? new Date() : null,
          disabledAt: null,
          disabledReason: null,
        },
      });
    } else {
      member = await prisma.garageMember.create({
        data: {
          garageId,
          role: role as any,
          status: existingUser ? "ACTIVE" : "INVITED",
          userId: existingUser?.id || null,
          invitedEmail: existingUser ? null : normalizedEmail,
          inviteTokenHash: existingUser ? null : inviteTokenHash,
          inviteExpiresAt: existingUser ? null : inviteExpiresAt,
          acceptedAt: existingUser ? new Date() : null,
        },
      });
    }

    // Get garage info for email
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: { name: true, email: true, phone: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "TEAM_INVITED",
        entityType: "GarageMember",
        entityId: member.id,
        metadata: {
          invitedEmail: normalizedEmail,
          role,
          isExistingUser: !!existingUser,
          actorEmail: user.email,
        },
      },
    });

    // Send invite email
    if (!existingUser) {
      const inviteUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/accept-invite?token=${inviteToken}`;
      
      await sendTeamInviteEmail({
        to: normalizedEmail,
        inviteUrl,
        garageName: garage?.name || "Garage",
        role: getRoleFrenchName(role),
        message,
        expiresAt: inviteExpiresAt,
      });
    }

    return NextResponse.json(success({
      member: {
        id: member.id,
        email: normalizedEmail,
        role: member.role,
        status: member.status,
      },
      isExistingUser: !!existingUser,
    }), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/team :", err);
    return toErrorResponse(err);
  }
}

function getRoleFrenchName(role: string): string {
  const names: Record<string, string> = {
    OWNER: "Propriétaire",
    MANAGER: "Chef d'atelier",
    STAFF: "Mécanicien",
    RECEPTION: "Réception",
    READONLY: "Consultation",
  };
  return names[role] || role;
}
