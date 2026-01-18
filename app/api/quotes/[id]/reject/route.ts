import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);
    
    // Feature gate: DEVIS_FACTURES required
    if (!isAdmin && organisationId) {
      await requireFeature(organisationId, FeatureKey.DEVIS_FACTURES);
    }

    const { id } = await ctx.params;
    const quoteId = String(id);

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const quote = await tx.quote.findFirst({
        where: { id: quoteId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
        select: { id: true, status: true, organisationId: true },
      });
      if (!quote) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");
      if (quote.status !== "SENT") throw new RouteError(409, "CONFLICT", "Devis non rejetable");

      const effectiveOrgId = isAdmin ? quote.organisationId : organisationId!;

      const res = await tx.quote.update({
        where: { id: quoteId },
        data: { status: "REJECTED", rejectedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          garageId: effectiveOrgId,
          userId: user.id,
          action: "QUOTE_REJECT",
          entityType: "Quote",
          entityId: quoteId,
        },
      });

      return res;
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
