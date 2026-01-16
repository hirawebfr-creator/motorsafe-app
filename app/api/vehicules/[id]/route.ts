import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { decryptClientData } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  brand: z.string().trim().min(2).max(60).optional(),
  model: z.string().trim().min(2).max(60).optional(),
  plate: z.string().trim().min(2).max(12).optional(),
  vin: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{17}$/).optional().or(z.literal("")),
  fuel: z.string().trim().max(40).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  engine: z.string().trim().max(80).optional().or(z.literal("")),
});

function cleanOptional(value: string | undefined) {
  const v = (value ?? "").trim();
  return v.length ? v : null;
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        client: true,
        interventions: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!vehicle) {
      return NextResponse.json(failure("Vehicule introuvable"), { status: 404 });
    }

    // Décrypter les données client
    const result = {
      ...vehicle,
      client: vehicle.client ? decryptClientData(vehicle.client as Record<string, unknown>) : vehicle.client,
    };

    return NextResponse.json(success(result));
  } catch (err) {
    console.error("Erreur API GET /api/vehicules/[id] :", err);
    return toErrorResponse(err);
  }
}

async function updateVehicle(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const existing = await prisma.vehicle.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true, clientId: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Vehicule introuvable"), { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let nextClientId: number | undefined;
      let nextGarageId: number | undefined;

      if (input.clientId !== undefined && input.clientId !== existing.clientId) {
        const client = await tx.client.findFirst({
          where: user.role === "ADMIN"
            ? {
                id: input.clientId,
                deletedAt: null,
                ...(existing.garageId != null ? { garageId: existing.garageId } : {}),
              }
            : { id: input.clientId, garageId: user.garageId ?? -1, deletedAt: null },
          select: { id: true, garageId: true },
        });

        if (!client) {
          return NextResponse.json(failure("Client introuvable"), { status: 404 });
        }

        nextClientId = client.id;
        if (existing.garageId == null && client.garageId != null) {
          nextGarageId = client.garageId;
        }
      }

      // SECURITY: Include garageId in where clause to prevent TOCTOU race condition
      const vehicle = await tx.vehicle.update({
        where: user.role === "ADMIN"
          ? { id }
          : { id, garageId: user.garageId ?? -1 },
        data: {
          ...(nextClientId !== undefined ? { clientId: nextClientId } : {}),
          ...(nextGarageId !== undefined ? { garageId: nextGarageId } : {}),
          ...(input.brand ? { brand: input.brand } : {}),
          ...(input.model ? { model: input.model } : {}),
          ...(input.plate ? { plate: input.plate.toUpperCase() } : {}),
          ...(input.vin !== undefined
            ? { vin: cleanOptional(input.vin)?.toUpperCase() ?? null }
            : {}),
          ...(input.fuel !== undefined ? { fuel: cleanOptional(input.fuel) } : {}),
          ...(input.year !== undefined ? { year: input.year } : {}),
          ...(input.engine !== undefined ? { engine: cleanOptional(input.engine) } : {}),
        },
        include: { client: true },
      });

      await tx.auditLog.create({
        data: {
          garageId: existing.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "VEHICLE_UPDATE",
          entityType: "Vehicle",
          entityId: id,
        },
      });

      return vehicle;
    });

    if (updated instanceof NextResponse) return updated;

    return NextResponse.json(success(updated), { status: 200 });
  } catch (err) {
    console.error("Erreur API PUT /api/vehicules/[id] :", err);
    return toErrorResponse(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  return updateVehicle(req, ctx);
}

export async function PATCH(req: Request, ctx: Ctx) {
  return updateVehicle(req, ctx);
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const existing = await prisma.vehicle.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Vehicule introuvable"), { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // SECURITY: Include garageId in where clause to prevent TOCTOU race condition
      await tx.vehicle.update({
        where: user.role === "ADMIN"
          ? { id }
          : { id, garageId: user.garageId ?? -1 },
        data: { deletedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          garageId: existing.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "VEHICLE_DELETE",
          entityType: "Vehicle",
          entityId: id,
        },
      });
    });

    return NextResponse.json(success({ id }), { status: 200 });
  } catch (err) {
    console.error("Erreur API DELETE /api/vehicules/[id] :", err);
    return toErrorResponse(err);
  }
}
