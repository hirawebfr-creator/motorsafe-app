/**
 * API: Generate quote (devis) from intervention
 * POST /api/documents/devis/generate
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
      throw new RouteError(400, "TENANT_REQUIRED", "Garage requis pour générer un devis");
    }

    const body = await req.json().catch(() => null);
    
    if (!body || !body.interventionId) {
      throw new RouteError(400, "BAD_REQUEST", "interventionId requis");
    }

    const { interventionId } = body;

    // Get intervention with vehicle and client
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
        garage: true,
      },
    });

    if (!intervention) {
      throw new RouteError(404, "NOT_FOUND", "Intervention non trouvée");
    }

    // Check ownership (unless admin)
    if (user.role !== "ADMIN" && intervention.garageId !== garageId) {
      throw new RouteError(403, "FORBIDDEN", "Accès refusé");
    }

    if (!intervention.vehicle) {
      throw new RouteError(400, "BAD_REQUEST", "Intervention sans véhicule associé");
    }

    if (!intervention.vehicle.client) {
      throw new RouteError(400, "BAD_REQUEST", "Véhicule sans client associé");
    }

    const client = intervention.vehicle.client;
    const vehicle = intervention.vehicle;

    // Generate quote number (simplified - you may have a more complex numbering system)
    const year = new Date().getFullYear();
    const lastQuote = await prisma.quote.findFirst({
      where: { organisationId: garageId, quoteYear: year },
      orderBy: { quoteSeq: "desc" },
    });
    const quoteSeq = (lastQuote?.quoteSeq || 0) + 1;
    const quoteNumber = `D-${year}-${String(quoteSeq).padStart(4, "0")}`;

    // Create quote with a default line based on intervention amount
    const amountCents = intervention.amountCents ?? 0;
    const unitPriceExcl = amountCents / 100 / 1.20; // Assume 20% VAT
    const lineTotalExcl = unitPriceExcl;
    const lineVatAmount = lineTotalExcl * 0.20;
    const lineTotalIncl = lineTotalExcl + lineVatAmount;

    const quote = await prisma.quote.create({
      data: {
        organisationId: garageId,
        clientId: client.id,
        vehicleId: vehicle.id,
        status: "DRAFT",
        quoteNumber,
        quoteYear: year,
        quoteSeq,
        vatMode: "TTC",
        subtotalExcl: lineTotalExcl,
        totalVat: lineVatAmount,
        totalIncl: lineTotalIncl,
        lines: {
          create: amountCents > 0 ? [
            {
              description: intervention.notes || `Intervention ${intervention.id}`,
              qty: 1,
              unitPriceExcl,
              vatRate: 0.20,
              lineTotalExcl,
              lineVatAmount,
              lineTotalIncl,
            },
          ] : [],
        },
      },
      include: {
        lines: true,
        client: true,
        vehicle: true,
      },
    });

    return NextResponse.json(success({
      quote,
      message: "Devis généré avec succès",
    }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
