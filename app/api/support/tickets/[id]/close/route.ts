/**
 * SUPPORT-OMNI-01: Close Ticket API
 * POST - Close a ticket (scoped to garageId)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";

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

    // Verify ticket belongs to this garage
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, garageId },
      select: { id: true, status: true },
    });

    if (!ticket) {
      throw new RouteError(404, "NOT_FOUND", "Ticket non trouvé");
    }

    if (ticket.status === "CLOSED") {
      throw new RouteError(400, "BAD_REQUEST", "Ce ticket est déjà fermé");
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "CLOSED" },
    });

    return NextResponse.json(success({ message: "Ticket fermé" }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
