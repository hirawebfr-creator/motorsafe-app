import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, PLAN_LIMITS, FREE_UPGRADE_MESSAGE, type Plan } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { decryptClientData } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).default(20),
  q: z.string().trim().min(1).max(120).optional(),
  clientId: z.coerce.number().int().positive().optional(),
});

const CreateSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  brand: z.string().trim().min(2).max(60),
  model: z.string().trim().min(2).max(60),
  plate: z.string().trim().min(2).max(12),
  vin: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{17}$/).optional().or(z.literal("")),
  fuel: z.string().trim().max(40).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  engine: z.string().trim().max(80).optional().or(z.literal("")),
  garageId: z.coerce.number().int().positive().optional(),
});

function cleanOptional(value: string | undefined) {
  const v = (value ?? "").trim();
  return v.length ? v : null;
}

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      clientId: url.searchParams.get("clientId") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Query invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { page, q, clientId } = parsed.data;
    const pageSize = Math.min(parsed.data.pageSize, 100);

    const where: any = {
      deletedAt: null,
      ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
      ...(clientId ? { clientId } : {}),
    };

    if (q) {
      where.OR = [
        { plate: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { client: { firstName: { contains: q, mode: "insensitive" } } },
        { client: { lastName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, rawItems] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { client: true },
      }),
    ]);

    // Décrypter les données clients
    const items = rawItems.map((v) => ({
      ...v,
      client: v.client ? decryptClientData(v.client as Record<string, unknown>) : v.client,
    }));

    return NextResponse.json(success({ items, page, pageSize, total }), { status: 200 });
  } catch (err) {
    console.error("Erreur API GET /api/vehicules :", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const plate = input.plate.toUpperCase();
    const vin = cleanOptional(input.vin)?.toUpperCase() ?? null;

    const client = await prisma.client.findFirst({
      where:
        user.role === "ADMIN"
          ? { id: input.clientId, deletedAt: null }
          : { id: input.clientId, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true },
    });
    if (!client) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Client introuvable." } },
        { status: 404 }
      );
    }

    const targetGarageId = user.role === "ADMIN" ? (input.garageId ?? client.garageId) : user.garageId;
    if (!targetGarageId) {
      return NextResponse.json(
        { ok: false, error: { code: "TENANT_REQUIRED", message: "Garage invalide." } },
        { status: 400 }
      );
    }

    // Plan limits (backend-enforced) - utilise les limites définies dans PLAN_LIMITS
    if (user.role !== "ADMIN") {
      const plan = (user.garage?.plan as Plan) || "FREE";
      const limit = PLAN_LIMITS[plan].vehicules;
      if (limit !== Infinity) {
        const count = await prisma.vehicle.count({ where: { garageId: targetGarageId, deletedAt: null } });
        if (count >= limit) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "LIMIT_REACHED",
                message: `Vous avez atteint la limite de ${limit} véhicules sur le plan Gratuit. ${FREE_UPGRADE_MESSAGE}`,
              },
            },
            { status: 403 }
          );
        }
      }
    }

    const vehicle = await prisma.$transaction(async (tx) => {
      const created = await tx.vehicle.create({
        data: {
          garageId: targetGarageId,
          clientId: input.clientId,
          brand: input.brand,
          model: input.model,
          plate,
          vin,
          fuel: cleanOptional(input.fuel),
          year: input.year ?? undefined,
          engine: cleanOptional(input.engine),
        },
        include: { client: true },
      });

      await tx.auditLog.create({
        data: {
          garageId: targetGarageId,
          userId: user.id,
          action: "VEHICLE_CREATE",
          entityType: "Vehicle",
          entityId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json(success(vehicle), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/vehicules :", err);
    return toErrorResponse(err);
  }
}
