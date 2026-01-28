/**
 * IN-APP-STATUS-AND-CHANGES-01: Admin Changelog API
 * GET /api/admin/changelog - List all changelog entries (including unpublished)
 * POST /api/admin/changelog - Create a new changelog entry
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const entries = await prisma.changelogEntry.findMany({
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        bodyMarkdown: true,
        type: true,
        version: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(success({ entries }));
  } catch (err) {
    console.error("[API:Admin:Changelog:List] Error:", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const { title, bodyMarkdown, type, version, isPublished = true } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json({ error: "Titre requis (min 2 caractères)" }, { status: 400 });
    }

    if (!bodyMarkdown || typeof bodyMarkdown !== "string" || bodyMarkdown.trim().length < 10) {
      return NextResponse.json({ error: "Contenu requis (min 10 caractères)" }, { status: 400 });
    }

    if (!type || !["FEATURE", "FIX", "SECURITY", "LEGAL"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const entry = await prisma.changelogEntry.create({
      data: {
        title: title.trim(),
        bodyMarkdown: bodyMarkdown.trim(),
        type,
        version: version?.trim() || null,
        isPublished,
        publishedAt: isPublished ? new Date() : new Date(),
        createdByUserId: user.id,
      },
      select: {
        id: true,
        title: true,
        type: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    console.log(`[API:Admin:Changelog] Created entry ${entry.id} by admin ${user.id}`);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("[API:Admin:Changelog:Create] Error:", err);
    return toErrorResponse(err);
  }
}
