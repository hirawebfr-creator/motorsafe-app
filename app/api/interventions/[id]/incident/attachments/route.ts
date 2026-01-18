/**
 * INSURANCE-INCIDENT-01: Incident Attachments
 * POST /api/interventions/[id]/incident/attachments - Add attachment
 * DELETE /api/interventions/[id]/incident/attachments - Remove attachment (DRAFT only)
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const AttachmentSchema = z.object({
  key: z.string().min(1).max(500),
  filename: z.string().max(200).optional(),
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
    const parsed = AttachmentSchema.safeParse(body);
    if (!parsed.success) throw new RouteError(400, "VALIDATION_ERROR", "Clé requise");
    const { key, filename } = parsed.data;

    const intervention = await prisma.intervention.findFirst({
      where: { id, garageId: user.garageId, deletedAt: null },
      include: { incidentCase: true },
    });
    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    if (!intervention.incidentCase) {
      throw new RouteError(404, "NOT_FOUND", "Pas de dossier incident");
    }

    const ic = intervention.incidentCase;
    if (ic.status === "CLOSED") {
      throw new RouteError(400, "BAD_REQUEST", "Ajout impossible sur dossier clôturé");
    }
    if (ic.attachmentKeys.includes(key)) {
      throw new RouteError(409, "CONFLICT", "Pièce jointe déjà présente");
    }

    const updated = await prisma.incidentCase.update({
      where: { id: ic.id },
      data: { attachmentKeys: { push: key } },
    });

    await addEvidenceEntry({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "snapshot",
      payload: { action: "INCIDENT_ATTACHMENT_ADDED", key, filename, total: updated.attachmentKeys.length },
      context: { userId: user.id },
    });

    return NextResponse.json(success({ incidentCase: updated }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await context.params;
    if (!id) throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    await requireFeature(user.garageId, FeatureKey.INSURANCE_DOC);

    const body = await req.json().catch(() => ({}));
    const parsed = AttachmentSchema.safeParse(body);
    if (!parsed.success) throw new RouteError(400, "VALIDATION_ERROR", "Clé requise");
    const { key } = parsed.data;

    const intervention = await prisma.intervention.findFirst({
      where: { id, garageId: user.garageId, deletedAt: null },
      include: { incidentCase: true },
    });
    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    if (!intervention.incidentCase) {
      throw new RouteError(404, "NOT_FOUND", "Pas de dossier incident");
    }

    const ic = intervention.incidentCase;
    if (ic.status !== "DRAFT") {
      throw new RouteError(400, "BAD_REQUEST", "Suppression impossible après ouverture");
    }
    if (!ic.attachmentKeys.includes(key)) {
      throw new RouteError(404, "NOT_FOUND", "Pièce jointe introuvable");
    }

    const updated = await prisma.incidentCase.update({
      where: { id: ic.id },
      data: { attachmentKeys: ic.attachmentKeys.filter(k => k !== key) },
    });

    await addEvidenceEntry({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "snapshot",
      payload: { action: "INCIDENT_ATTACHMENT_REMOVED", key, total: updated.attachmentKeys.length },
      context: { userId: user.id },
    });

    return NextResponse.json(success({ incidentCase: updated }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
