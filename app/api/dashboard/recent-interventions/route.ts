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
  limit: z.coerce.number().int().min(1).max(20).default(4),
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

    const items = await prisma.intervention.findMany({
      where: {
        garageId: organisationId,
        deletedAt: null,
        createdAt: { gte: range.from, lte: range.to },
      },
      orderBy: [{ createdAt: "desc" }],
      take: parsed.data.limit,
      include: {
        vehicle: { select: { brand: true, model: true, plate: true } },
      },
    });

    const data = items.map((it) => {
      const vehicleLabel = `${it.vehicle.brand} ${it.vehicle.model}`.trim();
      const ref = `#MS-${String(it.id).slice(-6).toUpperCase()}`;
      const priceCents = Math.max(0, Math.round((it.amountCents ?? 0) || 0));
      const totalCents = priceCents;
      return {
        id: it.id,
        ref,
        vehicleLabel,
        priceCents,
        status: it.status,
        totalCents,
      };
    });

    return NextResponse.json(success(data));
  } catch (err) {
    return toErrorResponse(err);
  }
}
