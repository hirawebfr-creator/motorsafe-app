/**
 * AUTOMATIONS-01: Notification settings API
 * 
 * GET - Fetch notification settings for current garage
 * PUT - Update notification settings
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { getNotificationSettings, updateNotificationSettings } from "@/lib/automations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  signatureReminders: z.boolean().optional(),
  quoteReminders: z.boolean().optional(),
  invoiceReminders: z.boolean().optional(),
  quotaAlerts: z.boolean().optional(),
  appointmentsReminders: z.boolean().optional(),
  dailyEmailLimit: z.number().int().min(1).max(500).optional(),
});

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // ADMIN cannot access this - must be a garage
    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Cette route est réservée aux garages.");
    }

    const settings = await getNotificationSettings(user.garageId);

    return NextResponse.json({
      ok: true,
      data: {
        signatureReminders: settings.signatureReminders,
        quoteReminders: settings.quoteReminders,
        invoiceReminders: settings.invoiceReminders,
        quotaAlerts: settings.quotaAlerts,
        appointmentsReminders: settings.appointmentsReminders,
        dailyEmailLimit: settings.dailyEmailLimit,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // ADMIN cannot access this - must be a garage
    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Cette route est réservée aux garages.");
    }

    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide", parsed.error.flatten());
    }

    const settings = await updateNotificationSettings(user.garageId, parsed.data);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        garageId: user.garageId,
        userId: user.id,
        action: "NOTIFICATION_SETTINGS_UPDATE",
        entityType: "GarageNotificationSettings",
        entityId: settings.id,
        metadata: parsed.data,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        signatureReminders: settings.signatureReminders,
        quoteReminders: settings.quoteReminders,
        invoiceReminders: settings.invoiceReminders,
        quotaAlerts: settings.quotaAlerts,
        appointmentsReminders: settings.appointmentsReminders,
        dailyEmailLimit: settings.dailyEmailLimit,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
