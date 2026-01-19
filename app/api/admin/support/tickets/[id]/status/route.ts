/**
 * SUPPORT-OMNI-01: Admin Change Ticket Status API
 * POST - Change ticket status (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import type { SupportTicketStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const VALID_STATUSES: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"];

export async function POST(req: Request, context: Context) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id: ticketId } = await context.params;

    if (!ticketId) {
      throw new RouteError(400, "BAD_REQUEST", "ID ticket requis");
    }

    const body = await req.json() as { status: SupportTicketStatus };

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      throw new RouteError(400, "BAD_REQUEST", "Statut invalide");
    }

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      throw new RouteError(404, "NOT_FOUND", "Ticket non trouvé");
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: body.status },
    });

    return NextResponse.json(success({ message: "Statut mis à jour", status: body.status }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
