import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

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
    const brand = normalizeText(body.brand);
    const model = normalizeText(body.model);
    const plate = normalizeText(body.plate).toUpperCase();
    const vin = body.vin ? normalizeText(body.vin).toUpperCase() : null;
    const fuel = body.fuel ? normalizeText(body.fuel) : null;

    if (!Number.isFinite(clientId) || clientId <= 0) {
      return NextResponse.json(failure("Client invalide."), { status: 400 });
    }

    if (!brand || !model || !plate) {
      return NextResponse.json(
        failure("Champs obligatoires: clientId, brand, model, plate."),
        { status: 400 }
      );
    }

    if (brand.length < 2 || model.length < 2) {
      return NextResponse.json(failure("Marque et modèle doivent faire au moins 2 caractères."), {
        status: 400,
      });
    }

    if (brand.length > 60 || model.length > 60) {
      return NextResponse.json(failure("Marque et modèle doivent faire moins de 60 caractères."), {
        status: 400,
      });
    }

    if (plate.length < 2 || plate.length > 12) {
      return NextResponse.json(failure("Immatriculation invalide."), { status: 400 });
    }

    if (vin && !/^[A-Z0-9]{17}$/.test(vin)) {
      return NextResponse.json(
        failure("VIN invalide (17 caractères alphanumériques)."),
        { status: 400 }
      );
    }

    if (fuel && fuel.length > 40) {
      return NextResponse.json(failure("Carburant trop long."), { status: 400 });
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