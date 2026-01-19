/**
 * IN-APP-STATUS-AND-CHANGES-01: Admin Maintenance API
 * GET /api/admin/maintenance - List all maintenance windows
 * POST /api/admin/maintenance - Create a new maintenance window
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const maintenances = await prisma.maintenanceWindow.findMany({
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        startsAt: true,
        endsAt: true,
        severity: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json({ maintenances });
  } catch (err) {
    console.error("[API:Admin:Maintenance:List] Error:", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const { title, message, startsAt, endsAt, severity = "INFO", isActive = true } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json({ error: "Titre requis (min 2 caractères)" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "Message requis (min 5 caractères)" }, { status: 400 });
    }

    if (!startsAt || !endsAt) {
      return NextResponse.json({ error: "Dates de début et fin requises" }, { status: 400 });
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
    }

    if (!["INFO", "WARNING"].includes(severity)) {
      return NextResponse.json({ error: "Sévérité invalide" }, { status: 400 });
    }

    const maintenance = await prisma.maintenanceWindow.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        startsAt: startDate,
        endsAt: endDate,
        severity,
        isActive,
        createdByUserId: user.id,
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        severity: true,
        isActive: true,
      },
    });

    console.log(`[API:Admin:Maintenance] Created window ${maintenance.id} by admin ${user.id}`);

    return NextResponse.json({ maintenance }, { status: 201 });
  } catch (err) {
    console.error("[API:Admin:Maintenance:Create] Error:", err);
    return toErrorResponse(err);
  }
}
