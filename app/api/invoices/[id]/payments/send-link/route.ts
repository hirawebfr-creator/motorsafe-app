/**
 * PAYMENTS-01: Send payment link to client via email
 * POST /api/invoices/[id]/payments/send-link
 * 
 * Body: { payUrl?: string } (optional, uses stored link if not provided)
 * Returns: { emailSent: boolean }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey, getGarageEntitlements } from "@/lib/entitlements";
import { checkIpRateLimit } from "@/lib/rateLimit";
import { decryptClientData } from "@/lib/encryption";
import { sendPaymentLinkEmail } from "@/lib/email";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Rate limit: 5 emails per 10 minutes per garage
const RATE_LIMIT = 5;
const RATE_WINDOW_SEC = 10 * 60;

const BodySchema = z.object({
  payUrl: z.string().url().optional(),
});

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);
    
    const { id } = await ctx.params;
    const invoiceId = String(id);

    // First, fetch the invoice
    const prelimInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
      select: { organisationId: true },
    });
    if (!prelimInvoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

    const effectiveOrgId = isAdmin ? prelimInvoice.organisationId : organisationId!;

    // Feature gate
    await requireFeature(effectiveOrgId, FeatureKey.PAYMENTS);

    // Check plan allows emails
    const entitlements = await getGarageEntitlements(effectiveOrgId);
    if (entitlements.planKey === "FREE") {
      throw new RouteError(403, "PLAN_UPGRADE_REQUIRED", "L'envoi d'email nécessite un abonnement payant.");
    }

    // Rate limit
    const rl = await checkIpRateLimit(req, `payment_email:${effectiveOrgId}`, RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      throw new RouteError(429, "RATE_LIMITED", "Trop d'envois. Réessayez dans quelques minutes.");
    }

    // Validate body
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide");
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organisationId: effectiveOrgId, deletedAt: null },
        include: {
          client: true,
          organisation: { select: { name: true, displayName: true, phone: true, email: true } },
        },
      });
      if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

      // Check invoice is payable
      if (!["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)) {
        throw new RouteError(409, "CONFLICT", `Impossible d'envoyer un lien de paiement (statut: ${invoice.status})`);
      }

      // Get payment URL
      const payUrl = parsed.data.payUrl || invoice.paymentLinkUrl;
      
      if (!payUrl) {
        throw new RouteError(400, "NO_LINK", "Aucun lien de paiement. Créez d'abord un lien.");
      }

      // Check link is not expired
      if (invoice.paymentLinkExpiresAt && invoice.paymentLinkExpiresAt < new Date()) {
        throw new RouteError(409, "LINK_EXPIRED", "Le lien de paiement a expiré. Créez-en un nouveau.");
      }

      // Decrypt client data
      const client = decryptClientData(invoice.client as Record<string, unknown>) as typeof invoice.client;
      
      if (!client.email) {
        throw new RouteError(400, "NO_EMAIL", "Le client n'a pas d'adresse email.");
      }

      return { invoice, client, payUrl, organisation: invoice.organisation };
    });

    // Send email (outside transaction)
    const garageName = result.organisation.displayName || result.organisation.name || undefined;
    const remaining = result.invoice.totalIncl - result.invoice.amountPaid;

    const emailResult = await sendPaymentLinkEmail({
      to: result.client.email!,
      payUrl: result.payUrl,
      clientName: `${result.client.firstName} ${result.client.lastName}`.trim() || undefined,
      garageName,
      garagePhone: result.organisation.phone || undefined,
      garageEmail: result.organisation.email || undefined,
      invoiceNumber: result.invoice.invoiceNumber || undefined,
      amountDue: formatEur(remaining),
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: effectiveOrgId,
        userId: user.id,
        action: "INVOICE_PAYMENT_LINK_SENT",
        entityType: "Invoice",
        entityId: invoiceId,
        metadata: { 
          clientEmail: result.client.email,
          emailSent: emailResult.success,
        },
      },
    });

    if (!emailResult.success) {
      console.error("[PaymentLinkSend] Email failed:", emailResult.error);
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        emailSent: emailResult.success,
        emailError: emailResult.error,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}
