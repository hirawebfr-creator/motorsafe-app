import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { randomBytes } from "crypto";
import { sendSignatureEmail } from "@/lib/email";
import { decryptClientData } from "@/lib/encryption";
import { checkInterventionRateLimit, checkGarageRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Token TTL in days (default 7)
const TOKEN_TTL_DAYS = parseInt(process.env.SIGN_TOKEN_TTL_DAYS || "7", 10);

// Anti-spam: max resends per intervention
const RESEND_PER_INTERVENTION_LIMIT = 3;
const RESEND_PER_INTERVENTION_WINDOW_SEC = 60 * 60; // 1 hour

// Anti-spam: max emails per garage per day
const EMAIL_PER_GARAGE_LIMIT = 50;
const EMAIL_PER_GARAGE_WINDOW_SEC = 24 * 60 * 60; // 24 hours

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * POST /api/interventions/[id]/signatures/resend
 * Resend signature request email
 * - If token still valid: resend same link
 * - If expired: generate new token, mark old as EXPIRED, send new link
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Feature gate: SIGNATURE required
    if (user.role !== "ADMIN") {
      await requireFeature(getTenantId(user), FeatureKey.SIGNATURE);
    }

    const { id: interventionId } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { signatureRequestId } = body;

    if (!interventionId) {
      return NextResponse.json(failure("ID intervention requis"), { status: 400 });
    }

    if (!signatureRequestId) {
      return NextResponse.json(failure("signatureRequestId requis"), { status: 400 });
    }

    // Anti-spam: check per-intervention resend limit (3/hour)
    const rlIntervention = await checkInterventionRateLimit(
      interventionId, 
      "resend_email", 
      RESEND_PER_INTERVENTION_LIMIT, 
      RESEND_PER_INTERVENTION_WINDOW_SEC
    );
    if (!rlIntervention.allowed) {
      return NextResponse.json(
        { ok: false, error: { 
          code: "RATE_LIMITED", 
          message: `Maximum ${RESEND_PER_INTERVENTION_LIMIT} renvois par heure atteint pour cette intervention` 
        }},
        { status: 429, headers: rateLimitHeaders(rlIntervention) }
      );
    }

    // Anti-spam: check per-garage daily limit (50/day)
    const rlGarage = await checkGarageRateLimit(
      user.garageId ?? -1,
      "resend_email",
      EMAIL_PER_GARAGE_LIMIT,
      EMAIL_PER_GARAGE_WINDOW_SEC
    );
    if (!rlGarage.allowed) {
      return NextResponse.json(
        { ok: false, error: { 
          code: "RATE_LIMITED", 
          message: `Limite quotidienne de ${EMAIL_PER_GARAGE_LIMIT} emails de rappel atteinte` 
        }},
        { status: 429, headers: rateLimitHeaders(rlGarage) }
      );
    }

    // Verify intervention exists and belongs to garage
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId: user.garageId ?? -1, deletedAt: null },
      include: { vehicle: { include: { client: true } }, garage: true },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Get client info for email
    const clientDecrypted = decryptClientData(intervention.vehicle.client as Record<string, unknown>) as { 
      email?: string; firstName?: string; lastName?: string 
    };
    const clientEmail = clientDecrypted.email || null;
    const clientName = [clientDecrypted.firstName, clientDecrypted.lastName].filter(Boolean).join(" ") || null;
    const garageName = intervention.garage?.name || null;

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

    // Cannot resend if already signed
    if (signatureRequest.status === "SIGNED") {
      return NextResponse.json(failure("Cette demande a déjà été signée"), { status: 400 });
    }

    // Cannot resend if voided
    if (signatureRequest.status === "VOID") {
      return NextResponse.json(failure("Cette demande a été annulée"), { status: 400 });
    }

    const now = new Date();
    const isExpired = signatureRequest.expiresAt < now;

    let resultToken = signatureRequest.token;
    let resultExpiresAt = signatureRequest.expiresAt;
    let newRequestId: string | null = null;

    if (isExpired) {
      // Mark old as EXPIRED
      await prisma.signatureRequest.update({
        where: { id: signatureRequest.id },
        data: { status: "EXPIRED" },
      });

      // Create new request with new token
      const newToken = generateToken();
      const newExpiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

      const newRequest = await prisma.signatureRequest.create({
        data: {
          token: newToken,
          expiresAt: newExpiresAt,
          documentType: signatureRequest.documentType,
          documentId: signatureRequest.documentId,
          garageId: signatureRequest.garageId,
          clientId: signatureRequest.clientId,
          status: "SENT",
          pdfHash: signatureRequest.pdfHash,
          pdfRoute: signatureRequest.pdfRoute,
          signerEmail: signatureRequest.signerEmail,
          createdByUserId: user.id,
          sentAt: now,
        },
      });

      // Create events for new request
      await prisma.signatureEvent.createMany({
        data: [
          { signatureRequestId: newRequest.id, type: "CREATED", ip: null, userAgent: null },
          { signatureRequestId: newRequest.id, type: "SENT", ip: null, userAgent: null, metaJson: { resendFromId: signatureRequest.id } },
        ],
      });

      resultToken = newToken;
      resultExpiresAt = newExpiresAt;
      newRequestId = newRequest.id;
    } else {
      // Same token still valid, just update sentAt and add event
      await prisma.signatureRequest.update({
        where: { id: signatureRequest.id },
        data: { sentAt: now, status: "SENT" },
      });

      await prisma.signatureEvent.create({
        data: {
          signatureRequestId: signatureRequest.id,
          type: "SENT",
          ip: null,
          userAgent: null,
          metaJson: { resend: true, resentAt: now.toISOString() },
        },
      });
    }

    // Build signing URL
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const signingUrl = `${appUrl}/sign/${resultToken}`;

    // Send email to client if email is available
    let emailSent = false;
    let emailError: string | null = null;
    const recipientEmail = clientEmail || signatureRequest.signerEmail;
    if (recipientEmail) {
      const emailResult = await sendSignatureEmail({
        to: recipientEmail,
        signingUrl,
        clientName: clientName || undefined,
        garageName: garageName || undefined,
        documentType: signatureRequest.documentType,
        expiresAt: resultExpiresAt,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error || null;
      
      if (!emailResult.success) {
        console.warn(`[Signature Resend] Email failed for ${recipientEmail}: ${emailResult.error}`);
      }
    }

    return NextResponse.json(success({
      signingUrl,
      token: resultToken,
      expiresAt: resultExpiresAt,
      wasExpired: isExpired,
      newRequestId,
      emailSent,
      emailError,
      message: isExpired
        ? "Nouveau lien généré (l'ancien était expiré)"
        : emailSent 
          ? "Email renvoyé avec succès"
          : "Lien renvoyé (email non envoyé)",
    }));
  } catch (err) {
    console.error("Error POST /api/interventions/[id]/signatures/resend:", err);
    return toErrorResponse(err);
  }
}
