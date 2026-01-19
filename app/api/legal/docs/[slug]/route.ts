/**
 * LEGAL-PACK-01: Get Legal Document by Slug
 * GET /api/legal/docs/[slug] - Get full content of a legal document
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;

    if (!slug) {
      return NextResponse.json(failure("Slug requis"), { status: 400 });
    }

    // Get the document
    const doc = await prisma.legalDoc.findUnique({
      where: { slug },
    });

    if (!doc) {
      throw new RouteError(404, "NOT_FOUND", "Document introuvable");
    }

    // Get query params for version
    const url = new URL(req.url);
    const versionParam = url.searchParams.get("version");

    let version;
    if (versionParam) {
      // Get specific version
      const vNum = parseInt(versionParam, 10);
      version = await prisma.legalDocVersion.findFirst({
        where: {
          legalDocId: doc.id,
          versionNumber: vNum,
          isPublished: true,
        },
      });
    } else {
      // Get current effective version
      version = await prisma.legalDocVersion.findFirst({
        where: {
          legalDocId: doc.id,
          isPublished: true,
          effectiveAt: { lte: new Date() },
        },
        orderBy: { effectiveAt: "desc" },
      });
    }

    if (!version) {
      throw new RouteError(404, "NOT_FOUND", "Aucune version publiée trouvée");
    }

    // Get all published versions for navigation
    const allVersions = await prisma.legalDocVersion.findMany({
      where: {
        legalDocId: doc.id,
        isPublished: true,
      },
      orderBy: { versionNumber: "desc" },
      select: {
        id: true,
        versionNumber: true,
        effectiveAt: true,
      },
    });

    return NextResponse.json(
      success({
        doc: {
          id: doc.id,
          slug: doc.slug,
          title: doc.title,
          scope: doc.scope,
        },
        version: {
          id: version.id,
          versionNumber: version.versionNumber,
          effectiveAt: version.effectiveAt,
          bodyMarkdown: version.bodyMarkdown,
          sha256: version.sha256,
          publishedAt: version.publishedAt,
        },
        allVersions,
      })
    );
  } catch (err) {
    console.error("[Legal Doc] Error:", err);
    return toErrorResponse(err);
  }
}
