/**
 * WORKSHOP-OPS-01: Loan Vehicles (Véhicules de prêt) API
 * 
 * GET  - List loan vehicles for garage
 * POST - Create a new loan vehicle
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  plate: z.string().trim().min(1).max(20),
  make: z.string().trim().max(50).optional(),
  model: z.string().trim().max(50).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * GET /api/loan-vehicles
 * List all loan vehicles for the garage
 */
export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    // Feature gate
    await requireFeature(user.garageId, FeatureKey.LOAN_VEHICLE);

    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active") !== "false";

    const vehicles = await prisma.loanVehicle.findMany({
      where: {
        garageId: user.garageId,
        ...(activeOnly ? { active: true } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        contracts: {
          where: { status: "OUT" },
          take: 1,
          orderBy: { startAt: "desc" },
          select: { id: true, clientId: true, startAt: true },
        },
      },
    });

    // Add availability status
    const result = vehicles.map((v) => ({
      ...v,
      isAvailable: v.contracts.length === 0,
      currentContract: v.contracts[0] || null,
    }));

    return NextResponse.json(success({ vehicles: result }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/loan-vehicles
 * Create a new loan vehicle
 */
export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    // Feature gate
    await requireFeature(user.garageId, FeatureKey.LOAN_VEHICLE);

    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Données invalides", parsed.error.flatten());
    }

    const { plate, make, model, year, notes } = parsed.data;

    // Check for duplicate plate in garage
    const existing = await prisma.loanVehicle.findFirst({
      where: { garageId: user.garageId, plate: plate.toUpperCase() },
    });

    if (existing) {
      throw new RouteError(409, "CONFLICT", "Un véhicule de prêt avec cette immatriculation existe déjà");
    }

    const vehicle = await prisma.loanVehicle.create({
      data: {
        garageId: user.garageId,
        plate: plate.toUpperCase(),
        make,
        model,
        year,
        notes,
        active: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: user.garageId,
        userId: user.id,
        action: "LOAN_VEHICLE_CREATED",
        entityType: "LOAN_VEHICLE",
        entityId: vehicle.id,
        metadata: { plate: vehicle.plate },
      },
    });

    return NextResponse.json(success({ vehicle }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
