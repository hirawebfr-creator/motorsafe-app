/**
 * LEGAL-RETENTION-01: GDPR Client Anonymization
 * POST /api/clients/[id]/anonymize
 * 
 * Anonymizes client PII while preserving accounting records (legal requirement).
 * - Replaces firstName, lastName, email, phone, address, notes with "Client anonymisé"
 * - Keeps accounting docs (quotes, invoices) for 10-year retention
 * - Records the action in EvidenceChain for legal traceability
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { addEvidenceEntry, createClientSnapshot } from "@/lib/legal/evidenceChain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  confirm: z.literal(true),
  reason: z.string().trim().min(5).max(1000),
});

// Anonymized values (consistent, auditable)
const ANONYMIZED_VALUE = "Client anonymisé";
const ANONYMIZED_EMAIL = "anonymise@rgpd.local";

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: idParam } = await ctx.params;
    const clientId = parseInt(idParam, 10);

    if (isNaN(clientId)) {
      throw new RouteError(400, "BAD_REQUEST", "ID client invalide");
    }

    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide: confirm=true et reason requis", parsed.error.flatten());
    }

    // Get client with garage check
    const client = await prisma.client.findFirst({
      where: user.role === "ADMIN"
        ? { id: clientId, deletedAt: null }
        : { id: clientId, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicles: { select: { id: true } },
        quotes: { select: { id: true, status: true } },
        invoices: { select: { id: true, status: true } },
      },
    });

    if (!client) {
      throw new RouteError(404, "NOT_FOUND", "Client introuvable");
    }

    // Check if already anonymized
    if (client.anonymizedAt) {
      throw new RouteError(400, "BAD_REQUEST", `Client déjà anonymisé le ${client.anonymizedAt.toLocaleDateString("fr-FR")}`);
    }

    // Check for open interventions (cannot anonymize if work in progress)
    const openInterventions = await prisma.intervention.count({
      where: {
        vehicle: { clientId },
        deletedAt: null,
        status: { in: ["DRAFT", "OPEN"] },
      },
    });

    if (openInterventions > 0) {
      throw new RouteError(400, "BAD_REQUEST", `Impossible d'anonymiser: ${openInterventions} intervention(s) en cours`);
    }

    // Check for pending payments
    const pendingPayments = await prisma.payment.count({
      where: {
        OR: [
          { invoiceId: { in: client.invoices.map(i => i.id) } },
        ],
        status: { notIn: ["COMPLETED", "REFUNDED", "CANCELED"] },
      },
    });

    if (pendingPayments > 0) {
      throw new RouteError(400, "BAD_REQUEST", `Impossible d'anonymiser: ${pendingPayments} paiement(s) en attente`);
    }

    // Get IP for evidence chain
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() 
      ?? req.headers.get("x-real-ip") 
      ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;
    const garageId = client.garageId ?? user.garageId ?? -1;

    // Create snapshot BEFORE anonymization for legal record
    const snapshot = await createClientSnapshot(clientId);

    // Add to evidence chain
    await addEvidenceEntry({
      garageId,
      entityType: "client",
      entityId: String(clientId),
      eventType: "anonymize",
      payload: {
        ...snapshot,
        anonymizationReason: parsed.data.reason,
        anonymizedBy: user.id,
        anonymizedAt: new Date().toISOString(),
      },
      context: {
        userId: user.id,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
        reason: parsed.data.reason,
      },
    });

    // Perform anonymization
    await prisma.client.update({
      where: { id: clientId },
      data: {
        firstName: ANONYMIZED_VALUE,
        lastName: ANONYMIZED_VALUE,
        email: ANONYMIZED_EMAIL,
        phone: null,
        address: null,
        notes: `[RGPD] Données anonymisées le ${new Date().toLocaleDateString("fr-FR")}. Raison: ${parsed.data.reason}`,
        anonymizedAt: new Date(),
        anonymizedBy: user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "CLIENT_ANONYMIZE_GDPR",
        entityType: "client",
        entityId: String(clientId),
        metadata: {
          reason: parsed.data.reason,
          vehicleCount: client.vehicles.length,
          quoteCount: client.quotes.length,
          invoiceCount: client.invoices.length,
          // Note: no PII in audit log
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Client anonymisé avec succès. Les documents comptables sont conservés conformément aux obligations légales (10 ans).",
      data: {
        clientId,
        anonymizedAt: new Date().toISOString(),
        preservedRecords: {
          quotes: client.quotes.length,
          invoices: client.invoices.length,
        },
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
