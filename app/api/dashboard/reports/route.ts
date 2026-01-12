import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { parseDateRange } from "@/app/api/dashboard/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATE_LABELS = ["10am", "11am", "12am", "01am", "02am", "03am", "04am", "05am", "06am", "07am"] as const;
const TEMPLATE_HOURS = [10, 11, 0, 1, 2, 3, 4, 5, 6, 7] as const;

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
      return NextResponse.json(success({ labels: [...TEMPLATE_LABELS], values: TEMPLATE_HOURS.map(() => 0) }));
    }

    // SQLite: group by hour-of-day using strftime('%H', createdAt)
    const rows = await prisma.$queryRaw<Array<{ hour: string; count: number }>>`
      SELECT strftime('%H', createdAt) as hour, COUNT(*) as count
      FROM Intervention
      WHERE garageId = ${organisationId}
        AND deletedAt IS NULL
        AND createdAt >= ${range.from}
        AND createdAt <= ${range.to}
      GROUP BY hour
    `;

    const byHour = new Map<number, number>();
    for (const row of rows) {
      const hourNum = Number(row.hour);
      if (!Number.isFinite(hourNum)) continue;
      byHour.set(hourNum, Number(row.count) || 0);
    }

    const values = TEMPLATE_HOURS.map((h) => byHour.get(h) ?? 0);
    return NextResponse.json(success({ labels: [...TEMPLATE_LABELS], values }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
