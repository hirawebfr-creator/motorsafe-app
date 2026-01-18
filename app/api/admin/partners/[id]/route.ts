import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";

/**
 * PARTNER-PROGRAM-01: Admin Partner Detail API
 * 
 * GET /api/admin/partners/[id] - Get partner details
 * PATCH /api/admin/partners/[id] - Update partner
 * DELETE /api/admin/partners/[id] - Deactivate partner
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const partnerId = parseInt(id, 10);

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        user: { select: { id: true, email: true } },
        attributions: {
          include: {
            garage: {
              select: {
                id: true,
                name: true,
                city: true,
                plan: true,
                subscriptionStatus: true,
                createdAt: true,
              },
            },
          },
          orderBy: { attributedAt: "desc" },
        },
        commissionLines: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        payouts: {
          orderBy: { periodStart: "desc" },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partenaire non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("[ADMIN_PARTNER_GET] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const partnerId = parseInt(id, 10);
    const body = await req.json();

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) {
      return NextResponse.json({ error: "Partenaire non trouvé" }, { status: 404 });
    }

    // Build update object only with provided fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.commissionPercent !== undefined) updateData.commissionPercent = body.commissionPercent;
    if (body.commissionMode !== undefined) updateData.commissionMode = body.commissionMode;
    if (body.stripeCouponId !== undefined) updateData.stripeCouponId = body.stripeCouponId;
    if (body.minPayoutCents !== undefined) updateData.minPayoutCents = body.minPayoutCents;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await prisma.partner.update({
      where: { id: partnerId },
      data: updateData,
    });

    return NextResponse.json({ partner: updated });
  } catch (error) {
    console.error("[ADMIN_PARTNER_PATCH] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const partnerId = parseInt(id, 10);

    // Soft delete: deactivate instead of delete
    await prisma.partner.update({
      where: { id: partnerId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_PARTNER_DELETE] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
