/**
 * Messages API - Thread detail and messages
 * 
 * GET  - Récupère les messages d'un thread
 * POST - Ajoute un message au thread
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageDirection, MessageChannel, MessageStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

/**
 * GET /api/messages/[threadId]
 * Récupère tous les messages d'un thread
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.garageId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { threadId } = await params;

    const thread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        garageId: user.garageId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread non trouvé" }, { status: 404 });
    }

    // Get client info if exists
    let client = null;
    if (thread.clientId) {
      client = await prisma.client.findUnique({
        where: { id: thread.clientId },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      });
    }

    // Get intervention info if exists
    let intervention = null;
    if (thread.interventionId) {
      intervention = await prisma.intervention.findUnique({
        where: { id: thread.interventionId },
        select: {
          id: true,
          type: true,
          status: true,
          vehicle: {
            select: { brand: true, model: true, plate: true },
          },
        },
      });
    }

    return NextResponse.json({
      ok: true,
      thread: {
        id: thread.id,
        subject: thread.subject,
        clientId: thread.clientId,
        interventionId: thread.interventionId,
        quoteId: thread.quoteId,
        invoiceId: thread.invoiceId,
        isArchived: thread.isArchived,
        createdAt: thread.createdAt.toISOString(),
      },
      client,
      intervention,
      messages: thread.messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        channel: m.channel,
        status: m.status,
        content: m.content,
        senderType: m.senderType,
        senderName: m.senderName,
        sentAt: m.sentAt?.toISOString() || m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() || null,
        attachmentKeys: m.attachmentKeys,
      })),
    });
  } catch (error) {
    console.error("[API] GET /api/messages/[threadId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/messages/[threadId]
 * Ajoute un message au thread
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.garageId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();
    const { content, channel } = body as {
      content: string;
      channel?: "INTERNAL" | "EMAIL";
    };

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Le contenu du message est requis" }, { status: 400 });
    }

    // Verify thread belongs to garage
    const thread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        garageId: user.garageId,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread non trouvé" }, { status: 404 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        garageId: user.garageId,
        direction: MessageDirection.OUTBOUND,
        channel: channel === "EMAIL" ? MessageChannel.EMAIL : MessageChannel.INTERNAL,
        status: MessageStatus.SENT,
        content: content.trim(),
        senderType: "garage",
        senderName: user.email,
        senderUserId: user.id,
        sentAt: new Date(),
      },
    });

    // Update thread timestamp
    await prisma.messageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    // TODO: If channel is EMAIL, send email to client

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        direction: message.direction,
        channel: message.channel,
        status: message.status,
        content: message.content,
        senderType: message.senderType,
        senderName: message.senderName,
        sentAt: message.sentAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] POST /api/messages/[threadId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/messages/[threadId]
 * Archiver/désarchiver un thread
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.garageId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();
    const { action } = body as { action: "archive" | "unarchive" };

    const thread = await prisma.messageThread.updateMany({
      where: {
        id: threadId,
        garageId: user.garageId,
      },
      data: {
        isArchived: action === "archive",
      },
    });

    if (thread.count === 0) {
      return NextResponse.json({ error: "Thread non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] PATCH /api/messages/[threadId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
