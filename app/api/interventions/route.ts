import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  return realIp ?? null;
}

export async function GET() {
  try {
    const interventions = await prisma.intervention.findMany({
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
    const body = await req.json();

    const vehicleId = String(body.vehicleId ?? "").trim();
    const type = String(body.type ?? "").trim();
    const notes = body.notes ? String(body.notes).trim() : null;

    const performedAt = body.performedAt ? new Date(body.performedAt) : null;
    const odometerKm = body.odometerKm ? Number(body.odometerKm) : null;
    const ecuType = body.ecuType ? String(body.ecuType).trim() : null;
    const softwareVersion = body.softwareVersion
      ? String(body.softwareVersion).trim()
      : null;
    const checksum = body.checksum ? String(body.checksum).trim() : null;

    if (!vehicleId || !type) {
      return NextResponse.json(failure("Champs obligatoires: vehicleId, type."), {
        status: 400,
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });
    if (!vehicle) {
      return NextResponse.json(failure("Vehicule introuvable."), { status: 404 });
    }

    const userAgent = req.headers.get("user-agent") ?? null;
    const clientIp = getClientIp(req);

    const created = await prisma.intervention.create({
      data: {
        vehicleId,
        type,
        notes,
        performedAt: performedAt ?? undefined,
        odometerKm: odometerKm ?? undefined,
        ecuType: ecuType ?? undefined,
        softwareVersion: softwareVersion ?? undefined,
        checksum: checksum ?? undefined,
        createdBy: body.createdBy ? String(body.createdBy).trim() : null,
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
        createdBy: body.createdBy ? String(body.createdBy).trim() : null,
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
