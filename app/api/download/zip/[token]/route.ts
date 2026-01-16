import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { buildOrderMasterPdf } from "@/lib/pdf/orderMaster";
import { readFile } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { PassThrough } from "stream";
import { Buffer } from "buffer";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 30 requests per 10 minutes per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_SEC = 10 * 60;

type Ctx = { params: Promise<{ token: string }> };

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function fetchFileBuffer(fileUrl: string): Promise<Buffer | null> {
  try {
    if (fileUrl.startsWith("/api/uploads/file/")) {
      const key = fileUrl.replace("/api/uploads/file/", "");
      const abs = path.join(process.cwd(), "uploads", key);
      return await readFile(abs);
    }
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      const res = await fetch(fileUrl);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * GET /api/download/zip/[token]
 * Public route to download intervention dossier ZIP with secure token
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    // Rate limit check (IP-based)
    const rl = await checkIpRateLimit(req, "download_zip", RATE_LIMIT, RATE_WINDOW_SEC);
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
              select: { id: true, name: true, displayName: true, phone: true, email: true },
            },
            vehicle: {
              select: { plate: true, brand: true, model: true },
            },
            documents: true,
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
    if (downloadToken.purpose !== "DOSSIER_ZIP") {
      return NextResponse.json(
        { ok: false, error: "Lien invalide pour ce type de téléchargement" },
        { status: 400 }
      );
    }

    const intervention = downloadToken.intervention;
    const id = intervention.id;

    // Mark as used (first download)
    if (!downloadToken.usedAt) {
      await prisma.downloadToken.update({
        where: { id: downloadToken.id },
        data: { usedAt: new Date() },
      });
    }

    // Get signature requests for this intervention
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: { documentId: id },
      include: { events: true },
      orderBy: { createdAt: "desc" },
    });

    const signedSig = signatureRequests
      .filter((s) => s.status === "SIGNED" && s.signedPdfKey)
      .sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];

    // Build ZIP
    const passThrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    passThrough.on("data", (chunk) => chunks.push(chunk));
    archive.pipe(passThrough);

    const files: { path: string; sha256: string }[] = [];

    // 01_document_signe.pdf
    if (signedSig?.signedPdfKey) {
      try {
        const signedPdfBuffer = await fetchFileBuffer(`/api/uploads/file/${signedSig.signedPdfKey}`);
        if (signedPdfBuffer) {
          const filePath = "01_documents/01_document_signe.pdf";
          archive.append(signedPdfBuffer, { name: filePath });
          files.push({ path: filePath, sha256: signedSig.signedPdfHash || sha256(signedPdfBuffer) });
        }
      } catch {
        // Continue
      }
    } else {
      // Generate preview if not signed
      try {
        const orderPdf = await buildOrderMasterPdf(id);
        const filePath = "01_documents/01_ordre_reparation.pdf";
        archive.append(orderPdf.pdfBuffer, { name: filePath });
        files.push({ path: filePath, sha256: orderPdf.sha256 });
      } catch {
        // Continue
      }
    }

    // 02_pieces_jointes
    let pieceIndex = 0;
    for (const doc of intervention.documents) {
      try {
        const buffer = await fetchFileBuffer(doc.fileUrl);
        if (buffer) {
          pieceIndex++;
          const safeName = doc.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = `02_pieces_jointes/${String(pieceIndex).padStart(2, "0")}_${safeName}`;
          archive.append(buffer, { name: filePath });
          files.push({ path: filePath, sha256: sha256(buffer) });
        }
      } catch {
        // Continue
      }
    }

    // hashes.txt
    const hashesContent = files.map((f) => `${f.sha256}  ${f.path}`).join("\n");
    archive.append(hashesContent, { name: "hashes.txt" });

    await archive.finalize();

    // Wait for all chunks
    await new Promise<void>((resolve) => {
      passThrough.on("end", () => resolve());
    });

    const zipBuffer = Buffer.concat(chunks);
    const plate = intervention.vehicle?.plate?.replace(/[^a-zA-Z0-9]/g, "") || "NA";
    const filename = `dossier_${plate}_${id.slice(-8)}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("Error GET /api/download/zip/[token]:", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
