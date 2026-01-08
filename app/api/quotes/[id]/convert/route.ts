import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { convertQuoteToInvoiceTx } from "@/lib/quoteInvoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);

    const { id } = await ctx.params;
    const quoteId = String(id);

    const invoice = await prisma.$transaction(async (tx) => {
      const { invoiceId } = await convertQuoteToInvoiceTx(tx, { organisationId, quoteId });
      return tx.invoice.findFirst({
        where: { id: invoiceId, organisationId, deletedAt: null },
        include: { lines: { where: { deletedAt: null } }, client: true, vehicle: true },
      });
    });

    if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

    return NextResponse.json({ ok: true, data: invoice });
  } catch (err) {
    return toErrorResponse(err);
  }
}
