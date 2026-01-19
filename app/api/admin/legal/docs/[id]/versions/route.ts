/**
 * LEGAL-PACK-01: Admin Legal Document Versions
 * GET /api/admin/legal/docs/[id]/versions - List all versions
 * POST /api/admin/legal/docs/[id]/versions - Create new version
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const CreateVersionSchema = z.object({
  bodyMarkdown: z.string().min(1),
  effectiveAt: z.string().datetime().optional(),
});

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await ctx.params;

    const doc = await prisma.legalDoc.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
        },
      },
    });

    if (!doc) {
      throw new RouteError(404, "NOT_FOUND", "Document introuvable");
    }

    return NextResponse.json(success(doc));
  } catch (err) {
    console.error("[Admin Legal Versions] Error:", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = CreateVersionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure(parsed.error.issues[0].message), { status: 400 });
    }

    const { bodyMarkdown, effectiveAt } = parsed.data;

    const doc = await prisma.legalDoc.findUnique({ where: { id } });
    if (!doc) {
      throw new RouteError(404, "NOT_FOUND", "Document introuvable");
    }

    // Get next version number
    const lastVersion = await prisma.legalDocVersion.findFirst({
      where: { legalDocId: id },
      orderBy: { versionNumber: "desc" },
    });

    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await prisma.legalDocVersion.create({
      data: {
        legalDocId: id,
        versionNumber: nextVersionNumber,
        effectiveAt: effectiveAt ? new Date(effectiveAt) : new Date(),
        bodyMarkdown,
        sha256: sha256(bodyMarkdown),
        isPublished: false,
        createdBy: user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LegalDocVersion",
        entityId: version.id,
        action: "CREATED",
        userId: user.id,
        metadata: { docId: id, versionNumber: nextVersionNumber },
      },
    });

    return NextResponse.json(success(version), { status: 201 });
  } catch (err) {
    console.error("[Admin Create Legal Version] Error:", err);
    return toErrorResponse(err);
  }
}
