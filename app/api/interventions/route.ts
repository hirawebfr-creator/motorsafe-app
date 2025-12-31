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

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const where = user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 };
    const interventions = await prisma.intervention.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { vehicle: { include: { client: true } } },
    });

    return NextResponse.json(success(interventions));
  } catch (err) {
    console.error("Erreur API GET /api/interventions :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const body = await req.json();

    const vehicleId = normalizeText(body.vehicleId);
    const type = normalizeText(body.type);
    const notes = body.notes ? normalizeText(body.notes) : null;

    const performedAt = body.performedAt ? new Date(body.performedAt) : null;
    const odometerKm =
      body.odometerKm !== null && body.odometerKm !== undefined && body.odometerKm !== ""
        ? Number(body.odometerKm)
        : null;
    const ecuType = body.ecuType ? normalizeText(body.ecuType) : null;
    const softwareVersion = body.softwareVersion ? normalizeText(body.softwareVersion) : null;
    const checksum = body.checksum ? normalizeText(body.checksum) : null;

    if (!vehicleId || !type) {
      return NextResponse.json(failure("Champs obligatoires: vehicleId, type."), {
        status: 400,
      });
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

    if (odometerKm !== null) {
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

    const vehicle = await prisma.vehicle.findFirst({
      where: user.role === "ADMIN"
        ? { id: vehicleId }
        : { id: vehicleId, garageId: user.garageId ?? -1 },
      select: { id: true, garageId: true },
    });
    if (!vehicle) {
      return NextResponse.json(failure("Vehicule introuvable."), { status: 404 });
    }

    const providedGarageId = Number(body.garageId);
    const targetGarageId =
      user.role === "ADMIN"
        ? (Number.isFinite(providedGarageId) ? providedGarageId : vehicle.garageId)
        : user.garageId;
    if (!targetGarageId) {
      return NextResponse.json(failure("Garage invalide."), { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") ?? null;
    const clientIp = getClientIp(req);

    const created = await prisma.intervention.create({
      data: {
        garageId: targetGarageId,
        vehicleId,
        type,
        notes,
        performedAt: performedAt ?? undefined,
        odometerKm: odometerKm ?? undefined,
        ecuType: ecuType ?? undefined,
        softwareVersion: softwareVersion ?? undefined,
        checksum: checksum ?? undefined,
        createdBy: body.createdBy ? normalizeText(body.createdBy) : user.email,
        clientIp,
        userAgent,
      },
    });

    const payloadObj: Record<string, unknown> = {
      interventionId: created.id,
      vehicleId,
      type,
      notes,
      performedAt: performedAt ? performedAt.toISOString() : null,
      odometerKm: Number.isFinite(odometerKm as number) ? odometerKm : null,
      ecuType,
      softwareVersion,
      checksum,
      userAgent,
      clientIp,
      createdAt: created.createdAt.toISOString(),
    };

    const payload = JSON.stringify(payloadObj);
    const hash = createHash("sha256").update(payload).digest("hex");

    const updated = await prisma.intervention.update({
      where: { id: created.id },
      data: {
        payload,
        hash,
      },
      include: { vehicle: { include: { client: true } } },
    });

    await prisma.interventionRevision.create({
      data: {
        interventionId: created.id,
        payload,
        hash,
        createdBy: body.createdBy ? normalizeText(body.createdBy) : user.email,
        clientIp,
        userAgent,
      },
    });

    return NextResponse.json(success(updated), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/interventions :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
