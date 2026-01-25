/**
 * APPOINTMENTS-01: Appointments API
 * 
 * GET  - List appointments for calendar (from/to range)
 * POST - Create new appointment with conflict detection
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { checkRateLimit } from "@/lib/rateLimit";
import { createAppointmentReminderJobs } from "@/lib/appointments";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================
// GET - List appointments for calendar
// ============================================

const ListQuerySchema = z.object({
  from: z.string().transform((s) => new Date(s)),
  to: z.string().transform((s) => new Date(s)),
  status: z.enum(["SCHEDULED", "DONE", "CANCELLED", "NO_SHOW"]).optional(),
});

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);

    // Feature gate
    if (!isAdmin && organisationId) {
      await requireFeature(organisationId, FeatureKey.APPOINTMENTS);
    }

    const { searchParams } = new URL(req.url);
    const parsed = ListQuerySchema.safeParse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      status: searchParams.get("status") || undefined,
    });

    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Paramètres from/to requis", parsed.error.flatten());
    }

    const { from, to, status } = parsed.data;

    // Validate date range (max 31 days)
    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
      throw new RouteError(400, "BAD_REQUEST", "Plage de dates trop large (max 31 jours)");
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(isAdmin ? {} : { garageId: organisationId }),
        startAt: { gte: from },
        endAt: { lte: to },
        ...(status ? { status } : {}),
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        intervention: { select: { id: true, status: true, type: true } },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json({ ok: true, data: appointments });
  } catch (err) {
    return toErrorResponse(err);
  }
}

// ============================================
// POST - Create appointment with conflict detection
// ============================================

const CreateSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  vehicleId: z.string().trim().optional().or(z.literal("")),
  interventionId: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().min(1).max(100),
  startAt: z.string().transform((s) => new Date(s)),
  endAt: z.string().transform((s) => new Date(s)),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  reminderPolicy: z.enum(["NONE", "STANDARD"]).default("NONE"),
});

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    let organisationId = isAdmin ? undefined : (user.garageId ?? -1);

    // For ADMIN users without garageId, use first active garage
    if (isAdmin && !organisationId) {
      const firstGarage = await prisma.garage.findFirst({
        where: { status: "ACTIVE" },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      if (firstGarage) {
        organisationId = firstGarage.id;
      }
    }

    // Feature gate
    if (!isAdmin && organisationId) {
      await requireFeature(organisationId, FeatureKey.APPOINTMENTS);
    }

    if (!organisationId) {
      throw new RouteError(400, "BAD_REQUEST", "Aucun garage disponible");
    }

    // Rate limit: max 20 appointments per 10 minutes per garage
    const rl = await checkRateLimit({
      key: `garage:${organisationId}:appointments:create`,
      limit: 20,
      windowSec: 600,
    });
    if (!rl.allowed) {
      throw new RouteError(429, "RATE_LIMIT", "Trop de créations de RDV, réessayez plus tard");
    }

    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Données invalides", parsed.error.flatten());
    }

    const input = parsed.data;

    // Validate dates
    if (input.endAt <= input.startAt) {
      throw new RouteError(400, "BAD_REQUEST", "La date de fin doit être après la date de début");
    }

    // Validate duration (max 8 hours)
    const durationMs = input.endAt.getTime() - input.startAt.getTime();
    if (durationMs > 8 * 60 * 60 * 1000) {
      throw new RouteError(400, "BAD_REQUEST", "Durée maximum: 8 heures");
    }

    // Check client belongs to garage
    const client = await prisma.client.findFirst({
      where: {
        id: input.clientId,
        ...(isAdmin ? {} : { garageId: organisationId }),
        deletedAt: null,
      },
    });
    if (!client) {
      throw new RouteError(404, "NOT_FOUND", "Client introuvable");
    }

    // Check vehicle if provided
    if (input.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: input.vehicleId,
          ...(isAdmin ? {} : { garageId: organisationId }),
          deletedAt: null,
        },
      });
      if (!vehicle) {
        throw new RouteError(404, "NOT_FOUND", "Véhicule introuvable");
      }
    }

    // Check intervention if provided
    if (input.interventionId) {
      const intervention = await prisma.intervention.findFirst({
        where: {
          id: input.interventionId,
          ...(isAdmin ? {} : { garageId: organisationId }),
          deletedAt: null,
        },
      });
      if (!intervention) {
        throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
      }
    }

    // Conflict detection: check for overlapping appointments in same garage
    const conflicts = await prisma.appointment.findMany({
      where: {
        garageId: organisationId!,
        status: "SCHEDULED",
        // Overlap condition: existingStart < newEnd AND existingEnd > newStart
        startAt: { lt: input.endAt },
        endAt: { gt: input.startAt },
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

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        garageId: organisationId!,
        clientId: input.clientId,
        vehicleId: input.vehicleId || null,
        interventionId: input.interventionId || null,
        title: input.title,
        startAt: input.startAt,
        endAt: input.endAt,
        notes: input.notes || null,
        reminderPolicy: input.reminderPolicy,
        createdByUserId: user.id,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      },
    });

    // Create reminder jobs if policy is STANDARD
    if (input.reminderPolicy === "STANDARD") {
      await createAppointmentReminderJobs(organisationId!, appointment.id, input.startAt);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: organisationId!,
        userId: user.id,
        action: "APPOINTMENT_CREATED",
        entityType: "APPOINTMENT",
        entityId: appointment.id,
        metadata: {
          clientId: input.clientId,
          vehicleId: input.vehicleId || null,
          interventionId: input.interventionId || null,
          startAt: input.startAt.toISOString(),
        },
      },
    });

    return NextResponse.json({ ok: true, data: appointment }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
