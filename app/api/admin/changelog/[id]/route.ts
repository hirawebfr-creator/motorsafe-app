/**
 * IN-APP-STATUS-AND-CHANGES-01: Admin Changelog Entry API
 * PATCH /api/admin/changelog/[id] - Update a changelog entry
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await params;

    const existing = await prisma.changelogEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entrée non trouvée" }, { status: 404 });
    }

    const body = await req.json();
    const { title, bodyMarkdown, type, version, isPublished } = body;

    const updates: {
      title?: string;
      bodyMarkdown?: string;
      type?: "FEATURE" | "FIX" | "SECURITY" | "LEGAL";
      version?: string | null;
      isPublished?: boolean;
      publishedAt?: Date;
    } = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 2) {
        return NextResponse.json({ error: "Titre requis (min 2 caractères)" }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (bodyMarkdown !== undefined) {
      if (typeof bodyMarkdown !== "string" || bodyMarkdown.trim().length < 10) {
        return NextResponse.json({ error: "Contenu requis (min 10 caractères)" }, { status: 400 });
      }
      updates.bodyMarkdown = bodyMarkdown.trim();
    }

    if (type !== undefined) {
      if (!["FEATURE", "FIX", "SECURITY", "LEGAL"].includes(type)) {
        return NextResponse.json({ error: "Type invalide" }, { status: 400 });
      }
      updates.type = type;
    }

    if (version !== undefined) {
      updates.version = version?.trim() || null;
    }

    if (isPublished !== undefined) {
      updates.isPublished = !!isPublished;
      // Update publishedAt when first published
      if (isPublished && !existing.isPublished) {
        updates.publishedAt = new Date();
      }
    }

    const entry = await prisma.changelogEntry.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        title: true,
        type: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    console.log(`[API:Admin:Changelog] Updated entry ${entry.id} by admin ${user.id}`);

    return NextResponse.json({ entry });
  } catch (err) {
    console.error("[API:Admin:Changelog:Update] Error:", err);
    return toErrorResponse(err);
  }
}
