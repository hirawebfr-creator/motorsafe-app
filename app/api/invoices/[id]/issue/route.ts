import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);
    
    // Feature gate: DEVIS_FACTURES required
    if (user.role !== "ADMIN") {
      await requireFeature(organisationId, FeatureKey.DEVIS_FACTURES);
    }

    const { id } = await ctx.params;
    const invoiceId = String(id);

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organisationId, deletedAt: null },
        select: { id: true, status: true, issuedAt: true, dueAt: true },
      });
      if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");
      if (invoice.status !== "DRAFT") throw new RouteError(409, "CONFLICT", "Facture non emissible");

      const now = new Date();
      const dueAt = invoice.dueAt ?? addDays(now, 30);

      const res = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "ISSUED", issuedAt: now, dueAt },
      });

      await tx.auditLog.create({
        data: {
          garageId: organisationId,
          userId: user.id,
          action: "INVOICE_ISSUE",
          entityType: "Invoice",
          entityId: invoiceId,
        },
      });

      return res;
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
