/**
 * PAYMENTS-01: Create Stripe Checkout Session for invoice payment
 * POST /api/invoices/[id]/payments/create-link
 * 
 * Body: { type: "FULL" | "DEPOSIT", amountCents?: number }
 * Returns: { payUrl, expiresAt, paymentId }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { requirePermission, Permission } from "@/lib/permissions";
import { getStripe } from "@/lib/stripe";
import { checkIpRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Rate limit: 5 payment links per 10 minutes per garage (prevent abuse)
const RATE_LIMIT = 5;
const RATE_WINDOW_SEC = 10 * 60;

const BodySchema = z.object({
  type: z.enum(["FULL", "DEPOSIT"]),
  amountCents: z.coerce.number().int().positive().optional(),
});

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // MULTI-USER-ROLES-01: Only OWNER/MANAGER can create payment links
    await requirePermission(user, Permission.PAYMENTS_MANAGE);
    
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);
    
    const { id } = await ctx.params;
    const invoiceId = String(id);

    // First, fetch the invoice to get its organisationId
    const prelimInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
      select: { organisationId: true },
    });
    if (!prelimInvoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

    const effectiveOrgId = isAdmin ? prelimInvoice.organisationId : organisationId!;

    // Feature gate: PAYMENTS required (PRO only)
    await requireFeature(effectiveOrgId, FeatureKey.PAYMENTS);

    // Also check DEVIS_FACTURES (base requirement)
    await requireFeature(effectiveOrgId, FeatureKey.DEVIS_FACTURES);

    // Rate limit check
    const rl = await checkIpRateLimit(req, `payment_link:${effectiveOrgId}`, RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      throw new RouteError(429, "RATE_LIMITED", "Trop de liens créés. Réessayez dans quelques minutes.");
    }

    // Validate body
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide", parsed.error.flatten());
    }

    const { type, amountCents } = parsed.data;

    // Execute in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organisationId: effectiveOrgId, deletedAt: null },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          organisation: { select: { name: true, displayName: true, stripeCustomerId: true } },
        },
      });
      if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

      // Can only create payment links for ISSUED, PARTIALLY_PAID, or OVERDUE invoices
      if (!["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)) {
        throw new RouteError(409, "CONFLICT", `Impossible de créer un lien de paiement (statut: ${invoice.status})`);
      }

      // Calculate amount
      const totalRemainingCents = Math.round((invoice.totalIncl - invoice.amountPaid) * 100);
      
      if (totalRemainingCents <= 0) {
        throw new RouteError(409, "CONFLICT", "Cette facture est déjà entièrement payée");
      }

      let paymentAmountCents: number;
      
      if (type === "FULL") {
        paymentAmountCents = totalRemainingCents;
      } else {
        // DEPOSIT
        if (!amountCents) {
          throw new RouteError(400, "BAD_REQUEST", "Le montant de l'acompte est requis");
        }
        if (amountCents > totalRemainingCents) {
          throw new RouteError(400, "BAD_REQUEST", `L'acompte ne peut pas dépasser le restant dû (${(totalRemainingCents / 100).toFixed(2)}€)`);
        }
        paymentAmountCents = amountCents;
      }

      // Create Stripe Checkout Session
      const stripe = getStripe();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.motorsafe.fr";
      const garageName = invoice.organisation.displayName || invoice.organisation.name || "Garage";
      const invoiceLabel = invoice.invoiceNumber || invoiceId.slice(0, 8);
      
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: type === "FULL" 
                  ? `Facture ${invoiceLabel}` 
                  : `Acompte facture ${invoiceLabel}`,
                description: `${garageName} - Paiement ${type === "FULL" ? "total" : "partiel"}`,
              },
              unit_amount: paymentAmountCents,
            },
            quantity: 1,
          },
        ],
        customer_email: invoice.client.email || undefined,
        metadata: {
          invoiceId: invoice.id,
          garageId: String(effectiveOrgId),
          paymentType: type,
          source: "motorsafe",
        },
        success_url: `${appUrl}/factures/${invoice.id}?payment=success`,
        cancel_url: `${appUrl}/factures/${invoice.id}?payment=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      });

      if (!session.url) {
        throw new RouteError(500, "STRIPE_ERROR", "Impossible de créer le lien de paiement");
      }

      // Create pending payment record
      const payment = await tx.payment.create({
        data: {
          organisationId: effectiveOrgId,
          invoiceId: invoice.id,
          amount: paymentAmountCents / 100,
          method: "STRIPE",
          status: "PENDING",
          paymentType: type,
          stripeCheckoutSessionId: session.id,
          currency: "eur",
        },
      });

      // Update invoice with payment link info
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paymentLinkUrl: session.url,
          paymentLinkExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          garageId: effectiveOrgId,
          userId: user.id,
          action: "INVOICE_PAYMENT_LINK_CREATED",
          entityType: "Invoice",
          entityId: invoice.id,
          metadata: { 
            paymentId: payment.id,
            type, 
            amountCents: paymentAmountCents,
            checkoutSessionId: session.id,
          },
        },
      });

      return {
        payUrl: session.url,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        paymentId: payment.id,
        amountCents: paymentAmountCents,
      };
    });

    return NextResponse.json({ 
      ok: true, 
      data: result,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
