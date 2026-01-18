/**
 * LEGAL-RETENTION-01: Open dispute on intervention
 * POST /api/interventions/[id]/dispute/open
 * 
 * Locks the intervention for editing (tamper-evident mode).
 * Creates a snapshot in EvidenceChain for legal purposes.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { 
  addEvidenceEntry, 
  createInterventionSnapshot 
} from "@/lib/legal/evidenceChain";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  reason: z.string().trim().min(5).max(1000),
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
      throw new RouteError(400, "BAD_REQUEST", "Body invalide: raison requise (5-1000 caractères)", parsed.error.flatten());
    }

    // Get intervention with garage check
    const intervention = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        garageId: true,
        status: true,
        disputeStatus: true,
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

    if (intervention.disputeStatus === "OPEN") {
      throw new RouteError(400, "BAD_REQUEST", "Un litige est déjà ouvert sur cette intervention");
    }

    // Get IP and user agent for evidence chain
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() 
      ?? req.headers.get("x-real-ip") 
      ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    // Create intervention snapshot BEFORE locking
    const snapshot = await createInterventionSnapshot(id);
    const snapshotJson = JSON.stringify(snapshot, Object.keys(snapshot).sort());
    const snapshotHash = createHash("sha256").update(snapshotJson, "utf8").digest("hex");

    // Add to evidence chain
    const garageId = intervention.garageId ?? user.garageId ?? -1;
    await addEvidenceEntry({
      garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "dispute_open",
      payload: snapshot,
      context: {
        userId: user.id,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
        reason: parsed.data.reason,
      },
    });

    // Lock the intervention
    await prisma.intervention.update({
      where: { id },
      data: {
        disputeStatus: "OPEN",
        disputeOpenedAt: new Date(),
        disputeOpenedBy: user.id,
        disputeReason: parsed.data.reason,
        disputeSnapshotHash: snapshotHash,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "DISPUTE_OPEN",
        entityType: "intervention",
        entityId: id,
        metadata: {
          reason: parsed.data.reason,
          snapshotHash,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Litige ouvert. L'intervention est verrouillée et ne peut plus être modifiée.",
      data: {
        interventionId: id,
        disputeStatus: "OPEN",
        disputeOpenedAt: new Date().toISOString(),
        snapshotHash,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
