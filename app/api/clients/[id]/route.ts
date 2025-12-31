import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normalizeName(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const clientId = Number(id);

  if (!Number.isFinite(clientId)) {
    return NextResponse.json(failure("ID invalide"), { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json(failure("Introuvable"), { status: 404 });

  return NextResponse.json(success(client));
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const clientId = Number(id);

    if (!Number.isFinite(clientId)) {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const body = await req.json();
    const firstName = normalizeName(body.firstName);
    const lastName = normalizeName(body.lastName);

    if (!firstName || !lastName) {
      return NextResponse.json(failure("Prénom et nom obligatoires."), { status: 400 });
    }

    if (firstName.length < 2 || lastName.length < 2) {
      return NextResponse.json(failure("Prénom et nom doivent faire au moins 2 caractères."), {
        status: 400,
      });
    }

    if (firstName.length > 60 || lastName.length > 60) {
      return NextResponse.json(failure("Prénom et nom doivent faire moins de 60 caractères."), {
        status: 400,
      });
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

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const clientId = Number(id);

    if (!Number.isFinite(clientId)) {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    await prisma.client.delete({ where: { id: clientId } });
    return NextResponse.json(success(true));
  } catch (err) {
    console.error("Erreur API DELETE /api/clients/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}