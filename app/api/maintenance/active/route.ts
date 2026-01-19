/**
 * IN-APP-STATUS-AND-CHANGES-01: Active Maintenance API (Garage)
 * GET /api/maintenance/active - Get current or upcoming maintenance windows
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Auth required - garage users only
    const user = await requireUser(req);
    requireApprovedTenant(user);

    const now = new Date();
    // Look ahead 24 hours for upcoming maintenance
    const lookahead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get active or upcoming maintenance windows
    const maintenances = await prisma.maintenanceWindow.findMany({
      where: {
        isActive: true,
        OR: [
          // Currently active
          {
            startsAt: { lte: now },
            endsAt: { gte: now },
          },
          // Starting within 24 hours
          {
            startsAt: { gt: now, lte: lookahead },
          },
        ],
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        message: true,
        startsAt: true,
        endsAt: true,
        severity: true,
      },
    });

    // Categorize maintenances
    const current = maintenances.find(
      m => new Date(m.startsAt) <= now && new Date(m.endsAt) >= now
    ) || null;
    
    const upcoming = maintenances.filter(
      m => new Date(m.startsAt) > now
    );

    return NextResponse.json({
      current,
      upcoming,
      hasActive: current !== null,
      hasUpcoming: upcoming.length > 0,
    });
  } catch (err) {
    console.error("[API:Maintenance:Active] Error:", err);
    return toErrorResponse(err);
  }
}
