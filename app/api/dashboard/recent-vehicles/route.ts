import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { parseDateRange } from "@/app/api/dashboard/_utils";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(2),
});

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const url = new URL(req.url);
    const organisationId =
      user.role === "ADMIN"
        ? (() => {
            const garageIdRaw = url.searchParams.get("garageId");
            if (!garageIdRaw) return null;
            const garageId = Number(garageIdRaw);
            if (!Number.isFinite(garageId) || garageId <= 0) {
              throw new RouteError(400, "BAD_REQUEST", "garageId invalide");
            }
            return Math.trunc(garageId);
          })()
        : getTenantId(user);

    const range = parseDateRange(url);
    if (!range.ok) {
      throw new RouteError(400, "BAD_REQUEST", "Query invalide", range.error);
    }

    const parsed = QuerySchema.safeParse({ limit: url.searchParams.get("limit") ?? undefined });
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Query invalide", parsed.error.flatten());
    }

    if (!organisationId) {
      return NextResponse.json(success([]));
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        garageId: organisationId,
        deletedAt: null,
        createdAt: { gte: range.from, lte: range.to },
      },
      orderBy: [{ createdAt: "desc" }],
      take: parsed.data.limit,
      select: {
        id: true,
        brand: true,
        model: true,
        plate: true,
      },
    });

    const data = await Promise.all(
      vehicles.map(async (v) => {
        const agg = await prisma.intervention.aggregate({
          where: {
            garageId: organisationId,
            deletedAt: null,
            vehicleId: v.id,
            createdAt: { gte: range.from, lte: range.to },
          },
          _sum: { amountCents: true },
          _count: { _all: true },
        });

        const interventionsCount = agg._count._all ?? 0;
        const priceCents = Math.max(0, Math.round(agg._sum.amountCents ?? 0));
        const rating = Math.min(5, Math.max(1, Math.round(1 + interventionsCount / 2)));

        const label = `${v.brand} ${v.model}`.trim();
        return {
          id: v.id,
          label,
          plate: v.plate,
          rating,
          priceCents,
          imageUrl: null as string | null,
        };
      })
    );

    return NextResponse.json(success(data));
  } catch (err) {
    return toErrorResponse(err);
  }
}
