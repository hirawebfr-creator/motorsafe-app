/**
 * LEGAL-RETENTION-01: Close dispute on intervention
 * POST /api/interventions/[id]/dispute/close
 * 
 * Unlocks the intervention after dispute resolution.
 * Records the resolution in EvidenceChain.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { addEvidenceEntry, createInterventionSnapshot } from "@/lib/legal/evidenceChain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  resolution: z.string().trim().min(5).max(2000),
});

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      throw new RouteError(400, "BAD_REQUEST", "ID invalide");
    }

    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide: résolution requise (5-2000 caractères)", parsed.error.flatten());
    }

    // Get intervention with garage check
    const intervention = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        garageId: true,
        disputeStatus: true,
        disputeOpenedAt: true,
        disputeReason: true,
        deletedAt: true,
      },
    });

    if (!intervention) {
      throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    }

    // Multi-tenant check (ADMIN can access all)
    if (user.role !== "ADMIN" && intervention.garageId !== user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Accès non autorisé");
    }

    if (intervention.deletedAt) {
      throw new RouteError(400, "BAD_REQUEST", "Intervention supprimée");
    }

    if (intervention.disputeStatus !== "OPEN") {
      throw new RouteError(400, "BAD_REQUEST", "Aucun litige ouvert sur cette intervention");
    }

    // Get IP and user agent for evidence chain
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() 
      ?? req.headers.get("x-real-ip") 
      ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    // Create final snapshot
    const snapshot = await createInterventionSnapshot(id);

    // Add to evidence chain
    const garageId = intervention.garageId ?? user.garageId ?? -1;
    await addEvidenceEntry({
      garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "dispute_close",
      payload: {
        ...snapshot,
        disputeOpenedAt: intervention.disputeOpenedAt?.toISOString(),
        disputeReason: intervention.disputeReason,
        disputeResolution: parsed.data.resolution,
      },
      context: {
        userId: user.id,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
        reason: `Résolution: ${parsed.data.resolution}`,
      },
    });

    // Unlock the intervention
    await prisma.intervention.update({
      where: { id },
      data: {
        disputeStatus: "CLOSED",
        disputeClosedAt: new Date(),
        disputeClosedBy: user.id,
        disputeResolution: parsed.data.resolution,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "DISPUTE_CLOSE",
        entityType: "intervention",
        entityId: id,
        metadata: {
          resolution: parsed.data.resolution,
          duration: intervention.disputeOpenedAt
            ? Math.round((Date.now() - intervention.disputeOpenedAt.getTime()) / 1000 / 60) + " minutes"
            : null,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Litige résolu. L'intervention peut à nouveau être modifiée.",
      data: {
        interventionId: id,
        disputeStatus: "CLOSED",
        disputeClosedAt: new Date().toISOString(),
        resolution: parsed.data.resolution,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
