import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { convertQuoteToInvoiceTx } from "@/lib/quoteInvoice";

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

    const invoice = await prisma.$transaction(async (tx) => {
      // For ADMIN, first fetch the quote to get its organisationId
      const quote = await tx.quote.findFirst({
        where: { id: quoteId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
        select: { organisationId: true },
      });
      if (!quote) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");

      const effectiveOrgId = isAdmin ? quote.organisationId : organisationId!;

      const { invoiceId } = await convertQuoteToInvoiceTx(tx, { organisationId: effectiveOrgId, quoteId });
      return tx.invoice.findFirst({
        where: { id: invoiceId, organisationId: effectiveOrgId, deletedAt: null },
        include: { lines: { where: { deletedAt: null } }, client: true, vehicle: true },
      });
    });

    if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

    return NextResponse.json({ ok: true, data: invoice });
  } catch (err) {
    return toErrorResponse(err);
  }
}
