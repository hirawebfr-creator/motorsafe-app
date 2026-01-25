import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, PLAN_LIMITS, FREE_UPGRADE_MESSAGE } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import type { Plan } from "@/lib/guards";
import { decryptClientData } from "@/lib/encryption";
import { buildPdfBrandingContext } from "@/lib/pdf/branding";
import { generateQuotePdf, QuotePdfData } from "@/lib/pdf/quoteTemplate";

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

    // Load branding context
    const brandingCtx = await buildPdfBrandingContext(effectiveOrgId);
    
    // Prepare PDF data
    const pdfData: QuotePdfData = {
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      createdAt: quote.createdAt,
      sentAt: quote.sentAt,
      acceptedAt: quote.acceptedAt,
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        address: (client as Record<string, unknown>).address as string | undefined,
        city: (client as Record<string, unknown>).city as string | undefined,
        postalCode: (client as Record<string, unknown>).postalCode as string | undefined,
      },
      vehicle: quote.vehicle ? {
        brand: quote.vehicle.brand,
        model: quote.vehicle.model,
        plate: quote.vehicle.plate,
        vin: quote.vehicle.vin,
        mileage: null,
      } : null,
      lines: quote.lines.map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPriceExcl: l.unitPriceExcl,
        vatRate: l.vatRate,
        lineTotalExcl: l.lineTotalExcl,
        lineVatAmount: l.lineVatAmount,
        lineTotalIncl: l.lineTotalIncl,
      })),
      subtotalExcl: quote.subtotalExcl,
      totalVat: quote.totalVat,
      totalIncl: quote.totalIncl,
      currency: quote.currency,
      organisation: {
        name: quote.organisation.name,
        displayName: quote.organisation.displayName,
        address: quote.organisation.address,
        city: null,
        postalCode: null,
        phone: quote.organisation.phone,
        email: quote.organisation.email,
        siret: quote.organisation.siret,
        vatNumber: quote.organisation.vatNumber,
      },
    };

    // Generate PDF using modern template
    const bytes = await generateQuotePdf(pdfData, brandingCtx);
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
