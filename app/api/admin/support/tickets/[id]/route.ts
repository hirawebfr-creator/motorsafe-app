/**
 * SUPPORT-OMNI-01: Admin Single Ticket Detail API
 * GET - Get ticket detail with all messages (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: Context) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await context.params;

    if (!id) {
      throw new RouteError(400, "BAD_REQUEST", "ID ticket requis");
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            authorType: true,
            authorUserId: true,
            message: true,
            createdAt: true,
          },
        },
        garage: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw new RouteError(404, "NOT_FOUND", "Ticket non trouvé");
    }

    return NextResponse.json(
      success({
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        channel: ticket.channel,
        requesterName: ticket.requesterName,
        requesterEmail: ticket.requesterEmail,
        requesterPhone: ticket.requesterPhone,
        garageId: ticket.garageId,
        garageName: ticket.garage?.name || null,
        garageEmail: ticket.garage?.email || null,
        garage: ticket.garage ? { name: ticket.garage.name } : null,
        lastReplyAt: ticket.lastReplyAt,
        slaTargetAt: ticket.slaTargetAt,
        slaBreachedAt: ticket.slaBreachedAt,
        lastRequesterMessageAt: ticket.lastRequesterMessageAt,
        lastAdminMessageAt: ticket.lastAdminMessageAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        messages: ticket.messages,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
