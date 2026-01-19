/**
 * LEGAL-PACK-01: Public Legal Documents API
 * GET /api/legal/docs - List all published legal documents
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all legal docs with their current published version
    const docs = await prisma.legalDoc.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        versions: {
          where: {
            isPublished: true,
            effectiveAt: { lte: new Date() },
          },
          orderBy: { effectiveAt: "desc" },
          take: 1,
        },
      },
    });

    const result = docs.map((doc) => {
      const currentVersion = doc.versions[0] || null;
      return {
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        scope: doc.scope,
        currentVersion: currentVersion
          ? {
              id: currentVersion.id,
              versionNumber: currentVersion.versionNumber,
              effectiveAt: currentVersion.effectiveAt,
              sha256: currentVersion.sha256,
            }
          : null,
      };
    });

    return NextResponse.json(success(result));
  } catch (err) {
    console.error("[Legal Docs] Error:", err);
    return toErrorResponse(err);
  }
}
