/**
 * KNOWLEDGE-BASE-01: KB Categories API (Garage read-only)
 * GET - List all categories
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Auth required for KB access
    await requireUser(req);

    const categories = await prisma.kbCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            articles: {
              where: { isPublished: true },
            },
          },
        },
      },
    });

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      articleCount: c._count.articles,
    }));

    return NextResponse.json(success({ categories: data }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
