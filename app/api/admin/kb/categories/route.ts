/**
 * KNOWLEDGE-BASE-01: Admin KB Categories API
 * GET - List all categories (with unpublished article counts)
 * POST - Create a new category
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
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const categories = await prisma.kbCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sortOrder: c.sortOrder,
      articleCount: c._count.articles,
      createdAt: c.createdAt,
    }));

    return NextResponse.json(success({ categories: data }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const { name, description, sortOrder } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      throw new RouteError(400, "BAD_REQUEST", "Nom de catégorie requis (min 2 caractères)");
    }

    const slug = slugify(name.trim());

    // Check unique slug
    const existing = await prisma.kbCategory.findUnique({ where: { slug } });
    if (existing) {
      throw new RouteError(409, "CONFLICT", "Une catégorie avec ce nom existe déjà");
    }

    const category = await prisma.kbCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });

    return NextResponse.json(success({ category }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
