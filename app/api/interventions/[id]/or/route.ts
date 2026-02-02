import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { decryptClientData } from "@/lib/encryption";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OR (Ordre de Réparation) API
 *
 * Uses the existing RepairOrder model from schema.
 * GET - Retrieve OR data for an intervention
 * POST - Create OR for an intervention (copies from latest devis if exists)
 * PATCH - Update OR items
 */

interface OrItem {
  id: string;
  description: string;
  qty: number;
  unitPriceExcl: number;
  vatRate: number;
}

interface SnapshotData {
  items: OrItem[];
  vehicle?: any;
  client?: any;
  intervention?: any;
  createdAt?: string;
}

const OrItemSchema = z.object({
  description: z.string().trim().min(1),
  qty: z.number().min(1),
  unitPriceExcl: z.number().min(0),
  vatRate: z.number().min(0).max(1),
});

const UpdateOrSchema = z.object({
  items: z.array(OrItemSchema),
});

// Helper to build OR data response
async function buildOrResponse(
  repairOrder: any,
  intervention: any,
  signatureRequest: any
) {
  const client = intervention.vehicle?.client;
  const vehicle = intervention.vehicle;

  // Parse snapshot JSON
  let snapshot: SnapshotData = { items: [] };
  if (repairOrder.snapshotJson) {
    try {
      snapshot = JSON.parse(repairOrder.snapshotJson);
    } catch {
      snapshot = { items: [] };
    }
  }

  const items = snapshot.items || [];

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => {
      const lineExcl = item.qty * item.unitPriceExcl;
      const lineVat = lineExcl * item.vatRate;
      return {
        subtotalExcl: acc.subtotalExcl + lineExcl,
        totalVat: acc.totalVat + lineVat,
        totalIncl: acc.totalIncl + lineExcl + lineVat,
      };
    },
    { subtotalExcl: 0, totalVat: 0, totalIncl: 0 }
  );

  // Determine status
  const status = repairOrder.status.toLowerCase() as "draft" | "sent" | "signed";

  // Decrypt client data if needed
  const decryptedClient = client
    ? decryptClientData(client as Record<string, unknown>)
    : null;

  return {
    id: repairOrder.id,
    orNumber: `OR-${intervention.number || intervention.id.slice(0, 8)}`,
    interventionId: intervention.id,
    status,
    createdAt: repairOrder.createdAt,
    sentAt: repairOrder.issuedAt || signatureRequest?.sentAt || null,
    signedAt: repairOrder.signedAt || signatureRequest?.signedAt || null,
    intervention: {
      id: intervention.id,
      number: intervention.number || `INT-${intervention.id.slice(0, 8)}`,
      type: intervention.type,
      title: intervention.title,
      notes: intervention.notes,
      status: intervention.status,
      performedAt: intervention.performedAt,
      odometerKm: intervention.odometerKm,
      createdAt: intervention.createdAt,
    },
    client: decryptedClient
      ? {
          id: decryptedClient.id,
          firstName: decryptedClient.firstName || "",
          lastName: decryptedClient.lastName || "",
          email: decryptedClient.email || null,
          phone: decryptedClient.phone || null,
          address: decryptedClient.address || null,
          city: decryptedClient.city || null,
          postalCode: decryptedClient.postalCode || null,
        }
      : {
          id: 0,
          firstName: "Client",
          lastName: "Inconnu",
          email: null,
          phone: null,
          address: null,
          city: null,
          postalCode: null,
        },
    vehicle: vehicle
      ? {
          id: vehicle.id,
          brand: vehicle.brand || "",
          model: vehicle.model || "",
          plate: vehicle.plate || "",
          vin: vehicle.vin || null,
          year: vehicle.year || null,
          color: vehicle.color || null,
          fuel: vehicle.fuel || null,
        }
      : {
          id: "",
          brand: "Inconnu",
          model: "",
          plate: "",
          vin: null,
          year: null,
          color: null,
          fuel: null,
        },
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      qty: item.qty,
      unitPriceExcl: item.unitPriceExcl,
      vatRate: item.vatRate,
      lineTotalExcl: item.qty * item.unitPriceExcl,
      lineTotalIncl: item.qty * item.unitPriceExcl * (1 + item.vatRate),
    })),
    totals,
    signatureRequest: signatureRequest
      ? {
          id: signatureRequest.id,
          status: signatureRequest.status,
          token: signatureRequest.token,
          sentAt: signatureRequest.sentAt,
          signedAt: signatureRequest.signedAt,
        }
      : undefined,
  };
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;
    const interventionId = String(id);

    // Get intervention with vehicle and client
    const intervention = await prisma.intervention.findFirst({
      where:
        user.role === "ADMIN"
          ? { id: interventionId, deletedAt: null }
          : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        repairOrder: true,
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable."), {
        status: 404,
      });
    }

    // Check if RepairOrder exists
    if (!intervention.repairOrder) {
      return NextResponse.json(
        failure("Ordre de réparation introuvable. Veuillez d'abord le créer."),
        { status: 404 }
      );
    }

    // Get signature request if exists
    const signatureRequest = await prisma.signatureRequest.findFirst({
      where: {
        documentType: "INTERVENTION_ORDER",
        documentId: interventionId,
      },
      orderBy: { createdAt: "desc" },
    });

    const response = await buildOrResponse(
      intervention.repairOrder,
      intervention,
      signatureRequest
    );
    return NextResponse.json(success(response));
  } catch (err) {
    console.error("Erreur API GET /api/interventions/[id]/or :", err);
    return toErrorResponse(err);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;
    const interventionId = String(id);

    // Get intervention
    const intervention = await prisma.intervention.findFirst({
      where:
        user.role === "ADMIN"
          ? { id: interventionId, deletedAt: null }
          : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        repairOrder: true,
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable."), {
        status: 404,
      });
    }

    if (!intervention.garageId) {
      return NextResponse.json(failure("Garage introuvable pour cette intervention."), {
        status: 400,
      });
    }

    // Check if OR already exists
    if (intervention.repairOrder) {
      return NextResponse.json(
        failure("Un ordre de réparation existe déjà pour cette intervention."),
        { status: 400 }
      );
    }

    // Try to get items from latest accepted devis
    let items: OrItem[] = [];

    const latestQuote = await prisma.quote.findFirst({
      where: {
        vehicleId: intervention.vehicleId,
        organisationId: intervention.garageId,
        deletedAt: null,
        status: { in: ["ACCEPTED", "SENT", "DRAFT"] },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        lines: true,
      },
    });

    if (latestQuote && latestQuote.lines.length > 0) {
      // Copy lines from devis
      items = latestQuote.lines.map((line) => ({
        id: crypto.randomUUID(),
        description: line.description,
        qty: line.qty,
        unitPriceExcl: line.unitPriceExcl,
        vatRate: line.vatRate,
      }));
    }

    // If no devis items, create default item from intervention description
    if (items.length === 0) {
      items = [
        {
          id: crypto.randomUUID(),
          description:
            intervention.title ||
            intervention.notes ||
            `Intervention ${intervention.type}`,
          qty: 1,
          unitPriceExcl: intervention.amountCents
            ? intervention.amountCents / 100
            : 0,
          vatRate: 0.2,
        },
      ];
    }

    // Build snapshot
    const decryptedClient = intervention.vehicle?.client
      ? decryptClientData(intervention.vehicle.client as Record<string, unknown>)
      : null;

    const snapshot: SnapshotData = {
      items,
      vehicle: intervention.vehicle
        ? {
            id: intervention.vehicle.id,
            brand: intervention.vehicle.brand,
            model: intervention.vehicle.model,
            plate: intervention.vehicle.plate,
            vin: intervention.vehicle.vin,
            year: intervention.vehicle.year,
            fuel: intervention.vehicle.fuel,
          }
        : null,
      client: decryptedClient
        ? {
            id: decryptedClient.id,
            firstName: decryptedClient.firstName,
            lastName: decryptedClient.lastName,
            email: decryptedClient.email,
            phone: decryptedClient.phone,
            address: decryptedClient.address,
            city: decryptedClient.city,
            postalCode: decryptedClient.postalCode,
          }
        : null,
      intervention: {
        id: intervention.id,
        type: intervention.type,
        title: intervention.title,
        notes: intervention.notes,
        performedAt: intervention.performedAt,
        odometerKm: intervention.odometerKm,
      },
      createdAt: new Date().toISOString(),
    };

    // Create RepairOrder
    const repairOrder = await prisma.repairOrder.create({
      data: {
        garageId: intervention.garageId,
        interventionId: intervention.id,
        status: "DRAFT",
        snapshotJson: JSON.stringify(snapshot),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        garageId: intervention.garageId ?? user.garageId ?? null,
        userId: user.id,
        action: "OR_CREATED",
        entityType: "RepairOrder",
        entityId: repairOrder.id,
      },
    });

    const response = await buildOrResponse(repairOrder, intervention, null);
    return NextResponse.json(success(response), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/interventions/[id]/or :", err);
    return toErrorResponse(err);
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;
    const interventionId = String(id);

    const body = await req.json().catch(() => null);
    const parsed = UpdateOrSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Body invalide",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Get intervention with repair order
    const intervention = await prisma.intervention.findFirst({
      where:
        user.role === "ADMIN"
          ? { id: interventionId, deletedAt: null }
          : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        repairOrder: true,
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable."), {
        status: 404,
      });
    }

    if (!intervention.repairOrder) {
      return NextResponse.json(
        failure("Ordre de réparation introuvable."),
        { status: 404 }
      );
    }

    // Check if OR is signed (locked)
    if (intervention.repairOrder.status === "SIGNED") {
      return NextResponse.json(
        failure("L'ordre de réparation est signé et ne peut plus être modifié."),
        { status: 400 }
      );
    }

    // Parse existing snapshot and update items
    let snapshot: SnapshotData = { items: [] };
    if (intervention.repairOrder.snapshotJson) {
      try {
        snapshot = JSON.parse(intervention.repairOrder.snapshotJson);
      } catch {
        snapshot = { items: [] };
      }
    }

    // Update items with new UUIDs
    snapshot.items = parsed.data.items.map((item) => ({
      id: crypto.randomUUID(),
      description: item.description,
      qty: item.qty,
      unitPriceExcl: item.unitPriceExcl,
      vatRate: item.vatRate,
    }));

    // Update RepairOrder
    const updatedRepairOrder = await prisma.repairOrder.update({
      where: { id: intervention.repairOrder.id },
      data: {
        snapshotJson: JSON.stringify(snapshot),
      },
    });

    // Get signature request for status
    const signatureRequest = await prisma.signatureRequest.findFirst({
      where: {
        documentType: "INTERVENTION_ORDER",
        documentId: interventionId,
      },
      orderBy: { createdAt: "desc" },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        garageId: intervention.garageId ?? user.garageId ?? null,
        userId: user.id,
        action: "OR_UPDATED",
        entityType: "RepairOrder",
        entityId: updatedRepairOrder.id,
      },
    });

    const response = await buildOrResponse(
      updatedRepairOrder,
      intervention,
      signatureRequest
    );
    return NextResponse.json(success(response));
  } catch (err) {
    console.error("Erreur API PATCH /api/interventions/[id]/or :", err);
    return toErrorResponse(err);
  }
}
