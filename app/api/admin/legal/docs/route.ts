/**
 * LEGAL-PACK-01: Admin Legal Documents Management
 * GET /api/admin/legal/docs - List all legal docs with versions
 * POST /api/admin/legal/docs - Create new legal doc
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

const CreateDocSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  scope: z.enum(["PUBLIC", "APP"]).default("PUBLIC"),
  sortOrder: z.number().int().default(0),
  initialContent: z.string().optional(),
});

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const docs = await prisma.legalDoc.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          select: {
            id: true,
            versionNumber: true,
            effectiveAt: true,
            isPublished: true,
            publishedAt: true,
            sha256: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(success(docs));
  } catch (err) {
    console.error("[Admin Legal Docs] Error:", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const parsed = CreateDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure(parsed.error.issues[0].message), { status: 400 });
    }

    const { slug, title, scope, sortOrder, initialContent } = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.legalDoc.findUnique({ where: { slug } });
    if (existing) {
      throw new RouteError(409, "CONFLICT", "Un document avec ce slug existe déjà");
    }

    // Create document with optional initial version
    const doc = await prisma.$transaction(async (tx) => {
      const newDoc = await tx.legalDoc.create({
        data: {
          slug,
          title,
          scope,
          sortOrder,
        },
      });

      // Create initial draft version if content provided
      if (initialContent) {
        await tx.legalDocVersion.create({
          data: {
            legalDocId: newDoc.id,
            versionNumber: 1,
            effectiveAt: new Date(),
            bodyMarkdown: initialContent,
            sha256: sha256(initialContent),
            isPublished: false,
            createdBy: user.id,
          },
        });
      }

      return newDoc;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LegalDoc",
        entityId: doc.id,
        action: "CREATED",
        userId: user.id,
        metadata: { slug, title },
      },
    });

    return NextResponse.json(success(doc), { status: 201 });
  } catch (err) {
    console.error("[Admin Create Legal Doc] Error:", err);
    return toErrorResponse(err);
  }
}
