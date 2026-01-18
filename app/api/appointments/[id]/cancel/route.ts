/**
 * APPOINTMENTS-01: Cancel appointment
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { cancelAppointmentReminderJobs } from "@/lib/appointments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);

    if (!isAdmin && organisationId) {
      await requireFeature(organisationId, FeatureKey.APPOINTMENTS);
    }

    const { id } = await ctx.params;
    const appointmentId = String(id);

    const existing = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        ...(isAdmin ? {} : { garageId: organisationId }),
      },
    });

    if (!existing) {
      throw new RouteError(404, "NOT_FOUND", "RDV introuvable");
    }

    if (existing.status !== "SCHEDULED") {
      throw new RouteError(409, "CONFLICT", "Ce RDV ne peut pas être annulé");
    }

    // Cancel reminder jobs
    await cancelAppointmentReminderJobs(appointmentId);

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: existing.garageId,
        userId: user.id,
        action: "APPOINTMENT_CANCELLED",
        entityType: "APPOINTMENT",
        entityId: appointmentId,
      },
    });

    return NextResponse.json({ ok: true, data: appointment });
  } catch (err) {
    return toErrorResponse(err);
  }
}
