/**
 * LEADS-CRM-01: Internal Sales CRM API
 * 
 * GET /api/admin/leads - List leads with filters
 * POST /api/admin/leads - Create new lead
 * 
 * Admin-only access (role=ADMIN or x-admin-key header)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { success, failure } from "@/lib/api";
import { LeadStatus, LeadChannel } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorisé"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json(failure("Accès réservé à l'administration."), { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") as LeadStatus | null;
    const channel = url.searchParams.get("channel") as LeadChannel | null;
    const ownerId = url.searchParams.get("ownerId");
    const search = url.searchParams.get("search");
    const followUpToday = url.searchParams.get("followUpToday") === "true";

    // Build where clause
    const where: Record<string, unknown> = {
      anonymizedAt: null, // Exclude anonymized leads
    };

    if (status) where.status = status;
    if (channel) where.channel = channel;
    if (ownerId) where.ownerUserId = ownerId;

    if (search) {
      where.OR = [
        { garageName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (followUpToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.nextFollowUpAt = {
        gte: today,
        lt: tomorrow,
      };
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [
        { nextFollowUpAt: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        ownerUser: {
          select: { id: true, email: true },
        },
        trialGarage: {
          select: { id: true, name: true, status: true },
        },
        _count: {
          select: { activities: true },
        },
      },
    });

    return NextResponse.json(success(leads));
  } catch (error) {
    console.error("[Leads API] GET error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorisé"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json(failure("Accès réservé à l'administration."), { status: 403 });
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
    } = body;

    if (!garageName) {
      return NextResponse.json(failure("Nom du garage requis"), { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        garageName,
        city,
        postalCode,
        contactName,
        contactEmail,
        contactPhone,
        channel: channel || "OTHER",
        source,
        notes,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        ownerUserId: user.id,
      },
      include: {
        ownerUser: {
          select: { id: true, email: true },
        },
      },
    });

    // Create initial activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "NOTE",
        summary: "Lead créé",
        createdByUserId: user.id,
      },
    });

    return NextResponse.json(success(lead), { status: 201 });
  } catch (error) {
    console.error("[Leads API] POST error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
