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
      return NextResponse.json(success({ done: 0, inProgress: 0, cancelled: 0 }));
    }

    const whereBase = {
      garageId: organisationId,
      deletedAt: null as null,
      createdAt: { gte: range.from, lte: range.to },
    };

    const [done, inProgress, cancelled] = await Promise.all([
      prisma.intervention.count({ where: { ...whereBase, status: "DONE" } }),
      prisma.intervention.count({ where: { ...whereBase, status: { in: ["OPEN", "DRAFT"] } } }),
      prisma.intervention.count({ where: { ...whereBase, status: "CANCELED" } }),
    ]);

    return NextResponse.json(success({ done, inProgress, cancelled }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
