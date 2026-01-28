/**
 * Notifications API
 * 
 * GET  - Liste les notifications du garage
 * POST - Marquer comme lue / supprimer
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Liste les notifications du garage connecté
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.garageId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const notifications = await prisma.notification.findMany({
      where: {
        garageId: user.garageId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    const unreadCount = await prisma.notification.count({
      where: {
        garageId: user.garageId,
        readAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        content: n.content,
        read: !!n.readAt,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() || null,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("[API] GET /api/notifications error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Actions: mark_read, mark_all_read, delete, delete_all
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.garageId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { action, id } = body as { action: string; id?: string };

    switch (action) {
      case "mark_read": {
        if (!id) {
          return NextResponse.json({ error: "ID requis" }, { status: 400 });
        }
        await prisma.notification.updateMany({
          where: { id, garageId: user.garageId },
          data: { readAt: new Date() },
        });
        break;
      }

      case "mark_all_read": {
        await prisma.notification.updateMany({
          where: { garageId: user.garageId, readAt: null },
          data: { readAt: new Date() },
        });
        break;
      }

      case "delete": {
        if (!id) {
          return NextResponse.json({ error: "ID requis" }, { status: 400 });
        }
        await prisma.notification.deleteMany({
          where: { id, garageId: user.garageId },
        });
        break;
      }

      case "delete_all": {
        await prisma.notification.deleteMany({
          where: { garageId: user.garageId },
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] POST /api/notifications error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
