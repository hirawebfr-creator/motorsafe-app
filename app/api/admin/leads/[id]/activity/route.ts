/**
 * LEADS-CRM-01: Lead Activity API
 * 
 * POST /api/admin/leads/[id]/activity - Add activity (note, call, etc.)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { success, failure } from "@/lib/api";
import { LeadActivityType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorisé"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json(failure("Accès réservé à l'administration."), { status: 403 });
    }

    const { id } = await context.params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json(failure("Lead introuvable"), { status: 404 });
    }

    if (lead.anonymizedAt) {
      return NextResponse.json(failure("Lead anonymisé"), { status: 400 });
    }

    const body = await req.json();
    const { type, summary, details } = body;

    if (!type || !summary) {
      return NextResponse.json(failure("Type et résumé requis"), { status: 400 });
    }

    // Validate activity type
    const validTypes: LeadActivityType[] = ["NOTE", "CALL", "SMS", "EMAIL", "DM", "DEMO", "STATUS_CHANGE"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(failure("Type d'activité invalide"), { status: 400 });
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        type,
        summary,
        details,
        createdByUserId: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });

    // Update lastContactedAt if it's a contact activity
    const contactTypes: LeadActivityType[] = ["CALL", "SMS", "EMAIL", "DM", "DEMO"];
    if (contactTypes.includes(type)) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { lastContactedAt: new Date() },
      });
    }

    return NextResponse.json(success(activity), { status: 201 });
  } catch (error) {
    console.error("[Leads API] POST activity error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
