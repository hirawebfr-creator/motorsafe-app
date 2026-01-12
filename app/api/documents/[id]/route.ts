import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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
