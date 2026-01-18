/**
 * WORKSHOP-OPS-01: Loan Contracts API
 * 
 * GET  - List loan contracts for garage
 * POST - Create a new loan contract (vehicle out)
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

const FuelLevelEnum = z.enum(["EMPTY", "QUARTER", "HALF", "THREE_QUARTERS", "FULL"]);

const CreateSchema = z.object({
  loanVehicleId: z.string().min(1),
  clientId: z.coerce.number().int().positive(),
  interventionId: z.string().optional(),
  startAt: z.string().datetime().optional(), // ISO date, defaults to now
  endAtPlanned: z.string().datetime().optional(),
  kmOut: z.coerce.number().int().min(0),
  fuelOut: FuelLevelEnum.default("HALF"),
  conditionOut: z.string().max(1000).optional(),
  photosOutKeys: z.array(z.string()).max(10).optional(),
});

const QuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(["OUT", "RETURNED", "DISPUTE"]).optional(),
  loanVehicleId: z.string().optional(),
});

/**
 * GET /api/loan-contracts
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
    const parsed = QuerySchema.safeParse({
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      status: url.searchParams.get("status") || undefined,
      loanVehicleId: url.searchParams.get("loanVehicleId") || undefined,
    });

    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Paramètres invalides");
    }

    const { from, to, status, loanVehicleId } = parsed.data;

    const contracts = await prisma.loanContract.findMany({
      where: {
        garageId: user.garageId,
        ...(from ? { startAt: { gte: new Date(from) } } : {}),
        ...(to ? { startAt: { lte: new Date(to) } } : {}),
        ...(status ? { status } : {}),
        ...(loanVehicleId ? { loanVehicleId } : {}),
      },
      orderBy: { startAt: "desc" },
      include: {
        loanVehicle: { select: { id: true, plate: true, make: true, model: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 100,
    });

    return NextResponse.json(success({ contracts }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/loan-contracts
 * Create a new loan contract (vehicle departure)
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

    const input = parsed.data;

    // Verify loan vehicle exists and belongs to garage
    const loanVehicle = await prisma.loanVehicle.findFirst({
      where: { id: input.loanVehicleId, garageId: user.garageId, active: true },
    });

    if (!loanVehicle) {
      throw new RouteError(404, "NOT_FOUND", "Véhicule de prêt introuvable ou inactif");
    }

    // Check vehicle is not already out
    const activeContract = await prisma.loanContract.findFirst({
      where: { loanVehicleId: input.loanVehicleId, status: "OUT" },
    });

    if (activeContract) {
      throw new RouteError(409, "CONFLICT", "Ce véhicule est déjà en prêt");
    }

    // Verify client exists and belongs to garage
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, garageId: user.garageId, deletedAt: null },
    });

    if (!client) {
      throw new RouteError(404, "NOT_FOUND", "Client introuvable");
    }

    // Create contract
    const contract = await prisma.loanContract.create({
      data: {
        garageId: user.garageId,
        loanVehicleId: input.loanVehicleId,
        clientId: input.clientId,
        interventionId: input.interventionId,
        startAt: input.startAt ? new Date(input.startAt) : new Date(),
        endAtPlanned: input.endAtPlanned ? new Date(input.endAtPlanned) : null,
        kmOut: input.kmOut,
        fuelOut: input.fuelOut,
        conditionOut: input.conditionOut,
        photosOutKeys: input.photosOutKeys || [],
        status: "OUT",
      },
      include: {
        loanVehicle: { select: { id: true, plate: true, make: true, model: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: user.garageId,
        userId: user.id,
        action: "LOAN_CONTRACT_CREATED",
        entityType: "LOAN_CONTRACT",
        entityId: contract.id,
        metadata: {
          loanVehicleId: input.loanVehicleId,
          clientId: input.clientId,
          plate: loanVehicle.plate,
        },
      },
    });

    return NextResponse.json(success({ contract }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
