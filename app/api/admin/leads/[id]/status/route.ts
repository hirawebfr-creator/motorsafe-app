/**
 * LEADS-CRM-01: Lead Status Change API
 * 
 * POST /api/admin/leads/[id]/status - Change lead status with activity logging
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { success, failure } from "@/lib/api";
import { LeadStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  DEMO_SCHEDULED: "Démo planifiée",
  DEMO_DONE: "Démo effectuée",
  TRIAL_STARTED: "Essai démarré",
  WON: "Gagné",
  LOST: "Perdu",
};

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
    const { status, lostReason, trialGarageId } = body;

    if (!status) {
      return NextResponse.json(failure("Statut requis"), { status: 400 });
    }

    // Validate status
    const validStatuses: LeadStatus[] = [
      "NEW", "CONTACTED", "DEMO_SCHEDULED", "DEMO_DONE", 
      "TRIAL_STARTED", "WON", "LOST"
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(failure("Statut invalide"), { status: 400 });
    }

    const oldStatus = lead.status;

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status,
    };

    if (status === "LOST") {
      updateData.lostAt = new Date();
      if (lostReason) updateData.lostReason = lostReason;
    } else if (status === "WON") {
      updateData.wonAt = new Date();
      if (trialGarageId) updateData.trialGarageId = trialGarageId;
    } else if (status === "TRIAL_STARTED" && trialGarageId) {
      updateData.trialGarageId = trialGarageId;
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        ownerUser: {
          select: { id: true, email: true },
        },
        trialGarage: {
          select: { id: true, name: true },
        },
      },
    });

    // Log status change activity
    const oldLabel = STATUS_LABELS[oldStatus as LeadStatus] || oldStatus;
    const newLabel = STATUS_LABELS[status as LeadStatus] || status;

    await prisma.leadActivity.create({
      data: {
        leadId,
        type: "STATUS_CHANGE",
        summary: `Statut: ${oldLabel} → ${newLabel}`,
        details: lostReason ? `Raison: ${lostReason}` : undefined,
        oldStatus: oldStatus as LeadStatus,
        newStatus: status,
        createdByUserId: user.id,
      },
    });

    return NextResponse.json(success(updated));
  } catch (error) {
    console.error("[Leads API] POST status error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
