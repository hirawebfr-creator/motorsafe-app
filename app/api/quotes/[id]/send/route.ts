import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey, getGarageEntitlements } from "@/lib/entitlements";
import { sendQuoteEmail } from "@/lib/email";
import { decryptClientData } from "@/lib/encryption";
import { checkIpRateLimit } from "@/lib/rateLimit";
import { createHash, randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Rate limit: 10 quote emails per 10 minutes per garage
const RATE_LIMIT = 10;
const RATE_WINDOW_SEC = 10 * 60;

function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);
    
    // Feature gate: DEVIS_FACTURES required
    if (user.role !== "ADMIN") {
      await requireFeature(organisationId, FeatureKey.DEVIS_FACTURES);
    }

    // Rate limit check (per garage)
    const rl = await checkIpRateLimit(req, `quote_send:${organisationId}`, RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      throw new RouteError(429, "RATE_LIMITED", "Trop d'envois. Réessayez dans quelques minutes.");
    }

    // Check if plan allows sending emails (FREE plan cannot send emails)
    const entitlements = await getGarageEntitlements(organisationId);
    const canSendEmail = entitlements.planKey !== "FREE";
    if (!canSendEmail) {
      throw new RouteError(403, "PLAN_UPGRADE_REQUIRED", "L'envoi d'email nécessite un abonnement payant.");
    }

    const { id } = await ctx.params;
    const quoteId = String(id);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const quote = await tx.quote.findFirst({
        where: { id: quoteId, organisationId, deletedAt: null },
        include: {
          client: true,
          organisation: { select: { name: true, displayName: true, phone: true, email: true } },
        },
      });
      if (!quote) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");
      if (quote.status !== "DRAFT" && quote.status !== "SENT") {
        throw new RouteError(409, "CONFLICT", "Devis non envoyable (statut: " + quote.status + ")");
      }

      // Decrypt client data
      const client = decryptClientData(quote.client as Record<string, unknown>) as typeof quote.client;
      
      if (!client.email) {
        throw new RouteError(400, "NO_EMAIL", "Le client n'a pas d'adresse email.");
      }

      // Create download token (7 days validity)
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Upsert token (replace any existing)
      await tx.quoteDownloadToken.deleteMany({ where: { quoteId } });
      await tx.quoteDownloadToken.create({
        data: {
          quoteId,
          tokenHash,
          expiresAt,
        },
      });

      // Update quote status
      const updated = await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          garageId: organisationId,
          userId: user.id,
          action: "QUOTE_SEND",
          entityType: "Quote",
          entityId: quoteId,
          metadata: { clientEmail: client.email },
        },
      });

      return { quote: updated, client, rawToken, expiresAt, organisation: quote.organisation };
    });

    // Send email (outside transaction)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.motorsafe.fr";
    const downloadUrl = `${baseUrl}/api/download/quote/${result.rawToken}`;
    const garageName = result.organisation.displayName || result.organisation.name || undefined;

    const emailResult = await sendQuoteEmail({
      to: result.client.email!,
      downloadUrl,
      clientName: `${result.client.firstName} ${result.client.lastName}`.trim() || undefined,
      garageName,
      garagePhone: result.organisation.phone || undefined,
      garageEmail: result.organisation.email || undefined,
      quoteNumber: result.quote.quoteNumber || undefined,
      totalTTC: formatEur(result.quote.totalIncl),
      expiresAt: result.expiresAt,
    });

    if (!emailResult.success) {
      console.error("[QuoteSend] Email failed:", emailResult.error);
      // Don't throw - quote is already marked as sent
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        ...result.quote,
        emailSent: emailResult.success,
        emailError: emailResult.error,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
