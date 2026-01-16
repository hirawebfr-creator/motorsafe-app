import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { join } from "path";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 30 requests per 10 minutes per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_SEC = 10 * 60;

type Ctx = { params: Promise<{ token: string }> };

/**
 * GET /api/download/pdf/[token]
 * Public route to download signed PDF with secure token
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    // Rate limit check (IP-based)
    const rl = await checkIpRateLimit(req, "download_pdf", RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Trop de requêtes. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { token } = await ctx.params;

    if (!token || token.length < 32) {
      // Generic error
      return NextResponse.json(
        { ok: false, error: "Lien invalide ou expiré" },
        { status: 400 }
      );
    }

    // Hash the token to find in DB
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const downloadToken = await prisma.downloadToken.findUnique({
      where: { tokenHash },
      include: {
        intervention: {
          include: {
            garage: {
              select: { name: true, displayName: true, phone: true, email: true },
            },
          },
        },
      },
    });

    if (!downloadToken) {
      // Generic error (don't reveal if token exists)
      return NextResponse.json(
        { ok: false, error: "Lien invalide ou expiré" },
        { status: 404 }
      );
    }

    // Check expiration
    if (downloadToken.expiresAt < new Date()) {
      const garageName = downloadToken.intervention.garage?.displayName || downloadToken.intervention.garage?.name || "le garage";
      return NextResponse.json(
        {
          ok: false,
          error: "Ce lien a expiré",
          message: `Ce lien de téléchargement a expiré. Veuillez contacter ${garageName} pour obtenir un nouveau lien.`,
        },
        { status: 410 }
      );
    }

    // Check purpose
    if (downloadToken.purpose !== "SIGNED_PDF") {
      return NextResponse.json(
        { ok: false, error: "Lien invalide pour ce type de téléchargement" },
        { status: 400 }
      );
    }

    // Find the signed PDF from SignatureRequest
    const signatureRequest = await prisma.signatureRequest.findFirst({
      where: {
        documentId: downloadToken.interventionId,
        status: "SIGNED",
        signedPdfKey: { not: null },
      },
      orderBy: { signedAt: "desc" },
    });

    if (!signatureRequest?.signedPdfKey) {
      return NextResponse.json(
        { ok: false, error: "Document signé introuvable" },
        { status: 404 }
      );
    }

    // Read the signed PDF from local storage
    const pdfPath = join(process.cwd(), "uploads", signatureRequest.signedPdfKey);
    let pdfBuffer: Buffer;
    
    try {
      pdfBuffer = await readFile(pdfPath);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Fichier introuvable sur le serveur" },
        { status: 404 }
      );
    }

    // Mark as used (first download)
    if (!downloadToken.usedAt) {
      await prisma.downloadToken.update({
        where: { id: downloadToken.id },
        data: { usedAt: new Date() },
      });
    }

    // Return PDF
    const filename = `document_signe_${downloadToken.interventionId.slice(-8)}.pdf`;
    
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("Error GET /api/download/pdf/[token]:", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
