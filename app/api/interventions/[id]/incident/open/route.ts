/**
 * INSURANCE-INCIDENT-01: Open Incident Case
 * POST /api/interventions/[id]/incident/open
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await context.params;
    if (!id) throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    await requireFeature(user.garageId, FeatureKey.INSURANCE_DOC);

    const intervention = await prisma.intervention.findFirst({
      where: { id, garageId: user.garageId, deletedAt: null },
      include: { incidentCase: true },
    });
    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    if (!intervention.incidentCase) {
      throw new RouteError(404, "NOT_FOUND", "Pas de dossier incident");
    }
    if (intervention.incidentCase.status !== "DRAFT") {
      throw new RouteError(400, "BAD_REQUEST", "Dossier déjà ouvert ou clôturé");
    }

    const ic = intervention.incidentCase;
    if (!ic.incidentType) {
      throw new RouteError(400, "BAD_REQUEST", "Type d'incident requis");
    }
    if (!ic.description || ic.description.trim().length < 10) {
      throw new RouteError(400, "BAD_REQUEST", "Description requise (min 10 car.)");
    }

    const updated = await prisma.incidentCase.update({
      where: { id: ic.id },
      data: { status: "OPEN", openedAt: new Date() },
    });

    await addEvidenceEntry({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "snapshot",
      payload: { action: "INCIDENT_CASE_OPENED", incidentCaseId: ic.id, type: ic.incidentType },
      context: { userId: user.id },
    });

    return NextResponse.json(success({ incidentCase: updated }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
