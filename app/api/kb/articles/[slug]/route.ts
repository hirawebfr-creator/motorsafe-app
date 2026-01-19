/**
 * KNOWLEDGE-BASE-01: KB Article Detail API (Garage read-only)
 * GET - Get single published article by slug
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

export async function GET(req: Request, context: Context) {
  try {
    // Auth required for KB access
    await requireUser(req);

    const { slug } = await context.params;

    if (!slug) {
      throw new RouteError(400, "BAD_REQUEST", "Slug article requis");
    }

    const article = await prisma.kbArticle.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        bodyMarkdown: true,
        tags: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!article || !article.isPublished) {
      throw new RouteError(404, "NOT_FOUND", "Article non trouvé");
    }

    return NextResponse.json(
      success({
        id: article.id,
        title: article.title,
        slug: article.slug,
        bodyMarkdown: article.bodyMarkdown,
        tags: article.tags,
        categoryId: article.category.id,
        categoryName: article.category.name,
        categorySlug: article.category.slug,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
