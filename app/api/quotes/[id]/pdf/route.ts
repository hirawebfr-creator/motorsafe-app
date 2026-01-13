import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantId, PLAN_LIMITS, FREE_UPGRADE_MESSAGE } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { Plan } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function safeFilePart(s: string) {
  return String(s).replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);

    // Vérifier la limite PDF pour le plan FREE (7 jours glissants)
    const garage = await prisma.garage.findUnique({ where: { id: organisationId } });
    const plan = (garage?.plan || "FREE") as Plan;
    const limit = PLAN_LIMITS[plan].pdfDownloadsPer7Days;

    if (limit !== Infinity) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const pdfCount = await prisma.document.count({
        where: {
          garageId: organisationId,
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

    const { id } = await ctx.params;
    const quoteId = String(id);

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, organisationId, deletedAt: null },
      include: {
        lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        client: true,
        vehicle: true,
        organisation: true,
      },
    });

    if (!quote) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");

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

    draw("MotorSafe", true, 18);
    draw(`DEVIS ${quote.quoteNumber ?? quote.id}`, true, 14);
    draw(`Date: ${new Date().toLocaleDateString("fr-FR")}`);
    y -= 8;

    draw("Client", true);
    draw(`${quote.client.firstName} ${quote.client.lastName}`);
    if (quote.client.email) draw(`Email: ${quote.client.email}`);
    if (quote.client.phone) draw(`Tel: ${quote.client.phone}`);
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

    const bytes = await pdf.save();
    const buffer = Buffer.from(bytes);

    // Store in local uploads and create Document entry.
    const uploadsDir = path.join(process.cwd(), "uploads", "pdf");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `devis-${safeFilePart(quote.quoteNumber ?? quote.id)}.pdf`;
    const key = `pdf/${fileName}`;
    const fullPath = path.join(process.cwd(), "uploads", key);

    await writeFile(fullPath, buffer);

    const fileUrl = `/api/uploads/file/${key}`;

    await prisma.document.create({
      data: {
        garageId: organisationId,
        type: "QUOTE_PDF",
        fileUrl,
        fileName,
        mime: "application/pdf",
        size: buffer.length,
      },
    });

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
