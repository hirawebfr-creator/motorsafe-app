import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { z } from "zod";
import { computePaymentStatus } from "@/lib/quoteInvoice";
import type { Prisma } from "@prisma/client";
import { cancelPendingJobs } from "@/lib/automations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "CARD", "TRANSFER", "STRIPE", "OTHER"]),
});

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
    const invoiceId = String(id);

    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide", parsed.error.flatten());
    }

    const { amount, method } = parsed.data;

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
        select: { id: true, status: true, totalIncl: true, amountPaid: true, organisationId: true },
      });
      if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");
      if (invoice.status === "CANCELED") throw new RouteError(409, "CONFLICT", "Facture annulee");

      const effectiveOrgId = isAdmin ? invoice.organisationId : organisationId!;

      const payment = await tx.payment.create({
        data: {
          organisationId: effectiveOrgId,
          invoiceId,
          amount,
          method,
          status: "SUCCEEDED",
          paidAt: new Date(),
        },
      });

      const nextAmountPaid = invoice.amountPaid + amount;
      const nextStatus = computePaymentStatus({ amountPaid: nextAmountPaid, totalIncl: invoice.totalIncl });

      const res = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: nextAmountPaid,
          status: nextStatus,
          ...(nextStatus === "PAID" ? { paidAt: new Date() } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          garageId: effectiveOrgId,
          userId: user.id,
          action: "INVOICE_MARK_PAID",
          entityType: "Invoice",
          entityId: invoiceId,
          metadata: { paymentId: payment.id, amount, method },
        },
      });

      return res;
    });

    // AUTOMATIONS-01: Cancel pending reminder jobs if invoice is fully paid
    if (updated.status === "PAID") {
      try {
        await cancelPendingJobs("invoice", invoiceId);
      } catch (cancelErr) {
        console.warn("[InvoiceMarkPaid] Failed to cancel reminder jobs:", cancelErr);
      }
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
