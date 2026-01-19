/**
 * INSURANCE-READY-EXPORT-02: Create Share Link for Insurance Export
 * POST /api/interventions/[id]/export-share
 *
 * Creates a temporary shareable link for the insurance export ZIP.
 * PRO plan only feature.
 * Link expires in 7 days.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { hasFeature, FeatureKey } from "@/lib/entitlements";
import { createHash, randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

// Link valid for 7 days
const LINK_EXPIRY_DAYS = 7;

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    // Check PRO feature gate
    if (!hasFeature(user, FeatureKey.EXPORT_SHARE)) {
      throw new RouteError(403, "PLAN_REQUIRED", "Les liens de partage nécessitent le plan PRO");
    }

    // Only OWNER, ADMIN or GARAGE can create share links
    if (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "GARAGE") {
      throw new RouteError(403, "FORBIDDEN", "Seul le propriétaire peut créer un lien de partage");
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    // Verify intervention exists and belongs to user's garage
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      select: {
        id: true,
        vehicle: { select: { plate: true } },
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Generate secure token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LINK_EXPIRY_DAYS);

    // Delete existing INSURANCE_EXPORT token if any (one active at a time)
    await prisma.downloadToken.deleteMany({
      where: {
        interventionId: id,
        purpose: "INSURANCE_EXPORT",
      },
    });

    // Create new token
    await prisma.downloadToken.create({
      data: {
        interventionId: id,
        purpose: "INSURANCE_EXPORT",
        tokenHash,
        expiresAt,
      },
    });

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://motorsafe.tech";
    const shareUrl = `${baseUrl}/share/export/${rawToken}`;

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_EXPORT_SHARE_LINK",
        entityType: "Intervention",
        entityId: id,
        metadata: {
          expiresAt: expiresAt.toISOString(),
          vehiclePlate: intervention.vehicle.plate,
        },
      },
    });

    return NextResponse.json(success({
      shareUrl,
      expiresAt: expiresAt.toISOString(),
      expiresInDays: LINK_EXPIRY_DAYS,
    }));
  } catch (err) {
    console.error("[Export Share Link] Error:", err);
    return toErrorResponse(err);
  }
}

/**
 * DELETE /api/interventions/[id]/export-share
 * Revokes the share link
 */
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    // Verify intervention exists and belongs to user's garage
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Delete the token
    const deleted = await prisma.downloadToken.deleteMany({
      where: {
        interventionId: id,
        purpose: "INSURANCE_EXPORT",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REVOKE_EXPORT_SHARE_LINK",
        entityType: "Intervention",
        entityId: id,
        metadata: { revoked: deleted.count > 0 },
      },
    });

    return NextResponse.json(success({ revoked: deleted.count > 0 }));
  } catch (err) {
    console.error("[Export Share Link Revoke] Error:", err);
    return toErrorResponse(err);
  }
}

/**
 * GET /api/interventions/[id]/export-share
 * Check if a share link exists and its status
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    // Verify intervention exists and belongs to user's garage
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Find existing token
    const token = await prisma.downloadToken.findFirst({
      where: {
        interventionId: id,
        purpose: "INSURANCE_EXPORT",
      },
      select: {
        expiresAt: true,
        usedAt: true,
        createdAt: true,
      },
    });

    if (!token) {
      return NextResponse.json(success({
        hasLink: false,
      }));
    }

    const isExpired = token.expiresAt < new Date();

    return NextResponse.json(success({
      hasLink: true,
      isExpired,
      expiresAt: token.expiresAt.toISOString(),
      createdAt: token.createdAt.toISOString(),
      wasUsed: !!token.usedAt,
      usedAt: token.usedAt?.toISOString() || null,
    }));
  } catch (err) {
    console.error("[Export Share Link Status] Error:", err);
    return toErrorResponse(err);
  }
}
