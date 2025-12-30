import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/vehicules -> renvoie un TABLEAU DIRECT
export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true },
    });

    const normalized = vehicles.map((v) => ({ ...v, id: v.id ? String(v.id) : undefined }));

    return NextResponse.json(success(normalized), { status: 200 });
  } catch (err) {
    console.error("Erreur API GET /api/vehicules :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

// POST /api/vehicules -> crée + renvoie le véhicule (avec client)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const clientId = Number(body.clientId);
    const brand = String(body.brand ?? "").trim();
    const model = String(body.model ?? "").trim();
    const plate = String(body.plate ?? "").trim().toUpperCase();
    const vin = body.vin ? String(body.vin).trim().toUpperCase() : null;
    const fuel = body.fuel ? String(body.fuel).trim() : null;

    if (!Number.isFinite(clientId) || clientId <= 0 || !brand || !model || !plate) {
      return NextResponse.json(failure("Champs obligatoires: clientId, brand, model, plate."), { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        clientId,
        brand,
        model,
        plate,
        vin,
        fuel,
      },
      include: { client: true },
    });

    return NextResponse.json(success(vehicle), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/vehicules :", err);
    return NextResponse.json(failure("Erreur serveur lors de l'enregistrement."), { status: 500 });
  }
}
