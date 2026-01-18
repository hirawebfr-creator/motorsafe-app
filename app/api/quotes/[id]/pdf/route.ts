import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, PLAN_LIMITS, FREE_UPGRADE_MESSAGE } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Plan } from "@/lib/guards";
import { decryptClientData } from "@/lib/encryption";
import { buildPdfBrandingContext, renderPdfLibHeader, renderPdfLibFooter } from "@/lib/pdf/branding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function safeFilePart(s: string) {
  return String(s).replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);
    
    // Feature gate: DEVIS_FACTURES required (non-admin only)
    if (!isAdmin && organisationId) {
      await requireFeature(organisationId, FeatureKey.DEVIS_FACTURES);
    }

    const { id } = await ctx.params;
    const quoteId = String(id);

    // First fetch the quote to get its organisationId (needed for plan limits)
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
      include: {
        lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        client: true,
        vehicle: true,
        organisation: true,
      },
    });

    if (!quote) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");

    const effectiveOrgId = isAdmin ? quote.organisationId : organisationId!;

    // Vérifier la limite PDF pour le plan FREE (7 jours glissants) - skip for ADMIN
    if (!isAdmin) {
      const garage = await prisma.garage.findUnique({ where: { id: effectiveOrgId } });
      const plan = (garage?.plan || "FREE") as Plan;
      const limit = PLAN_LIMITS[plan].pdfDownloadsPer7Days;

      if (limit !== Infinity) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const pdfCount = await prisma.document.count({
          where: {
            garageId: effectiveOrgId,
            type: { in: ["QUOTE_PDF", "INVOICE_PDF"] },
            createdAt: { gte: sevenDaysAgo },
          },
        });

        if (pdfCount >= limit) {
          throw new RouteError(
            403,
            "LIMIT_REACHED",
            `Limite de ${limit} téléchargements PDF par semaine atteinte. ${FREE_UPGRADE_MESSAGE}`
          );
        }
      }
    }

    // Déchiffrer les données du client
    const client = decryptClientData(quote.client as Record<string, unknown>) as typeof quote.client;

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const left = 50;
    const lineH = 14;

    // WHITE-LABEL-PARTNERS-01: Load branding and render header
    const brandingCtx = await buildPdfBrandingContext(effectiveOrgId);
    let y: number;
    
    if (brandingCtx) {
      y = await renderPdfLibHeader(page, { regular: font, bold }, brandingCtx, {
        title: "DEVIS",
        documentNumber: quote.quoteNumber ?? quote.id,
        date: new Date().toLocaleDateString("fr-FR"),
      });
      renderPdfLibFooter(page, { regular: font }, brandingCtx);
    } else {
      y = 800;
      page.drawText("MotorSafe", { x: left, y, size: 18, font: bold });
      y -= lineH;
      page.drawText(`DEVIS ${quote.quoteNumber ?? quote.id}`, { x: left, y, size: 14, font: bold });
      y -= lineH;
      page.drawText(`Date: ${new Date().toLocaleDateString("fr-FR")}`, { x: left, y, size: 12, font });
      y -= lineH + 8;
    }

    const draw = (text: string, isBold = false, size = 12) => {
      page.drawText(text, { x: left, y, size, font: isBold ? bold : font });
      y -= lineH;
    };

    draw("Client", true);
    draw(`${client.firstName} ${client.lastName}`);
    if (client.email) draw(`Email: ${client.email}`);
    if (client.phone) draw(`Tel: ${client.phone}`);
    y -= 8;

    if (quote.vehicle) {
      draw("Vehicule", true);
      draw(`${quote.vehicle.brand} ${quote.vehicle.model} - ${quote.vehicle.plate}`);
      y -= 8;
    }

    draw("Lignes", true);
    for (const l of quote.lines) {
      draw(`- ${l.description} | qte ${l.qty} | PU HT ${l.unitPriceExcl.toFixed(2)} | TVA ${(l.vatRate * 100).toFixed(1)}% | TTC ${l.lineTotalIncl.toFixed(2)}`);
      if (y < 80) {
        y = 800;
        pdf.addPage([595.28, 841.89]);
      }
    }

    y -= 10;
    draw(`Sous-total HT: ${quote.subtotalExcl.toFixed(2)} ${quote.currency}`, true);
    draw(`TVA: ${quote.totalVat.toFixed(2)} ${quote.currency}`, true);
    draw(`Total TTC: ${quote.totalIncl.toFixed(2)} ${quote.currency}`, true);

    // Footer is already added by renderPdfLibFooter if branding is available
    if (!brandingCtx) {
      page.drawText("Généré avec SafeMotor — motorsafe.fr", {
        x: left,
        y: 30,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    const bytes = await pdf.save();
    const buffer = Buffer.from(bytes);

    const fileName = `devis-${safeFilePart(quote.quoteNumber ?? quote.id)}.pdf`;

    // On Vercel serverless, we can't write to the filesystem (except /tmp)
    // So we just track the document without storing the file
    try {
      await prisma.document.create({
        data: {
          garageId: effectiveOrgId,
          type: "QUOTE_PDF",
          fileUrl: `generated:${fileName}`,
          fileName,
          mime: "application/pdf",
          size: buffer.length,
        },
      });
    } catch {
      // Ignore duplicate document errors
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
