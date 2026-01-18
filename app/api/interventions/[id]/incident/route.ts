/**
 * INSURANCE-INCIDENT-01: Incident Case API
 * 
 * GET  /api/interventions/[id]/incident - Get incident case for intervention
 * POST /api/interventions/[id]/incident - Create incident case for intervention
 * PATCH /api/interventions/[id]/incident - Update incident case (draft only)
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";
import { z } from "zod";
import type { IncidentType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IncidentCaseSchema = z.object({
  incidentType: z.enum([
    "ENGINE", "GEARBOX", "ELECTRICAL", "TUNING_ISSUE",
    "ACCIDENT", "WARRANTY", "CUSTOMER_COMPLAINT", "OTHER",
  ]).optional(),
  description: z.string().max(4000).optional(),
  circumstances: z.string().max(4000).optional(),
  damagesObserved: z.string().max(4000).optional(),
  customerStatement: z.string().max(4000).optional(),
  garageStatement: z.string().max(4000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await context.params;
    if (!id) throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");

    if (user.role !== "ADMIN" && user.garageId) {
      await requireFeature(user.garageId, FeatureKey.INSURANCE_DOC);
    }

    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN" 
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true, incidentCase: true },
    });

    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    return NextResponse.json(success({ incidentCase: intervention.incidentCase }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await context.params;
    if (!id) throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    await requireFeature(user.garageId, FeatureKey.INSURANCE_DOC);

    const body = await req.json().catch(() => ({}));
    const parsed = IncidentCaseSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "VALIDATION_ERROR", "Données invalides");
    }
    const data = parsed.data;

    const intervention = await prisma.intervention.findFirst({
      where: { id, garageId: user.garageId, deletedAt: null },
      include: { incidentCase: true },
    });
    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    if (intervention.incidentCase) {
      throw new RouteError(409, "CONFLICT", "Dossier incident déjà existant");
    }

    const incidentCase = await prisma.incidentCase.create({
      data: {
        garageId: user.garageId,
        interventionId: id,
        status: "DRAFT",
        incidentType: data.incidentType as IncidentType | undefined,
        description: data.description,
        circumstances: data.circumstances,
        damagesObserved: data.damagesObserved,
        customerStatement: data.customerStatement,
        garageStatement: data.garageStatement,
        createdByUserId: user.id,
      },
    });

    await addEvidenceEntry({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "snapshot",
      payload: { action: "INCIDENT_CASE_CREATED", incidentCaseId: incidentCase.id },
      context: { userId: user.id },
    });

    return NextResponse.json(success({ incidentCase }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await context.params;
    if (!id) throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    await requireFeature(user.garageId, FeatureKey.INSURANCE_DOC);

    const body = await req.json().catch(() => ({}));
    const parsed = IncidentCaseSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "VALIDATION_ERROR", "Données invalides");
    }
    const data = parsed.data;

    const intervention = await prisma.intervention.findFirst({
      where: { id, garageId: user.garageId, deletedAt: null },
      include: { incidentCase: true },
    });
    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    if (!intervention.incidentCase) {
      throw new RouteError(404, "NOT_FOUND", "Pas de dossier incident");
    }
    if (intervention.incidentCase.status !== "DRAFT") {
      throw new RouteError(400, "BAD_REQUEST", "Modification impossible après ouverture");
    }
    if (intervention.disputeStatus === "OPEN") {
      throw new RouteError(423, "LOCKED", "Litige en cours");
    }

    const updated = await prisma.incidentCase.update({
      where: { id: intervention.incidentCase.id },
      data: {
        incidentType: data.incidentType as IncidentType | undefined,
        description: data.description,
        circumstances: data.circumstances,
        damagesObserved: data.damagesObserved,
        customerStatement: data.customerStatement,
        garageStatement: data.garageStatement,
      },
    });

    await addEvidenceEntry({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "snapshot",
      payload: { action: "INCIDENT_CASE_UPDATED", incidentCaseId: updated.id },
      context: { userId: user.id },
    });

    return NextResponse.json(success({ incidentCase: updated }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
