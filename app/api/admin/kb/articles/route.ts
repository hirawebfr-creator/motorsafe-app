/**
 * KNOWLEDGE-BASE-01: Admin KB Articles API
 * GET - List all articles (including unpublished)
 * POST - Create a new article
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId");
    const published = url.searchParams.get("published");

    const where: { categoryId?: number; isPublished?: boolean } = {};
    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }
    if (published === "true") {
      where.isPublished = true;
    } else if (published === "false") {
      where.isPublished = false;
    }

    const articles = await prisma.kbArticle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        tags: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(success({ articles }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const { title, categoryId, bodyMarkdown, tags, isPublished } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      throw new RouteError(400, "BAD_REQUEST", "Titre requis (min 3 caractères)");
    }
    if (!categoryId || typeof categoryId !== "number") {
      throw new RouteError(400, "BAD_REQUEST", "Catégorie requise");
    }
    if (!bodyMarkdown || typeof bodyMarkdown !== "string" || bodyMarkdown.trim().length < 10) {
      throw new RouteError(400, "BAD_REQUEST", "Contenu requis (min 10 caractères)");
    }

    // Check category exists
    const category = await prisma.kbCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new RouteError(400, "BAD_REQUEST", "Catégorie invalide");
    }

    const slug = slugify(title.trim());

    // Check unique slug
    const existing = await prisma.kbArticle.findUnique({ where: { slug } });
    if (existing) {
      throw new RouteError(409, "CONFLICT", "Un article avec ce titre existe déjà");
    }

    // Validate tags (array of strings)
    const validatedTags: string[] = Array.isArray(tags)
      ? tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim().toLowerCase())
      : [];

    const article = await prisma.kbArticle.create({
      data: {
        title: title.trim(),
        slug,
        categoryId,
        bodyMarkdown: bodyMarkdown.trim(),
        tags: validatedTags,
        isPublished: isPublished !== false,
        createdByUserId: user.id,
        updatedByUserId: user.id,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(success({ article }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
