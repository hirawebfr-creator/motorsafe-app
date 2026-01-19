/**
 * SUPPORT-OMNI-01: Admin Reply to Ticket API
 * POST - Add admin reply to a ticket (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { sanitizeMessage } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: Context) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id: ticketId } = await context.params;

    if (!ticketId) {
      throw new RouteError(400, "BAD_REQUEST", "ID ticket requis");
    }

    const body = await req.json() as { message: string; setStatus?: string };

    if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      throw new RouteError(400, "BAD_REQUEST", "Message requis");
    }

    const message = sanitizeMessage(body.message);
    if (message.length < 1) {
      throw new RouteError(400, "BAD_REQUEST", "Message trop court");
    }

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });

    if (!ticket) {
      throw new RouteError(404, "NOT_FOUND", "Ticket non trouvé");
    }

    // Determine new status
    let newStatus = ticket.status;
    if (body.setStatus && ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"].includes(body.setStatus)) {
      newStatus = body.setStatus as typeof newStatus;
    } else if (ticket.status === "OPEN") {
      newStatus = "IN_PROGRESS";
    }

    // Create message and update ticket
    const now = new Date();
    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.supportMessage.create({
        data: {
          ticketId,
          authorType: "ADMIN",
          authorUserId: user.id,
          message,
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          lastReplyAt: now,
          status: newStatus,
          // SUPPORT-SLA-01: Track admin response time
          lastAdminMessageAt: now,
        },
      });

      return msg;
    });

    return NextResponse.json(
      success({
        id: newMessage.id,
        message: "Réponse ajoutée",
        newStatus,
      }),
      { status: 201 }
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
