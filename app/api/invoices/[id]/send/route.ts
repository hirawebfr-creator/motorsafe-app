import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey, getGarageEntitlements } from "@/lib/entitlements";
import { sendInvoiceEmail } from "@/lib/email";
import { decryptClientData } from "@/lib/encryption";
import { checkIpRateLimit } from "@/lib/rateLimit";
import { createHash, randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Rate limit: 10 invoice emails per 10 minutes per garage
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
    const rl = await checkIpRateLimit(req, `invoice_send:${organisationId}`, RATE_LIMIT, RATE_WINDOW_SEC);
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
    const invoiceId = String(id);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organisationId, deletedAt: null },
        include: {
          client: true,
          organisation: { select: { name: true, displayName: true, phone: true, email: true } },
        },
      });
      if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");
      
      // Can only send ISSUED invoices (not DRAFT, not PAID, not CANCELED)
      if (invoice.status !== "ISSUED" && invoice.status !== "OVERDUE" && invoice.status !== "PARTIALLY_PAID") {
        throw new RouteError(409, "CONFLICT", "Facture non envoyable (statut: " + invoice.status + ")");
      }

      // Decrypt client data
      const client = decryptClientData(invoice.client as Record<string, unknown>) as typeof invoice.client;
      
      if (!client.email) {
        throw new RouteError(400, "NO_EMAIL", "Le client n'a pas d'adresse email.");
      }

      // Create download token (7 days validity)
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Upsert token (replace any existing)
      await tx.invoiceDownloadToken.deleteMany({ where: { invoiceId } });
      await tx.invoiceDownloadToken.create({
        data: {
          invoiceId,
          tokenHash,
          expiresAt,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          garageId: organisationId,
          userId: user.id,
          action: "INVOICE_SEND",
          entityType: "Invoice",
          entityId: invoiceId,
          metadata: { clientEmail: client.email },
        },
      });

      return { invoice, client, rawToken, expiresAt, organisation: invoice.organisation };
    });

    // Send email (outside transaction)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.motorsafe.fr";
    const downloadUrl = `${baseUrl}/api/download/invoice/${result.rawToken}`;
    const garageName = result.organisation.displayName || result.organisation.name || undefined;

    const emailResult = await sendInvoiceEmail({
      to: result.client.email!,
      downloadUrl,
      clientName: `${result.client.firstName} ${result.client.lastName}`.trim() || undefined,
      garageName,
      garagePhone: result.organisation.phone || undefined,
      garageEmail: result.organisation.email || undefined,
      invoiceNumber: result.invoice.invoiceNumber || undefined,
      totalTTC: formatEur(result.invoice.totalIncl),
      dueAt: result.invoice.dueAt ? new Date(result.invoice.dueAt) : undefined,
      expiresAt: result.expiresAt,
    });

    if (!emailResult.success) {
      console.error("[InvoiceSend] Email failed:", emailResult.error);
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        id: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        emailSent: emailResult.success,
        emailError: emailResult.error,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
