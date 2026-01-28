/**
 * API: Generate invoice (facture) from intervention or quote
 * POST /api/documents/factures/generate
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantIdWithAdminOverride } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantIdWithAdminOverride(user, req);

    if (!garageId) {
      throw new RouteError(400, "TENANT_REQUIRED", "Garage requis pour générer une facture");
    }

    const body = await req.json().catch(() => null);
    
    if (!body || (!body.interventionId && !body.quoteId)) {
      throw new RouteError(400, "BAD_REQUEST", "interventionId ou quoteId requis");
    }

    const { interventionId, quoteId } = body;

    let clientId: number;
    let vehicleId: string | null = null;
    let lines: { description: string; qty: number; unitPriceExcl: number; vatRate: number; lineTotalExcl: number; lineVatAmount: number; lineTotalIncl: number }[] = [];
    let subtotalExcl = 0;
    let totalVat = 0;
    let totalIncl = 0;
    let linkedQuoteId: string | null = null;

    // Option 1: Generate from quote
    if (quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
          lines: { where: { deletedAt: null } },
          client: true,
          vehicle: true,
        },
      });

      if (!quote) {
        throw new RouteError(404, "NOT_FOUND", "Devis non trouvé");
      }

      if (user.role !== "ADMIN" && quote.organisationId !== garageId) {
        throw new RouteError(403, "FORBIDDEN", "Accès refusé");
      }

      if (quote.invoiceId) {
        throw new RouteError(400, "BAD_REQUEST", "Ce devis a déjà une facture associée");
      }

      clientId = quote.clientId;
      vehicleId = quote.vehicleId;
      linkedQuoteId = quote.id;
      subtotalExcl = quote.subtotalExcl;
      totalVat = quote.totalVat;
      totalIncl = quote.totalIncl;

      lines = quote.lines.map((line) => ({
        description: line.description,
        qty: line.qty,
        unitPriceExcl: line.unitPriceExcl,
        vatRate: line.vatRate,
        lineTotalExcl: line.lineTotalExcl,
        lineVatAmount: line.lineVatAmount,
        lineTotalIncl: line.lineTotalIncl,
      }));
    }
    // Option 2: Generate from intervention
    else {
      const intervention = await prisma.intervention.findUnique({
        where: { id: interventionId },
        include: {
          vehicle: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!intervention) {
        throw new RouteError(404, "NOT_FOUND", "Intervention non trouvée");
      }

      if (user.role !== "ADMIN" && intervention.garageId !== garageId) {
        throw new RouteError(403, "FORBIDDEN", "Accès refusé");
      }

      if (!intervention.vehicle) {
        throw new RouteError(400, "BAD_REQUEST", "Intervention sans véhicule associé");
      }

      if (!intervention.vehicle.client) {
        throw new RouteError(400, "BAD_REQUEST", "Véhicule sans client associé");
      }

      clientId = intervention.vehicle.client.id;
      vehicleId = intervention.vehicle.id;

      const amountCents = intervention.amountCents ?? 0;
      const unitPriceExcl = amountCents / 100 / 1.20;
      const lineTotalExcl = unitPriceExcl;
      const lineVatAmount = lineTotalExcl * 0.20;
      const lineTotalIncl = lineTotalExcl + lineVatAmount;

      subtotalExcl = lineTotalExcl;
      totalVat = lineVatAmount;
      totalIncl = lineTotalIncl;

      if (amountCents > 0) {
        lines = [{
          description: intervention.notes || `Intervention ${intervention.id}`,
          qty: 1,
          unitPriceExcl,
          vatRate: 0.20,
          lineTotalExcl,
          lineVatAmount,
          lineTotalIncl,
        }];
      }
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: { organisationId: garageId, invoiceYear: year },
      orderBy: { invoiceSeq: "desc" },
    });
    const invoiceSeq = (lastInvoice?.invoiceSeq || 0) + 1;
    const invoiceNumber = `F-${year}-${String(invoiceSeq).padStart(4, "0")}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        organisationId: garageId,
        clientId,
        vehicleId,
        quoteId: linkedQuoteId,
        status: "DRAFT",
        invoiceNumber,
        invoiceYear: year,
        invoiceSeq,
        vatMode: "TTC",
        subtotalExcl,
        totalVat,
        totalIncl,
        lines: {
          create: lines,
        },
      },
      include: {
        lines: true,
        client: true,
        vehicle: true,
      },
    });

    // If created from quote, update quote to reference the invoice
    if (linkedQuoteId) {
      await prisma.quote.update({
        where: { id: linkedQuoteId },
        data: { invoiceId: invoice.id, invoicedAt: new Date() },
      });
    }

    return NextResponse.json(success({
      invoice,
      message: "Facture générée avec succès",
    }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
