/**
 * Messages API - Thread listing and creation
 * 
 * GET  - Liste les threads de messages du garage
 * POST - Crée un nouveau thread avec premier message
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageDirection, MessageChannel, MessageStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/messages
 * Liste les threads de messages
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.garageId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const interventionId = searchParams.get("interventionId");
    const archived = searchParams.get("archived") === "true";

    const threads = await prisma.messageThread.findMany({
      where: {
        garageId: user.garageId,
        isArchived: archived,
        ...(clientId ? { clientId: parseInt(clientId, 10) } : {}),
        ...(interventionId ? { interventionId } : {}),
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Last message only for preview
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // Enrich with client info
    const clientIds = [...new Set(threads.map((t) => t.clientId).filter(Boolean))] as number[];
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const result = threads.map((thread) => {
      const lastMessage = thread.messages[0];
      const client = thread.clientId ? clientMap.get(thread.clientId) : null;
      
      return {
        id: thread.id,
        subject: thread.subject || (client ? `${client.firstName} ${client.lastName}` : "Conversation"),
        clientId: thread.clientId,
        clientName: client ? `${client.firstName} ${client.lastName}` : null,
        clientEmail: client?.email || null,
        interventionId: thread.interventionId,
        lastMessage: lastMessage ? {
          content: lastMessage.content.slice(0, 100),
          direction: lastMessage.direction,
          sentAt: lastMessage.sentAt?.toISOString() || lastMessage.createdAt.toISOString(),
          status: lastMessage.status,
        } : null,
        unreadCount: 0, // TODO: Track read status per user
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ ok: true, threads: result });
  } catch (error) {
    console.error("[API] GET /api/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/messages
 * Crée un nouveau thread avec le premier message
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.garageId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, interventionId, quoteId, invoiceId, subject, content, channel } = body as {
      clientId?: number;
      interventionId?: string;
      quoteId?: string;
      invoiceId?: string;
      subject?: string;
      content: string;
      channel?: "INTERNAL" | "EMAIL";
    };

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Le contenu du message est requis" }, { status: 400 });
    }

    // Create thread and first message in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if thread already exists for this context
      let thread = await tx.messageThread.findFirst({
        where: {
          garageId: user.garageId!,
          ...(interventionId ? { interventionId } : {}),
          ...(quoteId ? { quoteId } : {}),
          ...(invoiceId ? { invoiceId } : {}),
          ...(clientId && !interventionId && !quoteId && !invoiceId ? { clientId, interventionId: null, quoteId: null, invoiceId: null } : {}),
        },
      });

      if (!thread) {
        thread = await tx.messageThread.create({
          data: {
            garageId: user.garageId!,
            clientId: clientId || null,
            interventionId: interventionId || null,
            quoteId: quoteId || null,
            invoiceId: invoiceId || null,
            subject: subject || null,
          },
        });
      }

      // Create message
      const message = await tx.message.create({
        data: {
          threadId: thread.id,
          garageId: user.garageId!,
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
      await tx.messageThread.update({
        where: { id: thread.id },
        data: { updatedAt: new Date() },
      });

      return { thread, message };
    });

    // TODO: If channel is EMAIL, send email to client

    return NextResponse.json({
      ok: true,
      threadId: result.thread.id,
      messageId: result.message.id,
    });
  } catch (error) {
    console.error("[API] POST /api/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
