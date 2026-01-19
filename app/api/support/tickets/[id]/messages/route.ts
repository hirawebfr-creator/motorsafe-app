/**
 * SUPPORT-OMNI-01: Add Message to Ticket API
 * POST - Add a message to an existing ticket (scoped to garageId)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { checkGarageRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rateLimit";
import { SUPPORT_RATE_LIMITS, sanitizeMessage } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: Context) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    const { id: ticketId } = await context.params;

    if (!ticketId) {
      throw new RouteError(400, "BAD_REQUEST", "ID ticket requis");
    }

    // Rate limit
    const ip = getClientIp(req);
    const rl = await checkGarageRateLimit(
      garageId,
      `ticket_msg:${ip}`,
      SUPPORT_RATE_LIMITS.CREATE_MESSAGE.limit,
      SUPPORT_RATE_LIMITS.CREATE_MESSAGE.windowSec
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMIT", message: "Trop de messages. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await req.json() as { message: string };

    if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      throw new RouteError(400, "BAD_REQUEST", "Message requis");
    }

    const message = sanitizeMessage(body.message);
    if (message.length < 1) {
      throw new RouteError(400, "BAD_REQUEST", "Message trop court");
    }

    // Verify ticket belongs to this garage
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, garageId },
      select: { id: true, status: true },
    });

    if (!ticket) {
      throw new RouteError(404, "NOT_FOUND", "Ticket non trouvé");
    }

    if (ticket.status === "CLOSED") {
      throw new RouteError(400, "BAD_REQUEST", "Ce ticket est fermé");
    }

    // Create message and update ticket
    const now = new Date();
    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.supportMessage.create({
        data: {
          ticketId,
          authorType: "GARAGE_USER",
          authorUserId: user.id,
          message,
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          lastReplyAt: now,
          // SUPPORT-SLA-01: Track requester message time
          lastRequesterMessageAt: now,
          // If ticket was waiting for customer, set back to in progress
          status: ticket.status === "WAITING_CUSTOMER" ? "IN_PROGRESS" : undefined,
        },
      });

      return msg;
    });

    return NextResponse.json(
      success({
        id: newMessage.id,
        message: "Message ajouté",
      }),
      { status: 201 }
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
