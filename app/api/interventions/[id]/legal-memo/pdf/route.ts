import { NextResponse } from "next/server";
import { failure } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { buildLegalMemoPdf } from "@/lib/pdf/legalMemo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/interventions/[id]/legal-memo/pdf
 * Generate Legal Memo PDF for an intervention (PRO only)
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Feature gate: LEGAL_MEMO required (PRO plan only)
    if (user.role !== "ADMIN") {
      await requireFeature(user.garageId ?? -1, FeatureKey.LEGAL_MEMO);
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const result = await buildLegalMemoPdf(id);

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.filename}"`,
        "Content-Length": String(result.pdfBuffer.length),
        "X-PDF-Hash": result.sha256,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("Error GET /api/interventions/[id]/legal-memo/pdf:", err);
    return toErrorResponse(err);
  }
}
