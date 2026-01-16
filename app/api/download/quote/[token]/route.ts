import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { decryptClientData } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 30 requests per 10 minutes per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_SEC = 10 * 60;

type Ctx = { params: Promise<{ token: string }> };

function safeFilePart(s: string) {
  return String(s).replace(/[^a-zA-Z0-9._-]+/g, "-");
}

/**
 * GET /api/download/quote/[token]
 * Public route to download quote PDF with secure token
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    // Rate limit check (IP-based)
    const rl = await checkIpRateLimit(req, "download_quote", RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Trop de requêtes. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { token } = await ctx.params;

    if (!token || token.length < 32) {
      return NextResponse.json(
        { ok: false, error: "Lien invalide ou expiré" },
        { status: 400 }
      );
    }

    // Hash the token to find in DB
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const downloadToken = await prisma.quoteDownloadToken.findUnique({
      where: { tokenHash },
      include: {
        quote: {
          include: {
            lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
            client: true,
            vehicle: true,
            organisation: true,
          },
        },
      },
    });

    if (!downloadToken) {
      return NextResponse.json(
        { ok: false, error: "Lien invalide ou expiré" },
        { status: 404 }
      );
    }

    // Check expiration
    if (downloadToken.expiresAt < new Date()) {
      const garageName = downloadToken.quote.organisation?.displayName || 
                        downloadToken.quote.organisation?.name || 
                        "le garage";
      return NextResponse.json(
        {
          ok: false,
          error: "Ce lien a expiré",
          message: `Ce lien de téléchargement a expiré. Veuillez contacter ${garageName} pour obtenir un nouveau lien.`,
        },
        { status: 410 }
      );
    }

    // Mark token as used (first download)
    if (!downloadToken.usedAt) {
      await prisma.quoteDownloadToken.update({
        where: { id: downloadToken.id },
        data: { usedAt: new Date() },
      });
    }

    const quote = downloadToken.quote;
    
    // Decrypt client data
    const client = decryptClientData(quote.client as Record<string, unknown>) as typeof quote.client;

    // Generate PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const left = 50;
    const lineH = 14;

    const draw = (text: string, isBold = false, size = 12) => {
      page.drawText(text, { x: left, y, size, font: isBold ? bold : font });
      y -= lineH;
    };

    // Header
    const garageName = quote.organisation?.displayName || quote.organisation?.name || "MotorSafe";
    draw(garageName, true, 18);
    draw(`DEVIS ${quote.quoteNumber ?? quote.id}`, true, 14);
    draw(`Date: ${new Date(quote.createdAt).toLocaleDateString("fr-FR")}`);
    if (quote.sentAt) {
      draw(`Envoyé le: ${new Date(quote.sentAt).toLocaleDateString("fr-FR")}`);
    }
    y -= 8;

    // Client info
    draw("Client", true);
    draw(`${client.firstName} ${client.lastName}`);
    if (client.email) draw(`Email: ${client.email}`);
    if (client.phone) draw(`Tél: ${client.phone}`);
    y -= 8;

    // Vehicle info
    if (quote.vehicle) {
      draw("Véhicule", true);
      draw(`${quote.vehicle.brand} ${quote.vehicle.model} - ${quote.vehicle.plate}`);
      y -= 8;
    }

    // Lines
    draw("Prestations", true);
    for (const l of quote.lines) {
      const lineText = `- ${l.description} | Qté: ${l.qty} | PU HT: ${l.unitPriceExcl.toFixed(2)}€ | TVA: ${(l.vatRate * 100).toFixed(0)}% | TTC: ${l.lineTotalIncl.toFixed(2)}€`;
      draw(lineText);
      if (y < 100) {
        y = 800;
        pdf.addPage([595.28, 841.89]);
      }
    }

    // Totals
    y -= 10;
    draw(`Sous-total HT: ${quote.subtotalExcl.toFixed(2)} ${quote.currency}`, true);
    draw(`TVA: ${quote.totalVat.toFixed(2)} ${quote.currency}`, true);
    draw(`Total TTC: ${quote.totalIncl.toFixed(2)} ${quote.currency}`, true);

    // Footer
    y -= 20;
    draw("Ce devis est valable 30 jours.", false, 10);
    
    // Garage contact
    if (quote.organisation?.phone || quote.organisation?.email) {
      y -= 10;
      const contactParts: string[] = [];
      if (quote.organisation.phone) contactParts.push(`Tél: ${quote.organisation.phone}`);
      if (quote.organisation.email) contactParts.push(`Email: ${quote.organisation.email}`);
      draw(contactParts.join(" - "), false, 10);
    }

    const bytes = await pdf.save();
    const buffer = Buffer.from(bytes);
    const fileName = `devis-${safeFilePart(quote.quoteNumber ?? quote.id)}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[DownloadQuote] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Erreur lors du téléchargement" },
      { status: 500 }
    );
  }
}
