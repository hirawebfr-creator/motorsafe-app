import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * POST /api/notifications/unsubscribe
 * Supprime un abonnement push
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
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_DATA", message: "Endpoint manquant" } },
        { status: 400 }
      );
    }

    // Supprimer l'abonnement
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] Error unsubscribing from push:", error);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
