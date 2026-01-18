/**
 * LEADS-CRM-01: Single Lead API
 * 
 * GET /api/admin/leads/[id] - Get lead details with activities
 * PATCH /api/admin/leads/[id] - Update lead fields
 * DELETE /api/admin/leads/[id] - Anonymize lead (RGPD)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
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
      include: {
        ownerUser: {
          select: { id: true, email: true },
        },
        trialGarage: {
          select: { id: true, name: true, status: true, plan: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            createdBy: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(failure("Lead introuvable"), { status: 404 });
    }

    return NextResponse.json(success(lead));
  } catch (error) {
    console.error("[Leads API] GET [id] error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
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

    const body = await req.json();
    const {
      garageName,
      city,
      postalCode,
      contactName,
      contactEmail,
      contactPhone,
      channel,
      source,
      notes,
      nextFollowUpAt,
      ownerUserId,
    } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json(failure("Lead introuvable"), { status: 404 });
    }

    if (lead.anonymizedAt) {
      return NextResponse.json(failure("Lead anonymisé, modification impossible"), { status: 400 });
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(garageName !== undefined && { garageName }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(channel !== undefined && { channel }),
        ...(source !== undefined && { source }),
        ...(notes !== undefined && { notes }),
        ...(nextFollowUpAt !== undefined && {
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        }),
        ...(ownerUserId !== undefined && { ownerUserId }),
      },
      include: {
        ownerUser: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(success(updated));
  } catch (error) {
    console.error("[Leads API] PATCH [id] error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
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

    // RGPD: Anonymize instead of hard delete
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        garageName: "ANONYMISÉ",
        city: null,
        postalCode: null,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        notes: null,
        source: null,
        anonymizedAt: new Date(),
      },
    });

    // Also anonymize activities
    await prisma.leadActivity.updateMany({
      where: { leadId },
      data: {
        summary: "Activité anonymisée",
        details: null,
      },
    });

    return NextResponse.json(success({ anonymized: true }));
  } catch (error) {
    console.error("[Leads API] DELETE [id] error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
