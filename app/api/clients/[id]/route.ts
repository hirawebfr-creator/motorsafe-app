import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normalizeName(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(req: Request, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
  if (!isApprovedGarage(user)) {
    return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
  }

  const { id } = await params;
  const clientId = Number(id);

  if (!Number.isFinite(clientId)) {
    return NextResponse.json(failure("ID invalide"), { status: 400 });
  }

  const where = user.role === "ADMIN"
    ? { id: clientId }
    : { id: clientId, garageId: user.garageId ?? -1 };

  const client = await prisma.client.findFirst({
    where,
    include: { garage: { select: { id: true, name: true } } },
  });
  if (!client) return NextResponse.json(failure("Introuvable"), { status: 404 });

  return NextResponse.json(success(client));
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const { id } = await params;
    const clientId = Number(id);

    if (!Number.isFinite(clientId)) {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
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

    const existing = await prisma.client.findFirst({
      where: user.role === "ADMIN"
        ? { id: clientId }
        : { id: clientId, garageId: user.garageId ?? -1 },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Introuvable"), { status: 404 });
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: { firstName, lastName },
    });

    return NextResponse.json(success(client));
  } catch (err) {
    console.error("Erreur API PUT /api/clients/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const { id } = await params;
    const clientId = Number(id);

    if (!Number.isFinite(clientId)) {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const existing = await prisma.client.findFirst({
      where: user.role === "ADMIN"
        ? { id: clientId }
        : { id: clientId, garageId: user.garageId ?? -1 },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(failure("Introuvable"), { status: 404 });
    }

    await prisma.client.delete({ where: { id: clientId } });
    return NextResponse.json(success(true));
  } catch (err) {
    console.error("Erreur API DELETE /api/clients/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
