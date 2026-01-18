/**
 * WORKSHOP-OPS-01: Repair Order (Ordre de Réparation) API
 * 
 * GET  - Get repair order for intervention
 * POST - Create repair order for intervention
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { decryptClientData } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/interventions/[id]/repair-order
 * Get the repair order for an intervention
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await ctx.params;

    if (!interventionId) {
      throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    }

    // Feature gate
    if (user.role !== "ADMIN" && user.garageId) {
      await requireFeature(user.garageId, FeatureKey.REPAIR_ORDER);
    }

    // Verify intervention access
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true },
    });

    if (!intervention) {
      throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    }

    // Get repair order
    const repairOrder = await prisma.repairOrder.findUnique({
      where: { interventionId },
    });

    if (!repairOrder) {
      return NextResponse.json(success({ exists: false, repairOrder: null }));
    }

    return NextResponse.json(success({ exists: true, repairOrder }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/interventions/[id]/repair-order
 * Create a repair order for an intervention (draft)
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await ctx.params;

    if (!interventionId) {
      throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    }

    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    // Feature gate
    await requireFeature(user.garageId, FeatureKey.REPAIR_ORDER);

    // Verify intervention access and get data for snapshot
    const intervention = await prisma.intervention.findFirst({
      where: { id: interventionId, garageId: user.garageId, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        garage: true,
      },
    });

    if (!intervention) {
      throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    }

    // Check if repair order already exists
    const existing = await prisma.repairOrder.findUnique({
      where: { interventionId },
    });

    if (existing) {
      throw new RouteError(409, "CONFLICT", "Un ordre de réparation existe déjà pour cette intervention");
    }

    // Decrypt client data for snapshot
    const clientRaw = intervention.vehicle.client as Record<string, unknown>;
    const clientDecrypted = decryptClientData(clientRaw);

    // Create snapshot JSON (intervention + vehicle + client + estimated price)
    const snapshot = {
      interventionId: intervention.id,
      type: intervention.type,
      title: intervention.title,
      notes: intervention.notes,
      tags: intervention.tags,
      amountCents: intervention.amountCents,
      vehicle: {
        id: intervention.vehicle.id,
        plate: intervention.vehicle.plate,
        brand: intervention.vehicle.brand,
        model: intervention.vehicle.model,
        vin: intervention.vehicle.vin,
      },
      client: {
        id: clientDecrypted.id,
        firstName: clientDecrypted.firstName,
        lastName: clientDecrypted.lastName,
        // Don't store sensitive data in snapshot
      },
      garage: {
        id: intervention.garage?.id,
        name: intervention.garage?.displayName || intervention.garage?.name,
        address: intervention.garage?.address,
        phone: intervention.garage?.phone,
        siret: intervention.garage?.siret,
      },
      createdAt: new Date().toISOString(),
    };

    // Create repair order
    const repairOrder = await prisma.repairOrder.create({
      data: {
        garageId: user.garageId,
        interventionId,
        status: "DRAFT",
        snapshotJson: JSON.stringify(snapshot),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: user.garageId,
        userId: user.id,
        action: "REPAIR_ORDER_CREATED",
        entityType: "REPAIR_ORDER",
        entityId: repairOrder.id,
        metadata: { interventionId },
      },
    });

    return NextResponse.json(success({ repairOrder }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
