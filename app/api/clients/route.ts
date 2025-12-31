import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeName(value: unknown) {
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
    const clients = await prisma.client.findMany({
      where,
      orderBy: { id: "desc" },
      include: { garage: { select: { id: true, name: true } } },
    });
    return NextResponse.json(success(clients));
  } catch (err) {
    console.error("Erreur API GET /api/clients :", err);
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
    const firstName = normalizeName(body.firstName);
    const lastName = normalizeName(body.lastName);

    if (!firstName || !lastName) {
      return NextResponse.json(failure("Prenom et nom obligatoires."), { status: 400 });
    }

    if (firstName.length < 2 || lastName.length < 2) {
      return NextResponse.json(failure("Prenom et nom doivent faire au moins 2 caracteres."), {
        status: 400,
      });
    }

    if (firstName.length > 60 || lastName.length > 60) {
      return NextResponse.json(failure("Prenom et nom doivent faire moins de 60 caracteres."), {
        status: 400,
      });
    }

    const targetGarageId = user.role === "ADMIN" ? Number(body.garageId) : user.garageId;
    if (user.role === "ADMIN" && !Number.isFinite(targetGarageId)) {
      return NextResponse.json(failure("Garage invalide."), { status: 400 });
    }
    if (!targetGarageId) {
      return NextResponse.json(failure("Garage invalide."), { status: 400 });
    }

    const client = await prisma.client.create({
      data: { firstName, lastName, garageId: targetGarageId },
    });
    return NextResponse.json(success(client), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/clients :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
