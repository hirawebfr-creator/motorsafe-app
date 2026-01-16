import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { encrypt, decryptClientData } from "@/lib/encryption";

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

    const rawClient = await prisma.client.findFirst({
      where,
      include: { garage: { select: { id: true, name: true } } },
    });
    if (!rawClient) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Introuvable" } },
        { status: 404 }
      );
    }

    // Déchiffrer les données sensibles
    const client = decryptClientData(rawClient as Record<string, unknown>);

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
      // Chiffrer les données sensibles avant mise à jour
      const data: Record<string, unknown> = {};
      if (input.firstName) data.firstName = encrypt(input.firstName);
      if (input.lastName) data.lastName = encrypt(input.lastName);
      if (input.email !== undefined) {
        const cleaned = cleanOptional(input.email);
        data.email = cleaned ? encrypt(cleaned) : null;
      }
      if (input.phone !== undefined) {
        const cleaned = cleanOptional(input.phone);
        data.phone = cleaned ? encrypt(cleaned) : null;
      }
      if (input.address !== undefined) {
        const cleaned = cleanOptional(input.address);
        data.address = cleaned ? encrypt(cleaned) : null;
      }
      if (input.notes !== undefined) {
        const cleaned = cleanOptional(input.notes);
        data.notes = cleaned ? encrypt(cleaned) : null;
      }

      // SECURITY: Include garageId in where clause to prevent TOCTOU race condition
      const rawClient = await tx.client.update({
        where: user.role === "ADMIN"
          ? { id: clientId }
          : { id: clientId, garageId: user.garageId ?? -1 },
        data,
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

      // Déchiffrer avant de retourner
      return decryptClientData(rawClient as Record<string, unknown>);
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
      // SECURITY: Include garageId in where clause to prevent TOCTOU race condition
      await tx.client.update({
        where: user.role === "ADMIN"
          ? { id: clientId }
          : { id: clientId, garageId: user.garageId ?? -1 },
        data: { deletedAt: new Date() },
      });
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
