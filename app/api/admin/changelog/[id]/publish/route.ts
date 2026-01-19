/**
 * IN-APP-STATUS-AND-CHANGES-01: Admin Changelog Publish Toggle API
 * POST /api/admin/changelog/[id]/publish - Toggle publish status
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await params;

    const existing = await prisma.changelogEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entrée non trouvée" }, { status: 404 });
    }

    const newPublished = !existing.isPublished;

    const entry = await prisma.changelogEntry.update({
      where: { id },
      data: {
        isPublished: newPublished,
        publishedAt: newPublished && !existing.isPublished ? new Date() : undefined,
      },
      select: {
        id: true,
        title: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    console.log(`[API:Admin:Changelog] Toggled publish for ${entry.id} to ${entry.isPublished} by admin ${user.id}`);

    return NextResponse.json({ entry });
  } catch (err) {
    console.error("[API:Admin:Changelog:Publish] Error:", err);
    return toErrorResponse(err);
  }
}
