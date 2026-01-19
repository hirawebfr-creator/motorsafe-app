/**
 * LEGAL-PACK-01: Clause Sets Management
 * GET /api/admin/legal/clauses - List all clause sets
 * POST /api/admin/legal/clauses - Create clause set
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

const CreateClauseSetSchema = z.object({
  name: z.string().min(1).max(200),
  interventionTypeId: z.string().optional().nullable(),
  garageId: z.number().int().optional().nullable(), // null = official SafeMotor clauses
  isDefault: z.boolean().default(false),
  initialContent: z.string().optional(),
});

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const clauseSets = await prisma.clauseSet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        interventionType: true,
        garage: { select: { id: true, name: true } },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: {
            id: true,
            versionNumber: true,
            effectiveAt: true,
            isPublished: true,
            sha256: true,
          },
        },
      },
    });

    return NextResponse.json(success(clauseSets));
  } catch (err) {
    console.error("[Clause Sets GET] Error:", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const parsed = CreateClauseSetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure(parsed.error.issues[0].message), { status: 400 });
    }

    const { name, interventionTypeId, garageId, isDefault, initialContent } = parsed.data;

    // Validate intervention type if provided
    if (interventionTypeId) {
      const intType = await prisma.interventionTypeRef.findUnique({
        where: { id: interventionTypeId },
      });
      if (!intType) {
        throw new RouteError(404, "NOT_FOUND", "Type d'intervention introuvable");
      }
    }

    const clauseSet = await prisma.$transaction(async (tx) => {
      const newSet = await tx.clauseSet.create({
        data: {
          name,
          interventionTypeId,
          garageId,
          isDefault,
        },
      });

      // Create initial version if content provided
      if (initialContent) {
        await tx.clauseSetVersion.create({
          data: {
            clauseSetId: newSet.id,
            versionNumber: 1,
            effectiveAt: new Date(),
            bodyMarkdown: initialContent,
            sha256: sha256(initialContent),
            isPublished: false,
            createdBy: user.id,
          },
        });
      }

      return newSet;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "ClauseSet",
        entityId: clauseSet.id,
        action: "CREATED",
        userId: user.id,
        metadata: { name },
      },
    });

    return NextResponse.json(success(clauseSet), { status: 201 });
  } catch (err) {
    console.error("[Clause Set POST] Error:", err);
    return toErrorResponse(err);
  }
}
