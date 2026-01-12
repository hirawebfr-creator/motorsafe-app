import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  firstName: z.string().trim().min(2).max(60).optional(),
  lastName: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  phone: z.string().trim().min(2).max(40).optional().or(z.literal("")),
  address: z.string().trim().min(2).max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

function cleanOptional(value: string | undefined) {
  const v = (value ?? "").trim();
  return v.length ? v : null;
}

export async function GET(req: Request, { params }: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await params;
    const clientId = Number(id);

    if (!Number.isFinite(clientId)) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "ID invalide" } },
        { status: 400 }
      );
    }

    const where: any = {
      id: clientId,
      deletedAt: null,
      ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
    };

    const client = await prisma.client.findFirst({
      where,
      include: { garage: { select: { id: true, name: true } } },
    });
    if (!client) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Introuvable" } },
        { status: 404 }
      );
    }

    return NextResponse.json(success(client));
  } catch (err) {
    return toErrorResponse(err);
  }
}

async function updateClient(req: Request, { params }: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await params;
    const clientId = Number(id);

    if (!Number.isFinite(clientId)) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "ID invalide" } },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const existing = await prisma.client.findFirst({
      where: user.role === "ADMIN"
        ? { id: clientId, deletedAt: null }
        : { id: clientId, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Introuvable" } },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const client = await tx.client.update({
        where: { id: clientId },
        data: {
          ...(input.firstName ? { firstName: input.firstName } : {}),
          ...(input.lastName ? { lastName: input.lastName } : {}),
          ...(input.email !== undefined ? { email: cleanOptional(input.email) } : {}),
          ...(input.phone !== undefined ? { phone: cleanOptional(input.phone) } : {}),
          ...(input.address !== undefined ? { address: cleanOptional(input.address) } : {}),
          ...(input.notes !== undefined ? { notes: cleanOptional(input.notes) } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          garageId: existing.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "CLIENT_UPDATE",
          entityType: "Client",
          entityId: String(clientId),
        },
      });

      return client;
    });

    return NextResponse.json(success(updated));
  } catch (err) {
    console.error("Erreur API PUT /api/clients/[id] :", err);
    return toErrorResponse(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  return updateClient(req, ctx);
}

export async function PATCH(req: Request, ctx: Ctx) {
  return updateClient(req, ctx);
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await params;
    const clientId = Number(id);

    if (!Number.isFinite(clientId)) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "ID invalide" } },
        { status: 400 }
      );
    }

    const existing = await prisma.client.findFirst({
      where: user.role === "ADMIN"
        ? { id: clientId, deletedAt: null }
        : { id: clientId, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Introuvable" } },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.client.update({ where: { id: clientId }, data: { deletedAt: new Date() } });
      await tx.auditLog.create({
        data: {
          garageId: existing.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "CLIENT_DELETE",
          entityType: "Client",
          entityId: String(clientId),
        },
      });
    });

    return NextResponse.json(success(true));
  } catch (err) {
    console.error("Erreur API DELETE /api/clients/[id] :", err);
    return toErrorResponse(err);
  }
}
