import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);

    const { id } = await ctx.params;
    const quoteId = String(id);

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const quote = await tx.quote.findFirst({
        where: { id: quoteId, organisationId, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!quote) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");
      if (quote.status !== "DRAFT") throw new RouteError(409, "CONFLICT", "Devis non envoyable");

      const res = await tx.quote.update({
        where: { id: quoteId },
        data: { status: "SENT", sentAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          garageId: organisationId,
          userId: user.id,
          action: "QUOTE_SEND",
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
