/**
 * GET /api/interventions/[id]/insurance/pdf
 * Generate Insurance Info PDF for client
 */

import { NextResponse } from "next/server";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { failure } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { buildInsuranceInfoPdf } from "@/lib/pdf/insuranceInfo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Feature gate: INSURANCE_DOC required
    if (user.role !== "ADMIN") {
      await requireFeature(getTenantId(user), FeatureKey.INSURANCE_DOC);
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    // Verify intervention exists and belongs to user's garage
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Generate PDF
    const result = await buildInsuranceInfoPdf(id);

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.filename}"`,
        "X-PDF-Hash": result.sha256,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erreur API GET /api/interventions/[id]/insurance/pdf :", err);
    return toErrorResponse(err);
  }
}
