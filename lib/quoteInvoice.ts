import type { Prisma } from "@prisma/client";
import { RouteError } from "@/lib/routeErrors";
import { allocateNumberTx } from "@/lib/numbering";
import { computeDocTotals, computeLineTotals, computeDefaultVatRate, round2, type VatMode } from "@/lib/tax";

type OrgSettings = {
  id: number;
  defaultVatRate: number;
  defaultVatMode: string;
  quotePrefix: string;
  invoicePrefix: string;
  numberPadding: number;
};

type ClientVat = {
  id: number;
  vatProfile: string;
  vatNumber: string | null;
  countryCode: string;
  vatRateOverride?: number | null;
};

export function normalizeVatMode(mode: unknown, fallback: string): VatMode {
  const m = String(mode ?? fallback).toUpperCase();
  return m === "INCL" ? "INCL" : "EXCL";
}

export function ensureEditableQuoteStatus(status: string) {
  if (status === "INVOICED") {
    throw new RouteError(409, "CONFLICT", "Devis deja facture");
  }
}

export function computeLinesWithTotals(params: {
  org: Pick<OrgSettings, "defaultVatRate">;
  client: Pick<ClientVat, "vatProfile" | "vatNumber" | "countryCode" | "vatRateOverride">;
  lines: Array<{ description: string; qty: number; unitPriceExcl: number; vatRate?: number | null }>;
}): {
  lines: Array<{
    description: string;
    qty: number;
    unitPriceExcl: number;
    vatRate: number;
    lineTotalExcl: number;
    lineVatAmount: number;
    lineTotalIncl: number;
  }>;
  totals: { subtotalExcl: number; totalVat: number; totalIncl: number };
} {
  const defaultVatRate = computeDefaultVatRate(params.org, params.client);

  const computed = params.lines.map((l) => {
    const vatRate = l.vatRate === undefined || l.vatRate === null ? defaultVatRate : l.vatRate;
    const totals = computeLineTotals(l.qty, l.unitPriceExcl, vatRate);
    return {
      description: l.description,
      qty: l.qty,
      unitPriceExcl: l.unitPriceExcl,
      vatRate,
      ...totals,
    };
  });

  const totals = computeDocTotals(computed);
  return { lines: computed, totals };
}

export async function convertQuoteToInvoiceTx(tx: Prisma.TransactionClient, params: {
  organisationId: number;
  quoteId: string;
}): Promise<{ invoiceId: string }> {
  const quote = await tx.quote.findFirst({
    where: { id: params.quoteId, organisationId: params.organisationId, deletedAt: null },
    include: {
      lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!quote) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");

  if (quote.invoiceId) {
    return { invoiceId: quote.invoiceId };
  }

  if (quote.status !== "ACCEPTED") {
    throw new RouteError(409, "CONFLICT", "Le devis doit etre accepte pour etre converti.");
  }

  const org = await tx.garage.findFirst({
    where: { id: params.organisationId },
    select: { id: true, invoicePrefix: true, numberPadding: true, defaultVatMode: true },
  });
  if (!org) throw new RouteError(404, "NOT_FOUND", "Organisation introuvable");

  const now = new Date();
  const year = now.getFullYear();

  const allocation = await allocateNumberTx(tx, {
    organisationId: params.organisationId,
    type: "INVOICE",
    year,
    prefix: org.invoicePrefix,
    padding: org.numberPadding,
  });

  const invoice = await tx.invoice.create({
    data: {
      organisationId: params.organisationId,
      clientId: quote.clientId,
      vehicleId: quote.vehicleId,
      quoteId: quote.id,
      status: "DRAFT",
      invoiceNumber: allocation.number,
      invoiceYear: allocation.year,
      invoiceSeq: allocation.seq,
      currency: quote.currency,
      vatMode: quote.vatMode,
      subtotalExcl: quote.subtotalExcl,
      totalVat: quote.totalVat,
      totalIncl: quote.totalIncl,
      lines: {
        createMany: {
          data: quote.lines
            .filter((l) => !l.deletedAt)
            .map((l) => ({
              description: l.description,
              qty: l.qty,
              unitPriceExcl: l.unitPriceExcl,
              vatRate: l.vatRate,
              lineTotalExcl: l.lineTotalExcl,
              lineVatAmount: l.lineVatAmount,
              lineTotalIncl: l.lineTotalIncl,
            })),
        },
      },
    },
  });

  await tx.quote.update({
    where: { id: quote.id },
    data: {
      status: "INVOICED",
      invoiceId: invoice.id,
      invoicedAt: now,
    },
  });

  return { invoiceId: invoice.id };
}

export function computePaymentStatus(params: { amountPaid: number; totalIncl: number }) {
  const paid = round2(params.amountPaid);
  const total = round2(params.totalIncl);
  if (paid >= total) return "PAID";
  if (paid > 0) return "PARTIALLY_PAID";
  return "ISSUED";
}
