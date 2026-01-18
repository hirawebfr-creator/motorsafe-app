/**
 * WORKSHOP-OPS-01: Return Report (PV de restitution) API
 * 
 * GET  - Get return report for intervention
 * POST - Create return report for intervention
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const CreateSchema = z.object({
  checklistJson: z.string().optional(), // JSON string of checklist
  notes: z.string().max(2000).optional(),
  photosKeys: z.array(z.string()).max(20).optional(),
});

/**
 * GET /api/interventions/[id]/return-report
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await ctx.params;

    if (!interventionId) {
      throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    }

    // Feature gate
    if (user.role !== "ADMIN" && user.garageId) {
      await requireFeature(user.garageId, FeatureKey.RETURN_REPORT);
    }

    // Verify intervention access
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true },
    });

    if (!intervention) {
      throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    }

    // Get return report
    const returnReport = await prisma.returnReport.findUnique({
      where: { interventionId },
    });

    if (!returnReport) {
      return NextResponse.json(success({ exists: false, returnReport: null }));
    }

    return NextResponse.json(success({ exists: true, returnReport }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/interventions/[id]/return-report
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await ctx.params;

    if (!interventionId) {
      throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    }

    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    // Feature gate
    await requireFeature(user.garageId, FeatureKey.RETURN_REPORT);

    // Parse body
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Données invalides", parsed.error.flatten());
    }

    // Verify intervention access
    const intervention = await prisma.intervention.findFirst({
      where: { id: interventionId, garageId: user.garageId, deletedAt: null },
      select: { id: true, garageId: true, status: true },
    });

    if (!intervention) {
      throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    }

    // Check if return report already exists
    const existing = await prisma.returnReport.findUnique({
      where: { interventionId },
    });

    if (existing) {
      throw new RouteError(409, "CONFLICT", "Un PV de restitution existe déjà pour cette intervention");
    }

    // Create return report
    const returnReport = await prisma.returnReport.create({
      data: {
        garageId: user.garageId,
        interventionId,
        status: "DRAFT",
        checklistJson: parsed.data.checklistJson,
        notes: parsed.data.notes,
        photosKeys: parsed.data.photosKeys || [],
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: user.garageId,
        userId: user.id,
        action: "RETURN_REPORT_CREATED",
        entityType: "RETURN_REPORT",
        entityId: returnReport.id,
        metadata: { interventionId },
      },
    });

    return NextResponse.json(success({ returnReport }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
