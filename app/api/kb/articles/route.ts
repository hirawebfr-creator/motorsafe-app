/**
 * KNOWLEDGE-BASE-01: KB Articles API (Garage read-only)
 * GET - List/search published articles
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { checkIpRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit for search (prevent abuse)
const KB_SEARCH_LIMIT = { limit: 30, windowSec: 60 };

export async function GET(req: Request) {
  try {
    // Auth required for KB access
    await requireUser(req);

    const url = new URL(req.url);
    const query = url.searchParams.get("query")?.trim() || "";
    const categorySlug = url.searchParams.get("category") || "";
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

    // Rate limit search queries
    if (query) {
      const result = await checkIpRateLimit(req, "kb_search", KB_SEARCH_LIMIT.limit, KB_SEARCH_LIMIT.windowSec);
      if (!result.allowed) {
        return NextResponse.json({ error: "Trop de recherches, veuillez patienter." }, { status: 429 });
      }
    }

    // Build where clause
    const where: {
      isPublished: boolean;
      category?: { slug: string };
      OR?: { title?: { contains: string; mode: "insensitive" }; bodyMarkdown?: { contains: string; mode: "insensitive" } }[];
    } = {
      isPublished: true,
    };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (query) {
      // Simple search: title or body contains query
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { bodyMarkdown: { contains: query, mode: "insensitive" } },
      ];
    }

    const articles = await prisma.kbArticle.findMany({
      where,
      orderBy: [
        // If searching, order by title match (simple ranking)
        { updatedAt: "desc" },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        tags: true,
        updatedAt: true,
        category: {
          select: { name: true, slug: true },
        },
      },
    });

    // Extract excerpt (first 150 chars) for search results
    const data = articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      tags: a.tags,
      categoryName: a.category.name,
      categorySlug: a.category.slug,
      updatedAt: a.updatedAt,
    }));

    return NextResponse.json(success({ articles: data, total: data.length }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
