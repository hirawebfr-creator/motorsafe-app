import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/interventions/[id]/signatures/void
 * Void (cancel) a signature request
 * - Sets status to VOID
 * - Sets voidedAt timestamp
 * - Client will see "Cette demande a été annulée"
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

    // Verify intervention exists and belongs to garage
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Get signature request
    const signatureRequest = await prisma.signatureRequest.findFirst({
      where: {
        id: signatureRequestId,
        documentId: interventionId,
        garageId: user.garageId ?? -1,
      },
    });

    if (!signatureRequest) {
      return NextResponse.json(failure("Demande de signature introuvable"), { status: 404 });
    }

    // Cannot void if already signed
    if (signatureRequest.status === "SIGNED") {
      return NextResponse.json(failure("Impossible d'annuler une signature déjà effectuée"), { status: 400 });
    }

    // Already voided
    if (signatureRequest.status === "VOID") {
      return NextResponse.json(success({
        message: "Cette demande était déjà annulée",
        voidedAt: signatureRequest.voidedAt,
      }));
    }

    const now = new Date();

    // Update to VOID status
    await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: {
        status: "VOID",
        voidedAt: now,
      },
    });

    // Create void event
    await prisma.signatureEvent.create({
      data: {
        signatureRequestId: signatureRequest.id,
        type: "VOIDED",
        ip: null,
        userAgent: null,
        metaJson: {
          voidedBy: user.id,
          reason: reason || null,
          voidedAt: now.toISOString(),
        },
      },
    });

    return NextResponse.json(success({
      message: "Demande de signature annulée",
      voidedAt: now,
    }));
  } catch (err) {
    console.error("Error POST /api/interventions/[id]/signatures/void:", err);
    return toErrorResponse(err);
  }
}
