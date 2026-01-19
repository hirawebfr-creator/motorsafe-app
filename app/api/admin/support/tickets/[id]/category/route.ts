/**
 * AI-SUGGEST-01: Admin Change Ticket Category API
 * POST - Change ticket category (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import type { SupportCategory } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const VALID_CATEGORIES: SupportCategory[] = ["BUG", "BILLING", "FEATURE", "LEGAL", "OTHER"];

export async function POST(req: Request, context: Context) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id: ticketId } = await context.params;

    if (!ticketId) {
      throw new RouteError(400, "BAD_REQUEST", "ID ticket requis");
    }

    const body = await req.json() as { category: SupportCategory };

    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      throw new RouteError(400, "BAD_REQUEST", "Catégorie invalide");
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
      data: { category: body.category },
    });

    return NextResponse.json(success({ message: "Catégorie mise à jour", category: body.category }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
