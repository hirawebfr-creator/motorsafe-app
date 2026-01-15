import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { buildOrderMasterPdf } from "@/lib/pdf/orderMaster";
import { buildLegalSnapshot } from "@/lib/legal/selectLegalModules";
import { isGarageSubscriptionActive } from "@/lib/guards";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

// Local storage path for signed PDFs
const SIGNED_PDF_DIR = join(process.cwd(), "uploads", "signed");

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;

    if (!token) {
      return NextResponse.json(failure("Token manquant"), { status: 400 });
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
      return NextResponse.json(failure("Demande de signature introuvable"), { status: 404 });
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
