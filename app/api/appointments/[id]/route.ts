/**
 * APPOINTMENTS-01: Single Appointment API
 * 
 * GET   - Get appointment details
 * PATCH - Update appointment (with conflict detection)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { createAppointmentReminderJobs, cancelAppointmentReminderJobs } from "@/lib/appointments";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ============================================
// GET - Get appointment details
// ============================================

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);

    if (!isAdmin && organisationId) {
      await requireFeature(organisationId, FeatureKey.APPOINTMENTS);
    }

    const { id } = await ctx.params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: String(id),
        ...(isAdmin ? {} : { garageId: organisationId }),
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        intervention: { select: { id: true, status: true, type: true } },
        createdByUser: { select: { id: true, email: true } },
      },
    });

    if (!appointment) {
      throw new RouteError(404, "NOT_FOUND", "RDV introuvable");
    }

    return NextResponse.json({ ok: true, data: appointment });
  } catch (err) {
    return toErrorResponse(err);
  }
}

// ============================================
// PATCH - Update appointment
// ============================================

const PatchSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  startAt: z.string().transform((s) => new Date(s)).optional(),
  endAt: z.string().transform((s) => new Date(s)).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  reminderPolicy: z.enum(["NONE", "STANDARD"]).optional(),
  clientId: z.coerce.number().int().positive().optional(),
  vehicleId: z.string().trim().optional().or(z.literal("")),
  interventionId: z.string().trim().optional().or(z.literal("")),
});

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);

    if (!isAdmin && organisationId) {
      await requireFeature(organisationId, FeatureKey.APPOINTMENTS);
    }

    const { id } = await ctx.params;
    const appointmentId = String(id);

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Données invalides", parsed.error.flatten());
    }

    const input = parsed.data;

    // Get existing appointment
    const existing = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        ...(isAdmin ? {} : { garageId: organisationId }),
      },
    });

    if (!existing) {
      throw new RouteError(404, "NOT_FOUND", "RDV introuvable");
    }

    // Cannot edit cancelled/done appointments
    if (existing.status !== "SCHEDULED") {
      throw new RouteError(409, "CONFLICT", "Ce RDV ne peut plus être modifié");
    }

    // Compute new dates
    const newStartAt = input.startAt || existing.startAt;
    const newEndAt = input.endAt || existing.endAt;

    // Validate dates if changed
    if (input.startAt || input.endAt) {
      if (newEndAt <= newStartAt) {
        throw new RouteError(400, "BAD_REQUEST", "La date de fin doit être après la date de début");
      }

      const durationMs = newEndAt.getTime() - newStartAt.getTime();
      if (durationMs > 8 * 60 * 60 * 1000) {
        throw new RouteError(400, "BAD_REQUEST", "Durée maximum: 8 heures");
      }

      // Conflict detection (excluding this appointment)
      const conflicts = await prisma.appointment.findMany({
        where: {
          garageId: existing.garageId,
          status: "SCHEDULED",
          id: { not: appointmentId },
          startAt: { lt: newEndAt },
          endAt: { gt: newStartAt },
        },
        select: { id: true, title: true, startAt: true, endAt: true },
      });

      if (conflicts.length > 0) {
        throw new RouteError(409, "APPOINTMENT_CONFLICT", "Conflit avec un autre RDV", {
          conflicts: conflicts.map((c) => ({
            id: c.id,
            title: c.title,
            startAt: c.startAt.toISOString(),
            endAt: c.endAt.toISOString(),
          })),
        });
      }
    }

    // Validate client if changed
    if (input.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: input.clientId,
          garageId: existing.garageId,
          deletedAt: null,
        },
      });
      if (!client) {
        throw new RouteError(404, "NOT_FOUND", "Client introuvable");
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.startAt !== undefined) updateData.startAt = input.startAt;
    if (input.endAt !== undefined) updateData.endAt = input.endAt;
    if (input.notes !== undefined) updateData.notes = input.notes || null;
    if (input.clientId !== undefined) updateData.clientId = input.clientId;
    if (input.vehicleId !== undefined) updateData.vehicleId = input.vehicleId || null;
    if (input.interventionId !== undefined) updateData.interventionId = input.interventionId || null;

    // Handle reminder policy change
    if (input.reminderPolicy !== undefined && input.reminderPolicy !== existing.reminderPolicy) {
      updateData.reminderPolicy = input.reminderPolicy;

      if (input.reminderPolicy === "STANDARD") {
        // Create new reminder jobs
        await createAppointmentReminderJobs(existing.garageId, appointmentId, newStartAt);
      } else {
        // Cancel existing reminder jobs
        await cancelAppointmentReminderJobs(appointmentId);
      }
    } else if ((input.startAt || input.endAt) && existing.reminderPolicy === "STANDARD") {
      // Date changed, reschedule reminders
      await cancelAppointmentReminderJobs(appointmentId);
      await createAppointmentReminderJobs(existing.garageId, appointmentId, newStartAt);
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: existing.garageId,
        userId: user.id,
        action: "APPOINTMENT_UPDATED",
        entityType: "APPOINTMENT",
        entityId: appointmentId,
        metadata: { changes: Object.keys(updateData) },
      },
    });

    return NextResponse.json({ ok: true, data: appointment });
  } catch (err) {
    return toErrorResponse(err);
  }
}
