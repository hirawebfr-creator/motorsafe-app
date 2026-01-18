/**
 * WORKSHOP-OPS-01: Loan Contract Return API
 * 
 * POST - Process vehicle return
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

type Ctx = { params: Promise<{ id: string }> };

const FuelLevelEnum = z.enum(["EMPTY", "QUARTER", "HALF", "THREE_QUARTERS", "FULL"]);

const ReturnSchema = z.object({
  kmIn: z.coerce.number().int().min(0),
  fuelIn: FuelLevelEnum,
  conditionIn: z.string().max(1000).optional(),
  photosInKeys: z.array(z.string()).max(10).optional(),
  hasDispute: z.boolean().optional().default(false),
});

/**
 * POST /api/loan-contracts/[id]/return
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;

    if (!id) {
      throw new RouteError(400, "BAD_REQUEST", "ID contrat requis");
    }

    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    // Feature gate
    await requireFeature(user.garageId, FeatureKey.LOAN_VEHICLE);

    const body = await req.json().catch(() => null);
    const parsed = ReturnSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Données invalides", parsed.error.flatten());
    }

    // Get contract
    const contract = await prisma.loanContract.findFirst({
      where: { id, garageId: user.garageId },
      include: { loanVehicle: true },
    });

    if (!contract) {
      throw new RouteError(404, "NOT_FOUND", "Contrat introuvable");
    }

    if (contract.status !== "OUT") {
      throw new RouteError(400, "BAD_REQUEST", `Le véhicule a déjà été restitué (statut: ${contract.status})`);
    }

    const input = parsed.data;

    // Update contract with return data
    const updatedContract = await prisma.loanContract.update({
      where: { id },
      data: {
        returnAt: new Date(),
        kmIn: input.kmIn,
        fuelIn: input.fuelIn,
        conditionIn: input.conditionIn,
        photosInKeys: input.photosInKeys || [],
        status: input.hasDispute ? "DISPUTE" : "RETURNED",
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
        action: "LOAN_CONTRACT_RETURNED",
        entityType: "LOAN_CONTRACT",
        entityId: contract.id,
        metadata: {
          kmIn: input.kmIn,
          kmDriven: input.kmIn - contract.kmOut,
          hasDispute: input.hasDispute,
          plate: contract.loanVehicle.plate,
        },
      },
    });

    return NextResponse.json(success({ contract: updatedContract }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
