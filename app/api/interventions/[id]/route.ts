import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedTypes = new Set(["E85", "Reprog", "Diag", "Autre"]);

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  return realIp ?? null;
}

function buildPayload(input: {
  interventionId: string;
  vehicleId: string;
  type: string;
  notes: string | null;
  performedAt: Date | null;
  odometerKm: number | null;
  ecuType: string | null;
  softwareVersion: string | null;
  checksum: string | null;
  clientIp: string | null;
  userAgent: string | null;
  createdAtIso: string;
}) {
  const payloadObj: Record<string, unknown> = {
    interventionId: input.interventionId,
    vehicleId: input.vehicleId,
    type: input.type,
    notes: input.notes,
    performedAt: input.performedAt ? input.performedAt.toISOString() : null,
    odometerKm: input.odometerKm,
    ecuType: input.ecuType,
    softwareVersion: input.softwareVersion,
    checksum: input.checksum,
    userAgent: input.userAgent,
    clientIp: input.clientIp,
    createdAt: input.createdAtIso,
  };

  const payload = JSON.stringify(payloadObj);
  const hash = createHash("sha256").update(payload).digest("hex");
  return { payload, hash };
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

const UpdateSchema = z.object({
  type: z.string().trim().min(1).max(40).optional(),
  title: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "OPEN", "DONE", "CANCELED"]).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  performedAt: z.string().optional().or(z.literal("")),
  odometerKm: z.union([z.number(), z.string()]).optional().or(z.literal("")),
  ecuType: z.string().trim().max(80).optional().or(z.literal("")),
  softwareVersion: z.string().trim().max(80).optional().or(z.literal("")),
  checksum: z.string().trim().max(128).optional().or(z.literal("")),
  amountCents: z.coerce.number().int().min(0).optional(),
  createdBy: z.string().trim().max(120).optional(),
});

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await ctx.params;

    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: String(id), deletedAt: null }
        : { id: String(id), garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        revisions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable."), { status: 404 });
    }

    return NextResponse.json(success(intervention));
  } catch (err) {
    console.error("Erreur API GET /api/interventions/[id] :", err);
    return toErrorResponse(err);
  }
}

async function updateIntervention(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await ctx.params;

    const interventionId = String(id);
    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const existing = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(failure("Intervention introuvable."), { status: 404 });
    }

    const type = normalizeText(input.type ?? existing.type);
    const title =
      input.title === undefined
        ? existing.title
        : input.title
        ? normalizeText(input.title)
        : null;

    const status = (input.status as any) ?? existing.status;

    const notes =
      input.notes === undefined
        ? existing.notes
        : input.notes
        ? normalizeText(input.notes)
        : null;

    const performedAt =
      input.performedAt === undefined || input.performedAt === null || input.performedAt === ""
        ? existing.performedAt
        : new Date(input.performedAt);

    const odometerKm =
      input.odometerKm === undefined || input.odometerKm === null || input.odometerKm === ""
        ? existing.odometerKm
        : Number(input.odometerKm);

    const ecuType =
      input.ecuType === undefined
        ? existing.ecuType
        : input.ecuType
        ? normalizeText(input.ecuType)
        : null;

    const softwareVersion =
      input.softwareVersion === undefined
        ? existing.softwareVersion
        : input.softwareVersion
        ? normalizeText(input.softwareVersion)
        : null;

    const checksum =
      input.checksum === undefined
        ? existing.checksum
        : input.checksum
        ? normalizeText(input.checksum)
        : null;

    const amountCents = input.amountCents === undefined ? existing.amountCents : input.amountCents;

    if (!type) {
      return NextResponse.json(failure("Type obligatoire."), { status: 400 });
    }

    if (!allowedTypes.has(type)) {
      return NextResponse.json(failure("Type d'intervention invalide."), { status: 400 });
    }

    if (notes && notes.length > 2000) {
      return NextResponse.json(failure("Notes trop longues (max 2000 caracteres)."), { status: 400 });
    }

    if (performedAt && Number.isNaN(performedAt.getTime())) {
      return NextResponse.json(failure("Date d'intervention invalide."), { status: 400 });
    }

    if (odometerKm !== null && odometerKm !== undefined) {
      if (!Number.isFinite(odometerKm) || odometerKm < 0) {
        return NextResponse.json(failure("Kilometrage invalide."), { status: 400 });
      }
    }

    if (ecuType && ecuType.length > 80) {
      return NextResponse.json(failure("ECU trop long."), { status: 400 });
    }

    if (softwareVersion && softwareVersion.length > 80) {
      return NextResponse.json(failure("Version logicielle trop longue."), { status: 400 });
    }

    if (checksum && checksum.length > 128) {
      return NextResponse.json(failure("Checksum trop long."), { status: 400 });
    }

    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    const createdAtIso = new Date().toISOString();

    const { payload, hash } = buildPayload({
      interventionId,
      vehicleId: existing.vehicleId,
      type,
      notes,
      performedAt: performedAt ?? null,
      odometerKm: Number.isFinite(odometerKm as number) ? (odometerKm as number) : null,
      ecuType: ecuType ?? null,
      softwareVersion: softwareVersion ?? null,
      checksum: checksum ?? null,
      userAgent: userAgent ?? null,
      clientIp: clientIp ?? null,
      createdAtIso,
    });

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.update({
        where: { id: interventionId },
        data: {
          type,
          title,
          status,
          amountCents,
          notes,
          performedAt: performedAt ?? null,
          odometerKm: Number.isFinite(odometerKm as number) ? (odometerKm as number) : null,
          ecuType,
          softwareVersion,
          checksum,
          clientIp,
          userAgent,
          payload,
          hash,
        },
        include: { vehicle: { include: { client: true } } },
      });

      await tx.interventionRevision.create({
        data: {
          interventionId,
          payload,
          hash,
          createdBy: input.createdBy ? normalizeText(input.createdBy) : user.email,
          clientIp,
          userAgent,
        },
      });

      await tx.auditLog.create({
        data: {
          garageId: intervention.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "INTERVENTION_UPDATE",
          entityType: "Intervention",
          entityId: interventionId,
        },
      });

      return intervention;
    });

    return NextResponse.json(success(updated), { status: 200 });
  } catch (err) {
    console.error("Erreur API PUT /api/interventions/[id] :", err);
    return toErrorResponse(err);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return updateIntervention(req, ctx);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return updateIntervention(req, ctx);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const { id } = await ctx.params;
    const interventionId = String(id);

    const existing = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Intervention introuvable."), { status: 404 });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.intervention.update({ where: { id: interventionId }, data: { deletedAt: new Date() } });
      await tx.auditLog.create({
        data: {
          garageId: existing.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "INTERVENTION_DELETE",
          entityType: "Intervention",
          entityId: interventionId,
        },
      });
    });

    return NextResponse.json(success({ id: interventionId }), { status: 200 });
  } catch (err) {
    console.error("Erreur API DELETE /api/interventions/[id] :", err);
    return toErrorResponse(err);
  }
}
