import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/interventions/[id]/signatures/new-revision
 * Create a new revision of a signed document
 * 
 * HARDEN-01: This allows correcting an intervention after signature
 * by creating a new signature request while preserving the old one
 * 
 * Flow:
 * 1. Old SignatureRequest (SIGNED) -> status becomes SUPERSEDED
 * 2. New SignatureRequest created with revision + 1
 * 3. Intervention fields are now unlocked for editing
 * 4. New signature must be obtained
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Feature gate: SIGNATURE required
    if (user.role !== "ADMIN") {
      await requireFeature(user.garageId ?? -1, FeatureKey.SIGNATURE);
    }

    const { id: interventionId } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { signatureRequestId, reason } = body;

    if (!interventionId) {
      return NextResponse.json(failure("ID intervention requis"), { status: 400 });
    }

    if (!signatureRequestId) {
      return NextResponse.json(failure("signatureRequestId requis"), { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(failure("Motif de révision requis (min 5 caractères)"), { status: 400 });
    }

    // Verify intervention exists and belongs to garage
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Get existing signature request
    const existingRequest = await prisma.signatureRequest.findFirst({
      where: {
        id: signatureRequestId,
        documentId: interventionId,
        garageId: user.garageId ?? -1,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(failure("Demande de signature introuvable"), { status: 404 });
    }

    // Can only create revision for SIGNED requests
    if (existingRequest.status !== "SIGNED") {
      return NextResponse.json(failure("Seule une demande signée peut être révisée"), { status: 400 });
    }

    const now = new Date();
    const newToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const newRevision = (existingRequest.revision || 1) + 1;

    // Transaction: mark old as SUPERSEDED, create new
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark existing as SUPERSEDED
      await tx.signatureRequest.update({
        where: { id: existingRequest.id },
        data: {
          status: "SUPERSEDED",
        },
      });

      // 2. Create audit event for supersede
      await tx.signatureEvent.create({
        data: {
          signatureRequestId: existingRequest.id,
          type: "SUPERSEDED",
          metaJson: {
            reason: reason.trim(),
            supersededByUserId: user.id,
            supersededByEmail: user.email,
          },
        },
      });

      // 3. Create new signature request with incremented revision
      const newRequest = await tx.signatureRequest.create({
        data: {
          token: newToken,
          expiresAt,
          documentType: existingRequest.documentType,
          documentId: interventionId,
          garageId: existingRequest.garageId,
          clientId: existingRequest.clientId,
          signerEmail: existingRequest.signerEmail,
          status: "DRAFT",
          revision: newRevision,
          createdByUserId: user.id,
        },
      });

      // 4. Update old request to point to new one
      await tx.signatureRequest.update({
        where: { id: existingRequest.id },
        data: {
          supersededById: newRequest.id,
        },
      });

      // 5. Create event for new revision
      await tx.signatureEvent.create({
        data: {
          signatureRequestId: newRequest.id,
          type: "CREATED",
          metaJson: {
            revision: newRevision,
            previousSignatureId: existingRequest.id,
            reason: reason.trim(),
            createdByUserId: user.id,
            createdByEmail: user.email,
          },
        },
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          garageId: intervention.garageId ?? user.garageId ?? null,
          userId: user.id,
          action: "SIGNATURE_NEW_REVISION",
          entityType: "SignatureRequest",
          entityId: newRequest.id,
          metadata: {
            interventionId,
            previousSignatureId: existingRequest.id,
            previousRevision: existingRequest.revision || 1,
            newRevision,
            reason: reason.trim(),
          },
        },
      });

      return newRequest;
    });

    return NextResponse.json(success({
      message: "Nouvelle révision créée. Vous pouvez maintenant modifier le dossier et demander une nouvelle signature.",
      newSignatureRequest: {
        id: result.id,
        token: result.token,
        revision: result.revision,
        status: result.status,
        expiresAt: result.expiresAt,
      },
      previousSignatureId: existingRequest.id,
    }));
  } catch (err) {
    console.error("Erreur API POST /api/interventions/[id]/signatures/new-revision:", err);
    return toErrorResponse(err);
  }
}
