import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { success, failure } from "@/lib/api";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";

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

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const { id } = await ctx.params;

    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: String(id) }
        : { id: String(id), garageId: user.garageId ?? -1 },
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
    return NextResponse.json(failure("Erreur serveur."), { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const { id } = await ctx.params;

    const interventionId = String(id);
    const body = await req.json();

    const existing = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId }
        : { id: interventionId, garageId: user.garageId ?? -1 },
    });

    if (!existing) {
      return NextResponse.json(failure("Intervention introuvable."), { status: 404 });
    }

    const type = normalizeText(body.type ?? existing.type);
    const notes =
      body.notes === undefined
        ? existing.notes
        : body.notes
        ? normalizeText(body.notes)
        : null;

    const performedAt =
      body.performedAt === undefined || body.performedAt === null || body.performedAt === ""
        ? existing.performedAt
        : new Date(body.performedAt);

    const odometerKm =
      body.odometerKm === undefined || body.odometerKm === null || body.odometerKm === ""
        ? existing.odometerKm
        : Number(body.odometerKm);

    const ecuType =
      body.ecuType === undefined
        ? existing.ecuType
        : body.ecuType
        ? normalizeText(body.ecuType)
        : null;

    const softwareVersion =
      body.softwareVersion === undefined
        ? existing.softwareVersion
        : body.softwareVersion
        ? normalizeText(body.softwareVersion)
        : null;

    const checksum =
      body.checksum === undefined
        ? existing.checksum
        : body.checksum
        ? normalizeText(body.checksum)
        : null;

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

    const updated = await prisma.$transaction(async (tx) => {
      const intervention = await tx.intervention.update({
        where: { id: interventionId },
        data: {
          type,
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
          createdBy: body.createdBy ? normalizeText(body.createdBy) : user.email,
          clientIp,
          userAgent,
        },
      });

      return intervention;
    });

    return NextResponse.json(success(updated), { status: 200 });
  } catch (err) {
    console.error("Erreur API PUT /api/interventions/[id] :", err);
    return NextResponse.json(failure("Erreur serveur."), { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const { id } = await ctx.params;
    const interventionId = String(id);

    const existing = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId }
        : { id: interventionId, garageId: user.garageId ?? -1 },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Intervention introuvable."), { status: 404 });
    }

    await prisma.intervention.delete({ where: { id: interventionId } });

    return NextResponse.json(success({ id: interventionId }), { status: 200 });
  } catch (err) {
    console.error("Erreur API DELETE /api/interventions/[id] :", err);
    return NextResponse.json(failure("Erreur serveur."), { status: 500 });
  }
}
