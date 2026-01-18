import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * PARTNER-PROGRAM-01: Partner Dashboard Stats API
 * 
 * GET /api/partner/stats
 * 
 * Returns anonymized stats for the partner:
 * - signups (total attributions)
 * - trials (garages with status PENDING or ACTIVE + plan FREE)
 * - paid (garages with active subscription)
 * - commissionDue (total unpaid commission)
 * - commissionPaid (total paid commission)
 * - conversions list (anonymized)
 */

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get partner for this user
    const partner = await prisma.partner.findUnique({
      where: { userId: user.id },
      select: { id: true, isActive: true, refCode: true, commissionPercent: true },
    });

    if (!partner) {
      return NextResponse.json({ error: "Non partenaire" }, { status: 403 });
    }

    if (!partner.isActive) {
      return NextResponse.json({ error: "Compte partenaire désactivé" }, { status: 403 });
    }

    // Get attributions with garage info (anonymized)
    const attributions = await prisma.partnerAttribution.findMany({
      where: { partnerId: partner.id },
      include: {
        garage: {
          select: {
            id: true,
            city: true,
            status: true,
            plan: true,
            subscriptionStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { attributedAt: "desc" },
    });

    // Calculate stats
    const signups = attributions.length;
    const trials = attributions.filter(a => 
      a.garage.status === "ACTIVE" && 
      (a.garage.plan === "FREE" || a.garage.subscriptionStatus === "TRIALING")
    ).length;
    const paid = attributions.filter(a => 
      a.garage.subscriptionStatus === "ACTIVE" && 
      (a.garage.plan === "STARTER" || a.garage.plan === "PRO")
    ).length;

    // Get commission totals
    const commissions = await prisma.partnerCommissionLine.aggregate({
      where: { partnerId: partner.id, isValid: true },
      _sum: { commissionCents: true },
    });

    const payouts = await prisma.partnerPayout.aggregate({
      where: { partnerId: partner.id, status: "PAID" },
      _sum: { amountCents: true },
    });

    const commissionTotal = commissions._sum.commissionCents ?? 0;
    const commissionPaid = payouts._sum.amountCents ?? 0;
    const commissionDue = commissionTotal - commissionPaid;

    // Anonymized conversions list
    const conversions = attributions.map((a, index) => ({
      id: `G-${String(index + 1).padStart(4, "0")}`,
      city: a.garage.city || "France",
      plan: a.garage.plan,
      status: a.garage.status,
      subscriptionStatus: a.garage.subscriptionStatus,
      signupDate: a.attributedAt.toISOString(),
    }));

    return NextResponse.json({
      refCode: partner.refCode,
      commissionPercent: partner.commissionPercent,
      stats: {
        signups,
        trials,
        paid,
        commissionTotal,
        commissionDue,
        commissionPaid,
      },
      conversions,
    });
  } catch (error) {
    console.error("[PARTNER_STATS] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
