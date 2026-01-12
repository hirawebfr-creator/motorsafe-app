import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { parseDateRange } from "@/app/api/dashboard/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    if (!organisationId) {
      return NextResponse.json(
        success({
          clientsCount: 0,
          vehiclesCount: 0,
          interventionsCount: 0,
          revenueTotalCents: 0,
        })
      );
    }

    const whereTime = { gte: range.from, lte: range.to };

    const [clientsCount, vehiclesCount, interventionsCount] = await Promise.all([
      prisma.client.count({ where: { garageId: organisationId, deletedAt: null, createdAt: whereTime } }),
      prisma.vehicle.count({ where: { garageId: organisationId, deletedAt: null, createdAt: whereTime } }),
      prisma.intervention.count({ where: { garageId: organisationId, deletedAt: null, createdAt: whereTime } }),
    ]);

    const invoiceSum = await prisma.invoice.aggregate({
      where: {
        organisationId,
        deletedAt: null,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] },
        OR: [
          { issuedAt: whereTime },
          { issuedAt: null, createdAt: whereTime },
        ],
      },
      _sum: { totalIncl: true },
    });

    const revenueTotalCents = Math.max(0, Math.round((invoiceSum._sum.totalIncl ?? 0) * 100));

    return NextResponse.json(
      success({
        clientsCount,
        vehiclesCount,
        interventionsCount,
        revenueTotalCents,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
