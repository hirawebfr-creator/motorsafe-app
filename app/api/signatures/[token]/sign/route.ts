import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { buildOrderMasterPdf } from "@/lib/pdf/orderMaster";
import { buildLegalSnapshot } from "@/lib/legal/selectLegalModules";
import { isGarageSubscriptionActive } from "@/lib/guards";
import { sendSignatureConfirmationEmail } from "@/lib/email";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { randomBytes, createHash } from "crypto";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { cancelPendingJobs } from "@/lib/automations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 10 requests per 10 minutes per IP (stricter for POST)
const RATE_LIMIT = 10;
const RATE_WINDOW_SEC = 10 * 60;

type Ctx = { params: Promise<{ token: string }> };

// Generate a secure random token and its hash
function generateDownloadToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

// Local storage path for signed PDFs
const SIGNED_PDF_DIR = join(process.cwd(), "uploads", "signed");

export async function POST(req: Request, ctx: Ctx) {
  try {
    // Rate limit check (IP-based, stricter for signature)
    const rl = await checkIpRateLimit(req, "sign_complete", RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Trop de tentatives. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { token } = await ctx.params;

    if (!token) {
      // Generic error
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 400 });
    }

    const body = await req.json();
    const { signerName, signerEmail, accepted, signatureImage } = body;

    if (!signerName || typeof signerName !== "string" || signerName.trim().length < 2) {
      return NextResponse.json(failure("Nom et prénom requis (min 2 caractères)"), { status: 400 });
    }

    if (accepted !== true) {
      return NextResponse.json(failure("Vous devez accepter les termes pour signer"), { status: 400 });
    }

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
      include: { garage: { select: { id: true, plan: true, subscriptionStatus: true } } },
    });

    if (!signatureRequest) {
      // Generic error (don't reveal if token exists)
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 404 });
    }

    // BILLING-GUARD-01: Check garage subscription before allowing signature
    if (!isGarageSubscriptionActive(signatureRequest.garage)) {
      return NextResponse.json(
        { ok: false, error: { code: "SUBSCRIPTION_INACTIVE", message: "Le garage n'a pas d'abonnement actif. Veuillez contacter le garage." } },
        { status: 402 }
      );
    }

    // Check expiration
    if (signatureRequest.expiresAt < new Date()) {
      await prisma.signatureRequest.update({
        where: { id: signatureRequest.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(failure("Ce lien de signature a expiré"), { status: 410 });
    }

    // Idempotence: if already signed, return existing data
    if (signatureRequest.status === "SIGNED") {
      return NextResponse.json(success({
        status: "SIGNED",
        signedAt: signatureRequest.signedAt,
        signedPdfUrl: signatureRequest.signedPdfUrl || `/api/signatures/${token}/pdf`,
        message: "Ce document a déjà été signé",
      }));
    }

    // Check if declined
    if (signatureRequest.status === "DECLINED") {
      return NextResponse.json(failure("Cette demande a été refusée"), { status: 400 });
    }

    // Get IP and User-Agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const signedAt = new Date();

    // Fetch intervention tags for legal snapshot
    let interventionTags: string[] = [];
    if (signatureRequest.documentType.startsWith("INTERVENTION_")) {
      const intervention = await prisma.intervention.findUnique({
        where: { id: signatureRequest.documentId },
        select: { tags: true },
      });
      interventionTags = intervention?.tags || [];
    }

    // Build legal snapshot for audit trail
    const legalSnapshot = buildLegalSnapshot(interventionTags);

    // Generate the signed PDF with signature embedded
    let signedPdfHash: string | null = null;
    let signedPdfKey: string | null = null;
    let signedPdfUrl: string | null = null;

    if (signatureRequest.documentType.startsWith("INTERVENTION_")) {
      try {
        const result = await buildOrderMasterPdf(signatureRequest.documentId, {
          signerName: signerName.trim(),
          signedAt,
          signatureImage: signatureImage || undefined,
          showSignedWatermark: true,
        });

        signedPdfHash = result.sha256;

        // Store the signed PDF locally
        if (!existsSync(SIGNED_PDF_DIR)) {
          await mkdir(SIGNED_PDF_DIR, { recursive: true });
        }

        const pdfFilename = `${signatureRequest.id}_${Date.now()}.pdf`;
        const pdfPath = join(SIGNED_PDF_DIR, pdfFilename);
        await writeFile(pdfPath, result.pdfBuffer);

        signedPdfKey = `signed/${pdfFilename}`;
        signedPdfUrl = `/api/signatures/${token}/pdf`;

        console.log(`[Signature] PDF signé stocké: ${pdfPath} (hash: ${signedPdfHash.substring(0, 16)}...)`);
      } catch (pdfErr) {
        console.error("[Signature] Erreur génération PDF signé:", pdfErr);
        // Continue without PDF - signature is still valid
      }
    }

    // Update signature request
    const updated = await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: {
        status: "SIGNED",
        signerNameDeclared: signerName.trim(),
        signerEmail: signerEmail?.trim() || signatureRequest.signerEmail,
        signedAt,
        signedPdfHash,
        signedPdfKey,
        signedPdfUrl,
        legalSnapshotJson: legalSnapshot.json,
        legalSnapshotHash: legalSnapshot.hash,
      },
    });

    // Update Quote status to ACCEPTED when client signs
    if (signatureRequest.documentType === "QUOTE") {
      await prisma.quote.update({
        where: { id: signatureRequest.documentId },
        data: {
          status: "ACCEPTED",
          acceptedAt: signedAt,
          signedAt,
          signedByName: signerName.trim(),
          signatureData: signatureImage || null,
          signedByIp: ip,
        },
      });
    }

    // Update EvidenceCaptureSession status when intake/delivery PV is signed
    if (signatureRequest.documentType === "INTERVENTION_INTAKE") {
      await prisma.evidenceCaptureSession.updateMany({
        where: {
          interventionId: signatureRequest.documentId,
          step: "INTAKE",
        },
        data: {
          status: "SIGNED",
          intakeCompletedAt: signedAt,
        },
      });
      console.log(`[Signature] Updated INTAKE session status to SIGNED for intervention ${signatureRequest.documentId}`);
    }

    if (signatureRequest.documentType === "INTERVENTION_DELIVERY") {
      await prisma.evidenceCaptureSession.updateMany({
        where: {
          interventionId: signatureRequest.documentId,
          step: "DELIVERY",
        },
        data: {
          status: "SIGNED",
          deliveryCompletedAt: signedAt,
        },
      });
      console.log(`[Signature] Updated DELIVERY session status to SIGNED for intervention ${signatureRequest.documentId}`);
    }

    // Create signed event with full audit trail
    await prisma.signatureEvent.create({
      data: {
        signatureRequestId: signatureRequest.id,
        type: "SIGNED",
        ip,
        userAgent,
        metaJson: {
          signerName: signerName.trim(),
          signerEmail: signerEmail?.trim() || null,
          pdfHash: signatureRequest.pdfHash,
          signedPdfHash,
          documentType: signatureRequest.documentType,
          documentId: signatureRequest.documentId,
          timestamp: signedAt.toISOString(),
          hasSignatureImage: !!signatureImage,
          legalSnapshotHash: legalSnapshot.hash,
          interventionTags,
        },
      },
    });

    // ============================================================
    // LEGAL-PACK-01: Create ConsentRecord for audit trail
    // ============================================================
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const userAgentHash = createHash("sha256").update(userAgent).digest("hex");
    const emailToHash = signerEmail?.trim() || signatureRequest.signerEmail || "";
    const emailHash = emailToHash ? createHash("sha256").update(emailToHash.toLowerCase()).digest("hex") : null;
    
    // Build consent hash for integrity verification
    const consentData = JSON.stringify({
      signatureRequestId: signatureRequest.id,
      acceptedAt: signedAt.toISOString(),
      ipHash,
      userAgentHash,
      emailHash,
      legalSnapshotHash: legalSnapshot.hash,
    });
    const consentHash = createHash("sha256").update(consentData).digest("hex");

    // Extract legal docs from snapshot for consent record
    let legalDocsAccepted: { slug: string; version: string }[] = [];
    try {
      const snapshotParsed = JSON.parse(legalSnapshot.json);
      if (snapshotParsed.modules && Array.isArray(snapshotParsed.modules)) {
        legalDocsAccepted = snapshotParsed.modules.map((m: string) => ({
          slug: m,
          version: snapshotParsed.version || "1.0.0",
        }));
      }
    } catch {
      // Snapshot parsing failed, continue without legal docs
    }

    await prisma.consentRecord.create({
      data: {
        signatureRequestId: signatureRequest.id,
        legalDocsAccepted,
        acceptedAt: signedAt,
        ipHash,
        userAgentHash,
        emailHash,
        signatureMethod: "EMAIL_LINK",
        consentHash,
      },
    });

    // ============================================================
    // NOTIF-CLIENT-01: Send confirmation email with download links
    // ============================================================
    const finalSignerEmail = signerEmail?.trim() || signatureRequest.signerEmail;
    
    if (finalSignerEmail && signatureRequest.documentType.startsWith("INTERVENTION_")) {
      try {
        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.motorsafe.fr";
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Generate download tokens (upsert to handle retries)
        const pdfToken = generateDownloadToken();
        const zipToken = generateDownloadToken();

        await prisma.downloadToken.upsert({
          where: { interventionId_purpose: { interventionId: signatureRequest.documentId, purpose: "SIGNED_PDF" } },
          create: {
            interventionId: signatureRequest.documentId,
            purpose: "SIGNED_PDF",
            tokenHash: pdfToken.hash,
            expiresAt,
          },
          update: {
            tokenHash: pdfToken.hash,
            expiresAt,
            usedAt: null,
          },
        });

        await prisma.downloadToken.upsert({
          where: { interventionId_purpose: { interventionId: signatureRequest.documentId, purpose: "DOSSIER_ZIP" } },
          create: {
            interventionId: signatureRequest.documentId,
            purpose: "DOSSIER_ZIP",
            tokenHash: zipToken.hash,
            expiresAt,
          },
          update: {
            tokenHash: zipToken.hash,
            expiresAt,
            usedAt: null,
          },
        });

        // Get garage info for email
        const garage = await prisma.garage.findUnique({
          where: { id: signatureRequest.garageId },
          select: { name: true, displayName: true, phone: true, email: true },
        });

        const garageName = garage?.displayName || garage?.name || undefined;

        // Build download URLs
        const signedPdfUrl = `${appUrl}/api/download/pdf/${pdfToken.token}`;
        const dossierZipUrl = `${appUrl}/api/download/zip/${zipToken.token}`;

        // Send confirmation email
        await sendSignatureConfirmationEmail({
          to: finalSignerEmail,
          clientName: signerName.trim(),
          garageName,
          garagePhone: garage?.phone || undefined,
          garageEmail: garage?.email || undefined,
          signedPdfUrl,
          dossierZipUrl,
          expiresAt,
        });

        // Create audit event for email sent
        await prisma.signatureEvent.create({
          data: {
            signatureRequestId: signatureRequest.id,
            type: "CONFIRMATION_EMAIL_SENT",
            ip,
            userAgent,
            metaJson: {
              recipientEmail: finalSignerEmail,
              pdfTokenCreated: true,
              zipTokenCreated: true,
              expiresAt: expiresAt.toISOString(),
            },
          },
        });

        console.log(`[Signature] Confirmation email sent to ${finalSignerEmail}`);
      } catch (emailErr) {
        // Log but don't fail the signature
        console.error("[Signature] Failed to send confirmation email:", emailErr);
      }
    }

    // AUTOMATIONS-01: Cancel pending reminder jobs for this signature
    try {
      await cancelPendingJobs("signature_request", signatureRequest.id);
    } catch (cancelErr) {
      console.warn("[Signature] Failed to cancel reminder jobs:", cancelErr);
    }

    return NextResponse.json(success({
      status: "SIGNED",
      signedAt: updated.signedAt,
      signedPdfUrl: signedPdfUrl || `/api/signatures/${token}/pdf`,
      signedPdfHash,
      message: "Document signé avec succès",
    }));
  } catch (err) {
    console.error("Error POST /api/signatures/[token]/sign:", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
