import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(failure("Email et mot de passe obligatoires."), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        garage: { select: { id: true, name: true, email: true, status: true } },
      },
    });

    if (!user) {
      return NextResponse.json(failure("Identifiants invalides."), { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(failure("Identifiants invalides."), { status: 401 });
    }

    if (user.role === "GARAGE" && user.garage?.status !== "ACTIVE") {
      const message =
        user.garage?.status === "REJECTED"
          ? "Compte refuse."
          : "Compte en attente de validation.";
      return NextResponse.json(failure(message), { status: 403 });
    }

    const { token, expiresAt } = await createSession(user.id);
    const res = NextResponse.json(
      success({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          garageId: user.garageId,
          garage: user.garage ?? null,
        },
      })
    );

    setSessionCookie(res, token, expiresAt);
    return res;
  } catch (err) {
    console.error("Erreur API POST /api/auth/login :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
