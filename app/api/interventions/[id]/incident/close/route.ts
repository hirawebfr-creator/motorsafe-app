/**
 * INSURANCE-INCIDENT-01: Close Incident Case
 * POST /api/interventions/[id]/incident/close
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { addEvidenceEntry, getEvidenceChain } from "@/lib/legal/evidenceChain";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const CloseSchema = z.object({
  resolution: z.string().max(2000).optional(),
});

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
    const parsed = CloseSchema.safeParse(body);
    if (!parsed.success) throw new RouteError(400, "VALIDATION_ERROR", "Données invalides");

    const intervention = await prisma.intervention.findFirst({
      where: { id, garageId: user.garageId, deletedAt: null },
      include: { incidentCase: true },
    });
    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    if (!intervention.incidentCase) {
      throw new RouteError(404, "NOT_FOUND", "Pas de dossier incident");
    }
    if (intervention.incidentCase.status !== "OPEN") {
      throw new RouteError(400, "BAD_REQUEST", "Le dossier doit être OPEN pour être clôturé");
    }

    // Get evidence chain snapshot
    const evidenceChain = await getEvidenceChain({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
    });

    const updated = await prisma.incidentCase.update({
      where: { id: intervention.incidentCase.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        evidenceSummaryJson: evidenceChain,
      },
    });

    await addEvidenceEntry({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "snapshot",
      payload: { 
        action: "INCIDENT_CASE_CLOSED", 
        incidentCaseId: updated.id,
        resolution: parsed.data.resolution,
        evidenceCount: evidenceChain.length,
      },
      context: { userId: user.id },
    });

    return NextResponse.json(success({ incidentCase: updated }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
