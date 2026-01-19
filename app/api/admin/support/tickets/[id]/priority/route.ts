/**
 * SUPPORT-OMNI-01: Admin Change Ticket Priority API
 * POST - Change ticket priority (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import type { SupportPriority } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const VALID_PRIORITIES: SupportPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export async function POST(req: Request, context: Context) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id: ticketId } = await context.params;

    if (!ticketId) {
      throw new RouteError(400, "BAD_REQUEST", "ID ticket requis");
    }

    const body = await req.json() as { priority: SupportPriority };

    if (!body.priority || !VALID_PRIORITIES.includes(body.priority)) {
      throw new RouteError(400, "BAD_REQUEST", "Priorité invalide");
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
      data: { priority: body.priority },
    });

    return NextResponse.json(success({ message: "Priorité mise à jour", priority: body.priority }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
