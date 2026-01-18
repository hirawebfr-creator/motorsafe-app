/**
 * DATA-COMPLIANCE-01: GDPR Data Export
 *
 * Exports all personal data for a garage or specific client
 * Returns JSON (can be wrapped in ZIP by frontend)
 *
 * Query params:
 *   - clientId (optional): Export specific client data
 *   - Without clientId: Export garage-level data
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { exportGarageData, exportClientData } from "@/lib/retention";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user?.garageId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Parse query params
    const url = new URL(req.url);
    const clientIdParam = url.searchParams.get("clientId");

    if (clientIdParam) {
      // Export specific client data
      const clientId = parseInt(clientIdParam, 10);
      if (isNaN(clientId)) {
        return NextResponse.json(
          { error: "clientId invalide" },
          { status: 400 }
        );
      }

      const data = await exportClientData(user.garageId, clientId, user.id);

      // Set filename for download
      const filename = `export-client-${clientId}-${Date.now()}.json`;

      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Export full garage data
      const data = await exportGarageData(user.garageId, user.id);

      // Also include all clients, vehicles, interventions
      const clients = await prisma.client.findMany({
        where: { garageId: user.garageId, deletedAt: null },
        include: {
          vehicles: {
            where: { deletedAt: null },
            select: {
              id: true,
              brand: true,
              model: true,
              plate: true,
              vin: true,
              createdAt: true,
            },
          },
        },
      });

      const interventions = await prisma.intervention.findMany({
        where: { garageId: user.garageId, deletedAt: null },
        select: {
          id: true,
          type: true,
          status: true,
          notes: true,
          createdAt: true,
          vehicleId: true,
        },
      });

      const quotes = await prisma.quote.findMany({
        where: { organisationId: user.garageId, deletedAt: null },
        select: {
          id: true,
          quoteNumber: true,
          status: true,
          totalIncl: true,
          createdAt: true,
          clientId: true,
        },
      });

      const invoices = await prisma.invoice.findMany({
        where: { organisationId: user.garageId, deletedAt: null },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalIncl: true,
          createdAt: true,
          clientId: true,
        },
      });

      const fullExport = {
        ...data,
        clients: clients.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          address: c.address,
          createdAt: c.createdAt.toISOString(),
          anonymizedAt: c.anonymizedAt?.toISOString() || null,
          vehicles: c.vehicles.map((v) => ({
            id: v.id,
            brand: v.brand,
            model: v.model,
            plate: v.plate,
            vin: v.vin,
            createdAt: v.createdAt.toISOString(),
          })),
        })),
        interventions: interventions.map((i) => ({
          id: i.id,
          type: i.type,
          status: i.status,
          notes: i.notes,
          createdAt: i.createdAt.toISOString(),
          vehicleId: i.vehicleId,
        })),
        quotes: quotes.map((q) => ({
          id: q.id,
          quoteNumber: q.quoteNumber,
          status: q.status,
          totalIncl: q.totalIncl,
          createdAt: q.createdAt.toISOString(),
          clientId: q.clientId,
        })),
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          totalIncl: inv.totalIncl,
          createdAt: inv.createdAt.toISOString(),
          clientId: inv.clientId,
        })),
      };

      const filename = `export-garage-${user.garageId}-${Date.now()}.json`;

      return new NextResponse(JSON.stringify(fullExport, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error("[GDPR Export] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur interne",
      },
      { status: 500 }
    );
  }
}
