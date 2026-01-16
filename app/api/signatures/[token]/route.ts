import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { decryptClientData } from "@/lib/encryption";
import { selectLegalModules } from "@/lib/legal/selectLegalModules";
import { isGarageSubscriptionActive } from "@/lib/guards";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 30 requests per 5 minutes per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_SEC = 5 * 60;

type Ctx = { params: Promise<{ token: string }> };

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  INTERVENTION_ORDER: "Ordre de réparation",
  INTERVENTION_DELIVERY: "PV de restitution",
  INTERVENTION_DOSSIER: "Dossier d'intervention",
  QUOTE: "Devis",
};

export async function GET(req: Request, ctx: Ctx) {
  try {
    // Rate limit check (IP-based)
    const rl = await checkIpRateLimit(req, "sign_get", RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Trop de requêtes. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { token } = await ctx.params;

    if (!token) {
      // Generic error (don't reveal token validation logic)
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 400, headers: rateLimitHeaders(rl) });
    }

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
      include: { garage: { select: { id: true, name: true, plan: true, subscriptionStatus: true } } },
    });

    if (!signatureRequest) {
      // Generic error (don't reveal if token exists or not)
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 404, headers: rateLimitHeaders(rl) });
    }

    // BILLING-GUARD-01: Check garage subscription (allow viewing already signed docs)
    if (signatureRequest.status !== "SIGNED" && !isGarageSubscriptionActive(signatureRequest.garage)) {
      return NextResponse.json(
        { ok: false, error: { code: "SUBSCRIPTION_INACTIVE", message: "Le garage n'a pas d'abonnement actif. Veuillez contacter le garage." } },
        { status: 402 }
      );
    }

    // Check if voided
    if (signatureRequest.status === "VOID") {
      return NextResponse.json(failure("Cette demande de signature a été annulée par le garage"), { status: 410 });
    }

    // Check expiration
    if (signatureRequest.expiresAt < new Date()) {
      // Update status if not already
      if (signatureRequest.status !== "EXPIRED" && signatureRequest.status !== "SIGNED") {
        await prisma.signatureRequest.update({
          where: { id: signatureRequest.id },
          data: { status: "EXPIRED" },
        });
      }
      if (signatureRequest.status !== "SIGNED") {
        return NextResponse.json(failure("Ce lien de signature a expiré. Demandez au garage de renvoyer un nouveau lien."), { status: 410 });
      }
    }

    // Get document summary (non-sensitive)
    let documentSummary: Record<string, unknown> = {};

    if (signatureRequest.documentType.startsWith("INTERVENTION_")) {
      const intervention = await prisma.intervention.findUnique({
        where: { id: signatureRequest.documentId },
        include: { vehicle: { include: { client: true } } },
      });

      if (intervention) {
        const clientDecrypted = decryptClientData(intervention.vehicle.client as Record<string, unknown>) as {
          firstName: string;
          lastName: string;
        };

        documentSummary = {
          vehiclePlate: intervention.vehicle.plate,
          vehicleBrand: intervention.vehicle.brand,
          vehicleModel: intervention.vehicle.model,
          clientName: `${clientDecrypted.firstName} ${clientDecrypted.lastName}`,
          createdAt: intervention.createdAt,
          type: intervention.type,
          tags: intervention.tags || [],
        };
      }
    } else if (signatureRequest.documentType === "QUOTE") {
      const quote = await prisma.quote.findUnique({
        where: { id: signatureRequest.documentId },
        include: { client: true, vehicle: true },
      });

      if (quote) {
        const clientDecrypted = decryptClientData(quote.client as Record<string, unknown>) as {
          firstName: string;
          lastName: string;
        };

        documentSummary = {
          quoteNumber: quote.quoteNumber,
          vehiclePlate: quote.vehicle?.plate,
          clientName: `${clientDecrypted.firstName} ${clientDecrypted.lastName}`,
          createdAt: quote.createdAt,
          totalIncl: quote.totalIncl,
        };
      }
    }

    // Build legal clauses from tags
    const tags = (documentSummary.tags as string[]) || [];
    const legalSelection = selectLegalModules(tags);

    return NextResponse.json(success({
      id: signatureRequest.id,
      documentType: signatureRequest.documentType,
      documentTypeLabel: DOCUMENT_TYPE_LABELS[signatureRequest.documentType] || signatureRequest.documentType,
      status: signatureRequest.status,
      garageName: signatureRequest.garage.name,
      expiresAt: signatureRequest.expiresAt,
      signerEmail: signatureRequest.signerEmail,
      signedAt: signatureRequest.signedAt,
      signerNameDeclared: signatureRequest.signerNameDeclared,
      documentSummary,
      pdfUrl: `/api/signatures/${token}/pdf`,
      legalClauses: legalSelection.clauses,
      legalModules: legalSelection.modules,
    }));
  } catch (err) {
    console.error("Error GET /api/signatures/[token]:", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
