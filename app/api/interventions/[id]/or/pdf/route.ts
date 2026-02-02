import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { decryptClientData } from "@/lib/encryption";
import { buildPdfBrandingContext, PdfBrandingContext } from "@/lib/pdf/branding";
import { generateOrPdf, OrPdfData } from "@/lib/pdf/orTemplate";

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
    const garageId = isAdmin ? undefined : (user.garageId ?? -1);

    const { id } = await ctx.params;
    const interventionId = String(id);

    // Get intervention with repair order, vehicle, and client
    const intervention = await prisma.intervention.findFirst({
      where: isAdmin
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        repairOrder: true,
        garage: true,
      },
    });

    if (!intervention) {
      throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    }

    if (!intervention.repairOrder) {
      throw new RouteError(404, "NOT_FOUND", "Ordre de réparation introuvable");
    }

    if (!intervention.garageId) {
      throw new RouteError(400, "BAD_REQUEST", "Garage introuvable pour cette intervention");
    }

    // Parse snapshot
    interface SnapshotItem {
      id: string;
      description: string;
      qty: number;
      unitPriceExcl: number;
      vatRate: number;
    }

    interface SnapshotData {
      items: SnapshotItem[];
    }

    let snapshot: SnapshotData = { items: [] };
    if (intervention.repairOrder.snapshotJson) {
      try {
        snapshot = JSON.parse(intervention.repairOrder.snapshotJson);
      } catch {
        snapshot = { items: [] };
      }
    }

    const items = snapshot.items || [];

    // Calculate totals
    const totals = items.reduce(
      (acc, item) => {
        const lineExcl = item.qty * item.unitPriceExcl;
        const lineVat = lineExcl * item.vatRate;
        return {
          subtotalExcl: acc.subtotalExcl + lineExcl,
          totalVat: acc.totalVat + lineVat,
          totalIncl: acc.totalIncl + lineExcl + lineVat,
        };
      },
      { subtotalExcl: 0, totalVat: 0, totalIncl: 0 }
    );

    // Decrypt client data
    const client = intervention.vehicle?.client
      ? decryptClientData(intervention.vehicle.client as Record<string, unknown>)
      : null;

    // Get signature request if exists
    const signatureRequest = await prisma.signatureRequest.findFirst({
      where: {
        documentType: "INTERVENTION_ORDER",
        documentId: interventionId,
      },
      orderBy: { createdAt: "desc" },
    });

    // Determine status
    let status: "draft" | "sent" | "signed" = "draft";
    if (intervention.repairOrder.status === "SIGNED" || signatureRequest?.status === "SIGNED") {
      status = "signed";
    } else if (
      intervention.repairOrder.status === "SENT" ||
      signatureRequest?.status === "SENT" ||
      signatureRequest?.status === "VIEWED"
    ) {
      status = "sent";
    }

    // Build branding context
    const brandingCtx = await buildPdfBrandingContext(intervention.garageId);

    // Prepare PDF data
    const orNumber = `OR-${intervention.id.slice(0, 8)}`;

    const pdfData: OrPdfData = {
      orNumber,
      status,
      createdAt: intervention.repairOrder.createdAt,
      issuedAt: intervention.repairOrder.issuedAt,
      signedAt: intervention.repairOrder.signedAt || signatureRequest?.signedAt,
      signerName: client ? `${client.firstName} ${client.lastName}` : null,
      client: client
        ? {
            firstName: String(client.firstName || ""),
            lastName: String(client.lastName || ""),
            email: client.email as string | null,
            phone: client.phone as string | null,
            address: (client as Record<string, unknown>).address as string | null,
            city: (client as Record<string, unknown>).city as string | null,
            postalCode: (client as Record<string, unknown>).postalCode as string | null,
          }
        : {
            firstName: "Client",
            lastName: "Inconnu",
            email: null,
            phone: null,
            address: null,
            city: null,
            postalCode: null,
          },
      vehicle: intervention.vehicle
        ? {
            brand: intervention.vehicle.brand || "",
            model: intervention.vehicle.model || "",
            plate: intervention.vehicle.plate || "",
            vin: intervention.vehicle.vin,
            year: intervention.vehicle.year,
            color: null, // Not in schema
            fuel: intervention.vehicle.fuel,
            mileage: intervention.odometerKm,
          }
        : {
            brand: "Inconnu",
            model: "",
            plate: "",
            vin: null,
            year: null,
            color: null,
            fuel: null,
            mileage: null,
          },
      intervention: {
        id: intervention.id,
        type: intervention.type,
        title: intervention.title,
        notes: intervention.notes,
        performedAt: intervention.performedAt,
        odometerKm: intervention.odometerKm,
      },
      items: items.map((item) => ({
        description: item.description,
        qty: item.qty,
        unitPriceExcl: item.unitPriceExcl,
        vatRate: item.vatRate,
        lineTotalExcl: item.qty * item.unitPriceExcl,
        lineTotalIncl: item.qty * item.unitPriceExcl * (1 + item.vatRate),
      })),
      totals,
      organisation: intervention.garage
        ? {
            name: intervention.garage.name,
            displayName: intervention.garage.displayName,
            address: intervention.garage.address,
            addressLine1: intervention.garage.addressLine1,
            addressLine2: intervention.garage.addressLine2,
            city: intervention.garage.city,
            postalCode: intervention.garage.postalCode,
            phone: intervention.garage.phone,
            email: intervention.garage.email,
            siret: intervention.garage.siret,
            vatNumber: intervention.garage.vatNumber,
          }
        : {
            name: "Garage",
            displayName: null,
            address: null,
            addressLine1: null,
            addressLine2: null,
            city: null,
            postalCode: null,
            phone: null,
            email: null,
            siret: null,
            vatNumber: null,
          },
    };

    // Generate PDF (use default branding if none)
    const defaultBranding: PdfBrandingContext = {
      garage: {
        id: intervention.garageId,
        name: intervention.garage?.name || "Garage",
        displayName: intervention.garage?.displayName,
        logoKey: null,
        brandColor: null,
        partnerBadgeEnabled: false,
        partnerBadgeAdminOverride: "NONE",
        plan: intervention.garage?.plan || "FREE",
      },
      logoBuffer: null,
      hasBranding: false,
      showPartnerBadge: false,
      brandColor: "#4F46E5",
    };
    const bytes = await generateOrPdf(pdfData, brandingCtx || defaultBranding);
    const buffer = Buffer.from(bytes);
    const fileName = `or-${safeFilePart(orNumber)}.pdf`;

    // Track document generation
    try {
      await prisma.document.create({
        data: {
          garageId: intervention.garageId,
          interventionId: intervention.id,
          type: "INTERVENTION_REPORT",
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
