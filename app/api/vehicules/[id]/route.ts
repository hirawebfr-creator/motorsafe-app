import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: user.role === "ADMIN"
        ? { id }
        : { id, garageId: user.garageId ?? -1 },
      include: {
        client: true,
        interventions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!vehicle) {
      return NextResponse.json(failure("Vehicule introuvable"), { status: 404 });
    }

    return NextResponse.json(success(vehicle));
  } catch (err) {
    console.error("Erreur API GET /api/vehicules/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

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
      return NextResponse.json(failure("Marque et modele doivent faire au moins 2 caracteres."), {
        status: 400,
      });
    }

    if (brand.length > 60 || model.length > 60) {
      return NextResponse.json(failure("Marque et modele doivent faire moins de 60 caracteres."), {
        status: 400,
      });
    }

    if (plate.length < 2 || plate.length > 12) {
      return NextResponse.json(failure("Immatriculation invalide."), { status: 400 });
    }

    if (vin && !/^[A-Z0-9]{17}$/.test(vin)) {
      return NextResponse.json(
        failure("VIN invalide (17 caracteres alphanumeriques)."),
        { status: 400 }
      );
    }

    if (fuel && fuel.length > 40) {
      return NextResponse.json(failure("Carburant trop long."), { status: 400 });
    }

    const existing = await prisma.vehicle.findFirst({
      where: user.role === "ADMIN"
        ? { id }
        : { id, garageId: user.garageId ?? -1 },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Vehicule introuvable"), { status: 404 });
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

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const existing = await prisma.vehicle.findFirst({
      where: user.role === "ADMIN"
        ? { id }
        : { id, garageId: user.garageId ?? -1 },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Vehicule introuvable"), { status: 404 });
    }

    await prisma.vehicle.delete({ where: { id } });

    return NextResponse.json(success({ id }), { status: 200 });
  } catch (err) {
    console.error("Erreur API DELETE /api/vehicules/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
