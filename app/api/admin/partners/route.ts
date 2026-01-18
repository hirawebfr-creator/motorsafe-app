import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";

/**
 * PARTNER-PROGRAM-01: Admin Partners API
 * 
 * GET /api/admin/partners - List all partners
 * POST /api/admin/partners - Create a new partner
 */

// Generate unique partner ref code
function generateRefCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PART-${code}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const partners = await prisma.partner.findMany({
      include: {
        _count: {
          select: {
            attributions: true,
            commissionLines: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get aggregated stats for each partner
    const partnersWithStats = await Promise.all(
      partners.map(async (partner) => {
        const commissions = await prisma.partnerCommissionLine.aggregate({
          where: { partnerId: partner.id, isValid: true },
          _sum: { commissionCents: true },
        });

        const payouts = await prisma.partnerPayout.aggregate({
          where: { partnerId: partner.id, status: "PAID" },
          _sum: { amountCents: true },
        });

        const paidCount = await prisma.partnerAttribution.count({
          where: {
            partnerId: partner.id,
            garage: {
              subscriptionStatus: "ACTIVE",
              plan: { in: ["STARTER", "PRO"] },
            },
          },
        });

        return {
          ...partner,
          stats: {
            signups: partner._count.attributions,
            paid: paidCount,
            commissionTotal: commissions._sum.commissionCents ?? 0,
            commissionPaid: payouts._sum.amountCents ?? 0,
            commissionDue: (commissions._sum.commissionCents ?? 0) - (payouts._sum.amountCents ?? 0),
          },
        };
      })
    );

    return NextResponse.json({ partners: partnersWithStats });
  } catch (error) {
    console.error("[ADMIN_PARTNERS_GET] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, type, commissionPercent, stripeCouponId, userId } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nom et email requis" }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await prisma.partner.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    }

    // Generate unique ref code
    let refCode: string;
    let attempts = 0;
    do {
      refCode = generateRefCode();
      const existingCode = await prisma.partner.findUnique({ where: { refCode } });
      if (!existingCode) break;
      attempts++;
    } while (attempts < 10);

    const partner = await prisma.partner.create({
      data: {
        name,
        email,
        type: type || "OTHER",
        refCode,
        commissionPercent: commissionPercent ?? 20,
        stripeCouponId: stripeCouponId || null,
        userId: userId || null,
        isActive: true,
      },
    });

    // If userId provided, update user role to PARTNER
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "PARTNER" },
      });
    }

    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_PARTNERS_POST] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
