/**
 * KNOWLEDGE-BASE-01: Admin KB Article Detail API
 * GET - Get article detail (including unpublished)
 * PATCH - Update article
 * DELETE - Delete article
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: Request, context: Context) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (!Number.isFinite(articleId)) {
      throw new RouteError(400, "BAD_REQUEST", "ID article invalide");
    }

    const article = await prisma.kbArticle.findUnique({
      where: { id: articleId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, email: true } },
        updatedBy: { select: { id: true, email: true } },
      },
    });

    if (!article) {
      throw new RouteError(404, "NOT_FOUND", "Article non trouvé");
    }

    return NextResponse.json(success({ article }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, context: Context) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (!Number.isFinite(articleId)) {
      throw new RouteError(400, "BAD_REQUEST", "ID article invalide");
    }

    const existing = await prisma.kbArticle.findUnique({ where: { id: articleId } });
    if (!existing) {
      throw new RouteError(404, "NOT_FOUND", "Article non trouvé");
    }

    const body = await req.json();
    const { title, categoryId, bodyMarkdown, tags, isPublished } = body;

    const updateData: {
      title?: string;
      slug?: string;
      categoryId?: number;
      bodyMarkdown?: string;
      tags?: string[];
      isPublished?: boolean;
      updatedByUserId: string;
    } = {
      updatedByUserId: user.id,
    };

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 3) {
        throw new RouteError(400, "BAD_REQUEST", "Titre requis (min 3 caractères)");
      }
      updateData.title = title.trim();
      const newSlug = slugify(title.trim());
      // Check unique slug (if changed)
      if (newSlug !== existing.slug) {
        const conflict = await prisma.kbArticle.findUnique({ where: { slug: newSlug } });
        if (conflict) {
          throw new RouteError(409, "CONFLICT", "Un article avec ce titre existe déjà");
        }
        updateData.slug = newSlug;
      }
    }

    if (categoryId !== undefined) {
      if (typeof categoryId !== "number") {
        throw new RouteError(400, "BAD_REQUEST", "Catégorie invalide");
      }
      const category = await prisma.kbCategory.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new RouteError(400, "BAD_REQUEST", "Catégorie invalide");
      }
      updateData.categoryId = categoryId;
    }

    if (bodyMarkdown !== undefined) {
      if (typeof bodyMarkdown !== "string" || bodyMarkdown.trim().length < 10) {
        throw new RouteError(400, "BAD_REQUEST", "Contenu requis (min 10 caractères)");
      }
      updateData.bodyMarkdown = bodyMarkdown.trim();
    }

    if (tags !== undefined) {
      const validatedTags: string[] = Array.isArray(tags)
        ? tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim().toLowerCase())
        : [];
      updateData.tags = validatedTags;
    }

    if (isPublished !== undefined) {
      updateData.isPublished = Boolean(isPublished);
    }

    const article = await prisma.kbArticle.update({
      where: { id: articleId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(success({ article }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: Request, context: Context) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (!Number.isFinite(articleId)) {
      throw new RouteError(400, "BAD_REQUEST", "ID article invalide");
    }

    const existing = await prisma.kbArticle.findUnique({ where: { id: articleId } });
    if (!existing) {
      throw new RouteError(404, "NOT_FOUND", "Article non trouvé");
    }

    await prisma.kbArticle.delete({ where: { id: articleId } });

    return NextResponse.json(success({ deleted: true }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
