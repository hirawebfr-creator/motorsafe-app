import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const garageName = normalizeText(body.garageName);
    const garageEmail = normalizeEmail(body.garageEmail);
    const phone = body.phone ? normalizeText(body.phone) : null;
    const address = body.address ? normalizeText(body.address) : null;
    const siret = body.siret ? normalizeText(body.siret) : null;

    const userEmail = normalizeEmail(body.email);
    const password = String(body.password ?? "");

    if (!garageName || !garageEmail || !userEmail || !password) {
      return NextResponse.json(failure("Tous les champs obligatoires doivent etre remplis."), {
        status: 400,
      });
    }

    if (garageName.length < 2 || garageName.length > 120) {
      return NextResponse.json(failure("Nom de garage invalide."), { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(failure("Mot de passe trop court (8 caracteres minimum)."), {
        status: 400,
      });
    }

    const existingGarage = await prisma.garage.findUnique({
      where: { email: garageEmail },
      select: { id: true },
    });
    if (existingGarage) {
      return NextResponse.json(failure("Un garage avec cet email existe deja."), { status: 409 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (existingUser) {
      return NextResponse.json(failure("Cet email est deja utilise."), { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const garage = await prisma.$transaction(async (tx) => {
      const createdGarage = await tx.garage.create({
        data: {
          name: garageName,
          email: garageEmail,
          phone,
          address,
          siret,
          status: "PENDING",
        },
      });

      await tx.user.create({
        data: {
          email: userEmail,
          passwordHash,
          role: "OWNER",
          garageId: createdGarage.id,
        },
      });

      return createdGarage;
    });

    return NextResponse.json(
      success({
        garageId: garage.id,
        message: "Demande recue. Votre compte sera valide apres verification.",
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("Erreur API POST /api/auth/register-pro :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
