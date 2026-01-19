/**
 * IN-APP-STATUS-AND-CHANGES-01: Admin Maintenance Entry API
 * PATCH /api/admin/maintenance/[id] - Update a maintenance window
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await params;

    const existing = await prisma.maintenanceWindow.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Maintenance non trouvée" }, { status: 404 });
    }

    const body = await req.json();
    const { title, message, startsAt, endsAt, severity, isActive } = body;

    const updates: {
      title?: string;
      message?: string;
      startsAt?: Date;
      endsAt?: Date;
      severity?: "INFO" | "WARNING";
      isActive?: boolean;
    } = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 2) {
        return NextResponse.json({ error: "Titre requis (min 2 caractères)" }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (message !== undefined) {
      if (typeof message !== "string" || message.trim().length < 5) {
        return NextResponse.json({ error: "Message requis (min 5 caractères)" }, { status: 400 });
      }
      updates.message = message.trim();
    }

    if (startsAt !== undefined) {
      const startDate = new Date(startsAt);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ error: "Date de début invalide" }, { status: 400 });
      }
      updates.startsAt = startDate;
    }

    if (endsAt !== undefined) {
      const endDate = new Date(endsAt);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: "Date de fin invalide" }, { status: 400 });
      }
      updates.endsAt = endDate;
    }

    // Validate start < end
    const finalStart = updates.startsAt || existing.startsAt;
    const finalEnd = updates.endsAt || existing.endsAt;
    if (finalEnd <= finalStart) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
    }

    if (severity !== undefined) {
      if (!["INFO", "WARNING"].includes(severity)) {
        return NextResponse.json({ error: "Sévérité invalide" }, { status: 400 });
      }
      updates.severity = severity;
    }

    if (isActive !== undefined) {
      updates.isActive = !!isActive;
    }

    const maintenance = await prisma.maintenanceWindow.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        severity: true,
        isActive: true,
      },
    });

    console.log(`[API:Admin:Maintenance] Updated window ${maintenance.id} by admin ${user.id}`);

    return NextResponse.json({ maintenance });
  } catch (err) {
    console.error("[API:Admin:Maintenance:Update] Error:", err);
    return toErrorResponse(err);
  }
}
