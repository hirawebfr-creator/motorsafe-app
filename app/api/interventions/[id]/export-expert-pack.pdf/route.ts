/**
 * INSURANCE-READY-EXPORT-03: Expert Pack PDF Download
 * GET /api/interventions/[id]/export-expert-pack.pdf
 *
 * Generates a comprehensive PDF dossier for insurance experts.
 * PRO plan only feature.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { hasFeature, FeatureKey } from "@/lib/entitlements";
import { buildExpertPackData } from "@/lib/export/expertPack";
import { generateExpertDossierPdf } from "@/lib/pdf/expertDossier";
import { verifyEvidenceChain } from "@/lib/legal/evidenceChain";
import { decryptClientData } from "@/lib/encryption";
import path from "path";
import { readFile } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function fetchPhotoBuffer(fileUrl: string): Promise<Buffer | null> {
  try {
    if (fileUrl.startsWith("/api/uploads/file/")) {
      const key = fileUrl.replace("/api/uploads/file/", "");
      const abs = path.join(process.cwd(), "uploads", key);
      return await readFile(abs);
    }
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      const res = await fetch(fileUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    // Direct key
    const abs = path.join(process.cwd(), fileUrl);
    return await readFile(abs);
  } catch {
    return null;
  }
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    // Check PRO feature gate
    if (user.garageId && !(await hasFeature(user.garageId, FeatureKey.EXPERT_PACK))) {
      throw new RouteError(403, "PLAN_REQUIRED", "Le Dossier Expert nécessite le plan PRO (129€/mois)");
    }

    // Only OWNER, ADMIN or GARAGE can export
    if (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "GARAGE") {
      throw new RouteError(403, "FORBIDDEN", "Seul le propriétaire peut exporter le dossier expert");
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    // Fetch intervention with all needed data
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      select: {
        id: true,
        garageId: true,
        createdAt: true,
        performedAt: true,
        closedAt: true,
        odometerKm: true,
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            vin: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        garage: {
          select: {
            id: true,
            name: true,
            displayName: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            city: true,
            phone: true,
            email: true,
            siret: true,
            logoKey: true,
          },
        },
        returnReport: {
          select: { notes: true },
        },
      },
    });

    if (!intervention || !intervention.garage) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    const garageId = intervention.garageId!;

    // Build expert pack data
    const packData = await buildExpertPackData(id, garageId);
    if (!packData) {
      return NextResponse.json(failure("Impossible de générer les données du dossier"), { status: 500 });
    }

    // Verify evidence chain
    const chainResult = await verifyEvidenceChain({ garageId, entityType: "intervention", entityId: id });

    // Decrypt client name if needed
    let clientName = "Client";
    if (intervention.vehicle.client) {
      try {
        const decrypted = await decryptClientData(intervention.vehicle.client);
        clientName = `${decrypted.firstName || ""} ${decrypted.lastName || ""}`.trim() || "Client";
      } catch {
        clientName = `${intervention.vehicle.client.firstName || ""} ${intervention.vehicle.client.lastName || ""}`.trim() || "Client";
      }
    }

    // Generate reference (use intervention ID prefix)
    const reference = `INT-${id.slice(0, 8).toUpperCase()}`;

    // Check if VIN masking is enabled
    const shouldMaskVin = process.env.EXPERT_PACK_MASK_VIN === "true";

    // Generate PDF
    const exportDate = new Date();
    const pdfResult = await generateExpertDossierPdf({
      garage: {
        name: intervention.garage.name,
        displayName: intervention.garage.displayName,
        addressLine1: intervention.garage.addressLine1,
        addressLine2: intervention.garage.addressLine2,
        postalCode: intervention.garage.postalCode,
        city: intervention.garage.city,
        phone: intervention.garage.phone,
        email: intervention.garage.email,
        siret: intervention.garage.siret,
        logoKey: intervention.garage.logoKey,
      },
      vehicle: {
        plate: intervention.vehicle.plate,
        brand: intervention.vehicle.brand,
        model: intervention.vehicle.model,
        vin: intervention.vehicle.vin,
        mileageIn: intervention.odometerKm,
      },
      intervention: {
        id,
        reference,
        entryDate: intervention.createdAt,
        exitDate: intervention.closedAt,
        clientName,
      },
      data: packData,
      exportDate,
      chainValid: chainResult.valid,
      chainEntries: chainResult.entries,
      maskVin: shouldMaskVin,
      fetchPhoto: fetchPhotoBuffer,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        garageId,
        action: "EXPORT_EXPERT_PACK_PDF",
        entityType: "Intervention",
        entityId: id,
        metadata: {
          vehiclePlate: intervention.vehicle.plate,
          pdfHash: pdfResult.sha256,
          photosCount: packData.photos.length,
          timelineEvents: packData.timeline.length,
        },
      },
    });

    // Return PDF
    return new NextResponse(new Uint8Array(pdfResult.pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfResult.filename}"`,
        "Content-Length": String(pdfResult.pdfBuffer.length),
        "X-PDF-Hash": pdfResult.sha256,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
