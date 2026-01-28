/**
 * IN-APP-STATUS-AND-CHANGES-01: Changelog API (Garage)
 * GET /api/changelog - List changelog entries
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Auth required - garage users only
    const user = await requireUser(req);
    requireApprovedTenant(user);

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
    const type = url.searchParams.get("type"); // FEATURE | FIX | SECURITY | LEGAL

    const where: { isPublished: boolean; type?: "FEATURE" | "FIX" | "SECURITY" | "LEGAL" } = {
      isPublished: true,
    };

    if (type && ["FEATURE", "FIX", "SECURITY", "LEGAL"].includes(type)) {
      where.type = type as "FEATURE" | "FIX" | "SECURITY" | "LEGAL";
    }

    const entries = await prisma.changelogEntry.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        type: true,
        version: true,
        publishedAt: true,
        // Don't include body in list for performance
      },
    });

    return NextResponse.json(success({ entries }));
  } catch (err) {
    console.error("[API:Changelog:List] Error:", err);
    return toErrorResponse(err);
  }
}
