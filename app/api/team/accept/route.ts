/**
 * MULTI-USER-ROLES-01: Accept Team Invitation
 * 
 * GET  /api/team/accept - Validate invite token
 * POST /api/team/accept - Accept invitation (create user if needed)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { toErrorResponse } from "@/lib/routeErrors";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================
// GET /api/team/accept?token=xxx - Validate token
// ============================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string" || token.length !== 64) {
      return NextResponse.json(failure("Token invalide"), { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const member = await prisma.garageMember.findFirst({
      where: {
        inviteTokenHash: tokenHash,
        status: "INVITED",
      },
      include: {
        garage: {
          select: { id: true, name: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(failure("Invitation invalide ou expirée"), { status: 404 });
    }

    // Check expiration
    if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
      return NextResponse.json(failure("Cette invitation a expiré"), { status: 410 });
    }

    return NextResponse.json(success({
      valid: true,
      email: member.invitedEmail,
      role: member.role,
      garageName: member.garage?.name || "Garage",
    }));
  } catch (err) {
    console.error("Erreur API GET /api/team/accept :", err);
    return toErrorResponse(err);
  }
}

// ============================================
// POST /api/team/accept - Accept invitation
// ============================================

interface AcceptBody {
  token: string;
  password: string;
}

export async function POST(req: Request) {
  try {
    const body: AcceptBody = await req.json();
    const { token, password } = body;

    // Validate token
    if (!token || typeof token !== "string" || token.length !== 64) {
      return NextResponse.json(failure("Token invalide"), { status: 400 });
    }

    // Validate password
    if (!password || password.length < 8) {
      return NextResponse.json(failure("Mot de passe requis (min 8 caractères)"), { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const member = await prisma.garageMember.findFirst({
      where: {
        inviteTokenHash: tokenHash,
        status: "INVITED",
      },
      include: {
        garage: {
          select: { id: true, name: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(failure("Invitation invalide ou expirée"), { status: 404 });
    }

    // Check expiration
    if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
      return NextResponse.json(failure("Cette invitation a expiré"), { status: 410 });
    }

    const email = member.invitedEmail;
    if (!email) {
      return NextResponse.json(failure("Email manquant dans l'invitation"), { status: 400 });
    }

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let userId: string;

    if (existingUser) {
      // User exists - just link the membership
      userId = existingUser.id;
      
      // Update user's garageId if not set (for legacy compatibility)
      if (!existingUser.garageId) {
        await prisma.user.update({
          where: { id: userId },
          data: { garageId: member.garageId },
        });
      }
    } else {
      // Create new user
      const passwordHash = await hashPassword(password);
      
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "STAFF", // Default role in User model (not the GarageRole)
          garageId: member.garageId,
        },
      });
      
      userId = newUser.id;
    }

    // Accept membership
    await prisma.garageMember.update({
      where: { id: member.id },
      data: {
        userId,
        status: "ACTIVE",
        acceptedAt: new Date(),
        inviteTokenHash: null, // Clear token
        inviteExpiresAt: null,
        invitedEmail: null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: member.garageId,
        userId,
        action: "TEAM_INVITE_ACCEPTED",
        entityType: "GarageMember",
        entityId: member.id,
        metadata: {
          email,
          role: member.role,
          isNewUser: !existingUser,
        },
      },
    });

    // Create session for the user
    const session = await createSession(userId);

    // Build response with session cookie
    const response = NextResponse.json(success({
      accepted: true,
      garageName: member.garage?.name,
      role: member.role,
    }));

    setSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (err) {
    console.error("Erreur API POST /api/team/accept :", err);
    return toErrorResponse(err);
  }
}
