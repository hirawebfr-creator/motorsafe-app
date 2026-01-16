import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { buildOrderMasterPdf } from "@/lib/pdf/orderMaster";
import { isGarageSubscriptionActive } from "@/lib/guards";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 30 requests per 5 minutes per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_SEC = 5 * 60;

type Ctx = { params: Promise<{ token: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    // Rate limit check (IP-based)
    const rl = await checkIpRateLimit(req, "sign_pdf", RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Trop de requêtes. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { token } = await ctx.params;

    if (!token) {
      // Generic error
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 400 });
    }

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
      include: { garage: { select: { id: true, plan: true, subscriptionStatus: true } } },
    });

    if (!signatureRequest) {
      // Generic error (don't reveal if token exists)
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 404 });
    }

    // BILLING-GUARD-01: Check garage subscription (allow viewing already signed docs)
    if (signatureRequest.status !== "SIGNED" && !isGarageSubscriptionActive(signatureRequest.garage)) {
      return NextResponse.json(
        { ok: false, error: { code: "SUBSCRIPTION_INACTIVE", message: "Le garage n'a pas d'abonnement actif." } },
        { status: 402 }
      );
    }

    // Check expiration
    if (signatureRequest.expiresAt < new Date()) {
      return NextResponse.json(failure("Ce lien de signature a expiré"), { status: 410 });
    }

    // Only support INTERVENTION_ORDER for now (the master document)
    if (!signatureRequest.documentType.startsWith("INTERVENTION_")) {
      return NextResponse.json(failure("Type de document non supporté pour l'aperçu PDF"), { status: 400 });
    }

    // Generate PDF using the shared function
    try {
      const result = await buildOrderMasterPdf(signatureRequest.documentId, {
        // For preview, don't include signature
        showSignedWatermark: signatureRequest.status === "SIGNED",
        signerName: signatureRequest.status === "SIGNED" ? signatureRequest.signerNameDeclared || undefined : undefined,
        signedAt: signatureRequest.status === "SIGNED" && signatureRequest.signedAt ? signatureRequest.signedAt : undefined,
      });

      return new NextResponse(new Uint8Array(result.pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${result.filename}"`,
          "Cache-Control": "private, no-store",
          "X-PDF-Hash": result.sha256,
        },
      });
    } catch (pdfErr) {
      console.error("PDF generation error:", pdfErr);
      return NextResponse.json(failure("Erreur lors de la génération du PDF"), { status: 500 });
    }
  } catch (err) {
    console.error("Error GET /api/signatures/[token]/pdf:", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
