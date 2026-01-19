/**
 * IN-APP-STATUS-AND-CHANGES-01: Changelog Entry Detail API (Garage)
 * GET /api/changelog/[id] - Get single changelog entry
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    // Auth required - garage users only
    const user = await requireUser(req);
    requireApprovedTenant(user);

    const { id } = await params;

    const entry = await prisma.changelogEntry.findFirst({
      where: {
        id,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        bodyMarkdown: true,
        type: true,
        version: true,
        publishedAt: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entrée non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (err) {
    console.error("[API:Changelog:Detail] Error:", err);
    return toErrorResponse(err);
  }
}
