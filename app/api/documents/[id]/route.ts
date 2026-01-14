import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const DOCUMENT_CATEGORIES = ["ENTREE", "SORTIE", "DIAGNOSTIC", "PIECES", "DIVERS"] as const;

const UpdateSchema = z.object({
  category: z.enum(DOCUMENT_CATEGORIES).optional(),
  interventionId: z.string().trim().min(1).optional().nullable(),
});

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;

    const where: any = {
      id,
      deletedAt: null,
      ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
    };

    const doc = await prisma.document.findFirst({ where });
    if (!doc) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Introuvable" } }, { status: 404 });
    }

    return NextResponse.json(success(doc));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;

    const existing = await prisma.document.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
      },
      select: { id: true, garageId: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Introuvable" } }, { status: 404 });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.document.update({ where: { id }, data: { deletedAt: new Date() } });
      await tx.auditLog.create({
        data: {
          garageId: existing.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "DOCUMENT_DELETE",
          entityType: "Document",
          entityId: id,
        },
      });
    });

    return NextResponse.json(success({ id }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const existing = await prisma.document.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
      },
      select: { id: true, garageId: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Introuvable" } }, { status: 404 });
    }

    const input = parsed.data;

    // If updating interventionId, verify tenant ownership
    if (input.interventionId && user.role !== "ADMIN") {
      const itv = await prisma.intervention.findFirst({
        where: { id: input.interventionId, garageId: user.garageId ?? -1, deletedAt: null },
        select: { id: true },
      });
      if (!itv) {
        return NextResponse.json(
          { ok: false, error: { code: "FORBIDDEN", message: "Intervention hors-tenant." } },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const doc = await tx.document.update({
        where: { id },
        data: {
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.interventionId !== undefined ? { interventionId: input.interventionId } : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          garageId: existing.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "DOCUMENT_UPDATE",
          entityType: "Document",
          entityId: id,
          metadata: input,
        },
      });
      return doc;
    });

    return NextResponse.json(success(updated));
  } catch (err) {
    return toErrorResponse(err);
  }
}
