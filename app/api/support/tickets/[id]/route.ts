/**
 * SUPPORT-OMNI-01: Single Ticket Detail API
 * GET - Get ticket detail with messages (scoped to garageId)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: Context) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    const { id } = await context.params;

    if (!id) {
      throw new RouteError(400, "BAD_REQUEST", "ID ticket requis");
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        garageId, // Strict scope
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            authorType: true,
            message: true,
            createdAt: true,
          },
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
        lastReplyAt: ticket.lastReplyAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        messages: ticket.messages,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
