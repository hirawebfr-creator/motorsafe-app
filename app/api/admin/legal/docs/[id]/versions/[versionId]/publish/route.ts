/**
 * LEGAL-PACK-01: Publish Legal Document Version
 * POST /api/admin/legal/docs/[id]/versions/[versionId]/publish
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; versionId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id, versionId } = await ctx.params;

    const version = await prisma.legalDocVersion.findFirst({
      where: { id: versionId, legalDocId: id },
    });

    if (!version) {
      throw new RouteError(404, "NOT_FOUND", "Version introuvable");
    }

    if (version.isPublished) {
      throw new RouteError(409, "ALREADY_PUBLISHED", "Cette version est déjà publiée");
    }

    const updated = await prisma.legalDocVersion.update({
      where: { id: versionId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LegalDocVersion",
        entityId: versionId,
        action: "PUBLISHED",
        userId: user.id,
        metadata: { docId: id, versionNumber: version.versionNumber },
      },
    });

    return NextResponse.json(success(updated));
  } catch (err) {
    console.error("[Admin Publish Version] Error:", err);
    return toErrorResponse(err);
  }
}
