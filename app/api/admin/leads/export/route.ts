/**
 * LEADS-CRM-01: CSV Export API
 * 
 * GET /api/admin/leads/export - Export leads as CSV
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { failure } from "@/lib/api";
import { LeadStatus, LeadChannel } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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

const CHANNEL_LABELS: Record<LeadChannel, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  SMS: "SMS",
  EMAIL: "Email",
  PHONE: "Téléphone",
  LINKEDIN: "LinkedIn",
  REFERRAL: "Parrainage",
  OTHER: "Autre",
};

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorisé"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json(failure("Accès réservé à l'administration."), { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") as LeadStatus | null;
    const includeAnonymized = url.searchParams.get("includeAnonymized") === "true";

    const where: Record<string, unknown> = {};
    if (!includeAnonymized) where.anonymizedAt = null;
    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        ownerUser: {
          select: { email: true },
        },
        trialGarage: {
          select: { name: true },
        },
        _count: {
          select: { activities: true },
        },
      },
    });

    // CSV Header
    const headers = [
      "ID",
      "Nom Garage",
      "Ville",
      "Code Postal",
      "Contact",
      "Email",
      "Téléphone",
      "Statut",
      "Canal",
      "Source",
      "Prochaine Relance",
      "Dernier Contact",
      "Responsable",
      "Garage Converti",
      "Nb Activités",
      "Créé le",
      "Notes",
    ];

    const rows = leads.map((lead) => [
      lead.id,
      escapeCsv(lead.garageName),
      escapeCsv(lead.city),
      escapeCsv(lead.postalCode),
      escapeCsv(lead.contactName),
      escapeCsv(lead.contactEmail),
      escapeCsv(lead.contactPhone),
      STATUS_LABELS[lead.status] || lead.status,
      CHANNEL_LABELS[lead.channel] || lead.channel,
      escapeCsv(lead.source),
      formatDate(lead.nextFollowUpAt),
      formatDate(lead.lastContactedAt),
      escapeCsv(lead.ownerUser?.email),
      escapeCsv(lead.trialGarage?.name),
      lead._count.activities,
      formatDate(lead.createdAt),
      escapeCsv(lead.notes),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const filename = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[Leads API] GET export error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
