import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { randomBytes, createHash } from "crypto";
import { decryptClientData } from "@/lib/encryption";
import { sendSignatureEmail, getGarageLogoUrl } from "@/lib/email";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { createSignatureReminderJobs } from "@/lib/automations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 10 signature emails per 10 minutes per garage
const RATE_LIMIT = 10;
const RATE_WINDOW_SEC = 10 * 60;

// Token TTL in days (default 7)
const TOKEN_TTL_DAYS = parseInt(process.env.SIGN_TOKEN_TTL_DAYS || "7", 10);

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function generatePdfHash(pdfRoute: string, req: Request): Promise<string | null> {
  try {
    // Build internal URL to fetch PDF
    const origin = new URL(req.url).origin;
    const pdfUrl = `${origin}${pdfRoute}`;
    
    // Forward auth cookies
    const cookies = req.headers.get("cookie") || "";
    const res = await fetch(pdfUrl, {
      headers: { cookie: cookies },
    });
    
    if (!res.ok) return null;
    
    const buffer = await res.arrayBuffer();
    return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
  } catch (err) {
    console.error("Error generating PDF hash:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Rate limit check (per garage)
    const garageIdForRateLimit = user.garageId ?? 0;
    const rl = await checkIpRateLimit(req, `signature_start:${garageIdForRateLimit}`, RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Trop de demandes de signature. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }
    
    // Feature gate: SIGNATURE required
    if (user.role !== "ADMIN") {
      await requireFeature(getTenantId(user), FeatureKey.SIGNATURE);
    }

    const body = await req.json();
    const { documentType, documentId } = body;

    if (!documentType || !documentId) {
      return NextResponse.json(failure("documentType et documentId requis"), { status: 400 });
    }

    const validTypes = ["INTERVENTION_ORDER", "INTERVENTION_DELIVERY", "INTERVENTION_DOSSIER", "QUOTE"];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(failure("Type de document invalide"), { status: 400 });
    }

    // Build PDF route based on document type
    let pdfRoute: string;
    let clientId: number | null = null;
    let clientEmail: string | null = null;
    let clientName: string | null = null;
    let garageName: string | null = null;
    let effectiveGarageId: number | null = null;
    let garageLogoKey: string | null = null; // WHITE-LABEL-PARTNERS-01

    if (documentType === "INTERVENTION_ORDER") {
      pdfRoute = `/api/interventions/${documentId}/order/pdf`;
    } else if (documentType === "INTERVENTION_DELIVERY") {
      pdfRoute = `/api/interventions/${documentId}/delivery/pdf`;
    } else if (documentType === "INTERVENTION_DOSSIER") {
      pdfRoute = `/api/interventions/${documentId}/pdf`;
    } else if (documentType === "QUOTE") {
      pdfRoute = `/api/quotes/${documentId}/pdf`;
    } else {
      return NextResponse.json(failure("Type non supporté"), { status: 400 });
    }

    // Verify access to document and get client info
    if (documentType.startsWith("INTERVENTION_")) {
      const intervention = await prisma.intervention.findFirst({
        where: user.role === "ADMIN"
          ? { id: documentId, deletedAt: null }
          : { id: documentId, garageId: user.garageId ?? -1, deletedAt: null },
        include: { vehicle: { include: { client: true } }, garage: true },
      });

      if (!intervention) {
        return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
      }

      // Check delivery requires closed intervention
      if (documentType === "INTERVENTION_DELIVERY" && !intervention.closedAt) {
        return NextResponse.json(failure("L'intervention doit être clôturée pour le PV de restitution"), { status: 400 });
      }

      clientId = intervention.vehicle.client.id;
      const clientDecrypted = decryptClientData(intervention.vehicle.client as Record<string, unknown>) as { email?: string; firstName?: string; lastName?: string };
      clientEmail = clientDecrypted.email || null;
      clientName = [clientDecrypted.firstName, clientDecrypted.lastName].filter(Boolean).join(" ") || null;
      garageName = intervention.garage?.name || null;
      garageLogoKey = intervention.garage?.logoKey || null; // WHITE-LABEL-PARTNERS-01
      effectiveGarageId = intervention.garageId;

      // CLIENT-EMAIL-REQUIRED-01: Block signature if client email is missing
      if (!clientEmail) {
        return NextResponse.json(
          { ok: false, error: { code: "CLIENT_EMAIL_REQUIRED", message: "L'email du client est requis pour envoyer une demande de signature.", clientId } },
          { status: 400 }
        );
      }
    } else if (documentType === "QUOTE") {
      const quote = await prisma.quote.findFirst({
        where: user.role === "ADMIN"
          ? { id: documentId }
          : { id: documentId, organisationId: user.garageId ?? -1 },
        include: { client: true, organisation: true },
      });

      if (!quote) {
        return NextResponse.json(failure("Devis introuvable"), { status: 404 });
      }

      clientId = quote.clientId;
      const clientDecrypted = decryptClientData(quote.client as Record<string, unknown>) as { email?: string; firstName?: string; lastName?: string };
      clientEmail = clientDecrypted.email || null;
      clientName = [clientDecrypted.firstName, clientDecrypted.lastName].filter(Boolean).join(" ") || null;
      garageName = quote.organisation?.name || null;
      garageLogoKey = quote.organisation?.logoKey || null; // WHITE-LABEL-PARTNERS-01
      effectiveGarageId = quote.organisationId;

      // CLIENT-EMAIL-REQUIRED-01: Block signature if client email is missing
      if (!clientEmail) {
        return NextResponse.json(
          { ok: false, error: { code: "CLIENT_EMAIL_REQUIRED", message: "L'email du client est requis pour envoyer une demande de signature.", clientId } },
          { status: 400 }
        );
      }
    }

    // Generate PDF hash
    const pdfHash = await generatePdfHash(pdfRoute, req);

    // Generate unique token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    // Determine garageId: use from document if ADMIN (since admin has no garageId)
    const signatureGarageId = effectiveGarageId ?? user.garageId;
    if (!signatureGarageId) {
      return NextResponse.json(failure("Garage non déterminé pour la signature"), { status: 400 });
    }

    // Create signature request
    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        token,
        expiresAt,
        documentType: documentType as any,
        documentId,
        garageId: signatureGarageId,
        clientId,
        status: "SENT",
        pdfHash,
        pdfRoute,
        signerEmail: clientEmail,
        createdByUserId: user.id,
      },
    });

    // Create events
    await prisma.signatureEvent.createMany({
      data: [
        { signatureRequestId: signatureRequest.id, type: "CREATED", ip: null, userAgent: null },
        { signatureRequestId: signatureRequest.id, type: "SENT", ip: null, userAgent: null },
      ],
    });

    // Build signing URL
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const signingUrl = `${appUrl}/sign/${token}`;

    // Send email to client if email is available
    let emailSent = false;
    let emailError: string | null = null;
    if (clientEmail) {
      const emailResult = await sendSignatureEmail({
        to: clientEmail,
        signingUrl,
        clientName: clientName || undefined,
        garageName: garageName || undefined,
        documentType,
        expiresAt,
        garageLogoUrl: getGarageLogoUrl(effectiveGarageId, !!garageLogoKey), // WHITE-LABEL-PARTNERS-01
      });
      emailSent = emailResult.success;
      emailError = emailResult.error || null;
      
      if (!emailResult.success) {
        console.warn(`[Signature] Email failed for ${clientEmail}: ${emailResult.error}`);
      }
    }

    // AUTOMATIONS-01: Create reminder jobs for this signature
    try {
      await createSignatureReminderJobs(signatureGarageId, signatureRequest.id, new Date());
    } catch (jobErr) {
      console.warn("[Signature] Failed to create reminder jobs:", jobErr);
    }

    return NextResponse.json(success({
      requestId: signatureRequest.id,
      signingUrl,
      token,
      expiresAt: signatureRequest.expiresAt,
      clientEmail,
      emailSent,
      emailError,
    }));
  } catch (err) {
    console.error("Error POST /api/signatures/start:", err);
    return toErrorResponse(err);
  }
}
