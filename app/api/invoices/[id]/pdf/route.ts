import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, PLAN_LIMITS, FREE_UPGRADE_MESSAGE } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import type { Plan } from "@/lib/guards";
import { decryptClientData } from "@/lib/encryption";
import { buildPdfBrandingContext } from "@/lib/pdf/branding";
import { generateInvoicePdf, InvoicePdfData } from "@/lib/pdf/invoiceTemplate";

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
    const invoiceId = String(id);

    // First fetch the invoice to get its organisationId (needed for plan limits)
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
      include: {
        lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        client: true,
        vehicle: true,
        organisation: true,
      },
    });

    if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

    const effectiveOrgId = isAdmin ? invoice.organisationId : organisationId!;

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
    const client = decryptClientData(invoice.client as Record<string, unknown>) as typeof invoice.client;

    // WHITE-LABEL-PARTNERS-01: Load branding
    const brandingCtx = await buildPdfBrandingContext(effectiveOrgId);

    // Build data for the modern invoice template
    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueAt,
      paidAt: invoice.paidAt,
      
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: null,
        postalCode: null,
      },
      
      vehicle: invoice.vehicle ? {
        brand: invoice.vehicle.brand,
        model: invoice.vehicle.model,
        plate: invoice.vehicle.plate,
        vin: invoice.vehicle.vin,
        mileage: null,
      } : null,
      
      lines: invoice.lines.map(l => ({
        description: l.description,
        qty: l.qty,
        unitPriceExcl: Number(l.unitPriceExcl),
        vatRate: Number(l.vatRate),
        lineTotalExcl: Number(l.lineTotalExcl),
        lineVatAmount: Number(l.lineVatAmount),
        lineTotalIncl: Number(l.lineTotalIncl),
      })),
      
      subtotalExcl: Number(invoice.subtotalExcl),
      totalVat: Number(invoice.totalVat),
      totalIncl: Number(invoice.totalIncl),
      amountPaid: Number(invoice.amountPaid),
      currency: invoice.currency,
      
      organisation: {
        name: invoice.organisation.name,
        displayName: invoice.organisation.displayName,
        address: invoice.organisation.address,
        city: null,
        postalCode: null,
        phone: invoice.organisation.phone,
        email: invoice.organisation.email,
        siret: invoice.organisation.siret,
        vatNumber: invoice.organisation.vatNumber,
        iban: null,
        bic: null,
      },
    };

    // Generate the modern PDF
    const bytes = await generateInvoicePdf(pdfData, brandingCtx);
    const buffer = Buffer.from(bytes);

    const fileName = `facture-${safeFilePart(invoice.invoiceNumber ?? invoice.id)}.pdf`;

    // On Vercel serverless, we can't write to the filesystem (except /tmp)
    // So we just track the document without storing the file
    try {
      await prisma.document.create({
        data: {
          garageId: effectiveOrgId,
          type: "INVOICE_PDF",
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
