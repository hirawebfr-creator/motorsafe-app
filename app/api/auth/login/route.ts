import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    // Rate limit: 10 attempts per 10 minutes per IP
    const rateLimit = await checkIpRateLimit(req, "login", 10, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        failure("Trop de tentatives. Réessayez plus tard."),
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = await req.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");
    const rememberMe = Boolean(body.rememberMe);

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

    // Only REJECTED garages are blocked - ACTIVE and PENDING can login
    if (user.role !== "ADMIN" && user.garage?.status === "REJECTED") {
      return NextResponse.json(failure("Compte refuse."), { status: 403 });
    }

    const { token, expiresAt } = await createSession(user.id, rememberMe);
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
