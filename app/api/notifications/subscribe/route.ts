import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * POST /api/notifications/subscribe
 * Enregistre un abonnement push pour l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.id) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Non authentifié" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint, keys, expirationTime } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_DATA", message: "Données d'abonnement invalides" } },
        { status: 400 }
      );
    }

    // Stocker l'abonnement dans la base de données
    // On utilise upsert pour éviter les doublons
    await prisma.pushSubscription.upsert({
      where: {
        endpoint,
      },
      create: {
        userId: session.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        expirationTime: expirationTime ? new Date(expirationTime) : null,
      },
      update: {
        userId: session.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        expirationTime: expirationTime ? new Date(expirationTime) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] Error subscribing to push:", error);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
