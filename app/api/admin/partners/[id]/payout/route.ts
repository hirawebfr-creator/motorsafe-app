import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";

/**
 * PARTNER-PROGRAM-01: Partner Payout API
 * 
 * POST /api/admin/partners/[id]/payout - Create or update payout
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const partnerId = parseInt(id, 10);
    const body = await req.json();
    const { periodStart, periodEnd, amountCents, status } = body;

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) {
      return NextResponse.json({ error: "Partenaire non trouvé" }, { status: 404 });
    }

    if (!periodStart || !periodEnd || amountCents === undefined) {
      return NextResponse.json({ error: "Période et montant requis" }, { status: 400 });
    }

    // Check if payout already exists for this period
    const existing = await prisma.partnerPayout.findFirst({
      where: {
        partnerId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    });

    if (existing) {
      // Update existing payout
      const updated = await prisma.partnerPayout.update({
        where: { id: existing.id },
        data: {
          amountCents,
          status: status || existing.status,
          paidAt: status === "PAID" ? new Date() : null,
        },
      });
      return NextResponse.json({ payout: updated });
    }

    // Create new payout
    const payout = await prisma.partnerPayout.create({
      data: {
        partnerId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        amountCents,
        status: status || "DUE",
        paidAt: status === "PAID" ? new Date() : null,
      },
    });

    return NextResponse.json({ payout }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_PARTNER_PAYOUT] Error:", error);
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
    const { payoutId, status } = body;

    if (!payoutId || !status) {
      return NextResponse.json({ error: "ID et statut requis" }, { status: 400 });
    }

    const payout = await prisma.partnerPayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout || payout.partnerId !== partnerId) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 });
    }

    const updated = await prisma.partnerPayout.update({
      where: { id: payoutId },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });

    return NextResponse.json({ payout: updated });
  } catch (error) {
    console.error("[ADMIN_PARTNER_PAYOUT_PATCH] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
