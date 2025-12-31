import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        client: true,
        interventions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!vehicle) {
      return NextResponse.json(failure("Véhicule introuvable"), { status: 404 });
    }

    console.log("API /api/vehicules/[id] returning vehicle:", JSON.stringify(vehicle));

    return NextResponse.json(success(vehicle));
  } catch (err) {
    console.error("Erreur API GET /api/vehicules/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const brand = normalizeText(body.brand);
    const model = normalizeText(body.model);
    const plate = normalizeText(body.plate).toUpperCase();
    const vin = body.vin ? normalizeText(body.vin).toUpperCase() : null;
    const fuel = body.fuel ? normalizeText(body.fuel) : null;

    if (!id || !brand || !model || !plate) {
      return NextResponse.json(
        failure("Champs obligatoires: brand, model, plate."),
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

    const existing = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Véhicule introuvable"), { status: 404 });
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        brand,
        model,
        plate,
        vin,
        fuel,
      },
      include: { client: true },
    });

    return NextResponse.json(success(updated), { status: 200 });
  } catch (err) {
    console.error("Erreur API PUT /api/vehicules/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const existing = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Véhicule introuvable"), { status: 404 });
    }

    await prisma.vehicle.delete({ where: { id } });

    return NextResponse.json(success({ id }), { status: 200 });
  } catch (err) {
    console.error("Erreur API DELETE /api/vehicules/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}