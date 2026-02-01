/**
 * EVIDENCE-CAPTURE-01: Delivery PV PDF Generator
 *
 * GET /api/interventions/[id]/delivery-pv/pdf?sessionId=xxx
 *   - Returns PDF for delivery PV
 *   - Used by signature flow and direct download
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantIdWithAdminOverride } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { decryptClientData } from "@/lib/encryption";
import { generateDeliveryPdf, DeliveryPvData, DeliveryPvPhoto } from "@/lib/pdf/deliveryTemplate";
import { buildPdfBrandingContext } from "@/lib/pdf/branding";
import { EvidenceCaptureStep } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Helper: Get garageId from intervention
 */
async function getGarageIdForIntervention(
  user: { role: string; garageId: number | null },
  req: Request,
  interventionId: string
): Promise<number> {
  if (user.role === "ADMIN") {
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { garageId: true },
    });
    if (!intervention || intervention.garageId === null) {
      throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    }
    return intervention.garageId;
  }

  const garageId = getTenantIdWithAdminOverride(
    user as Parameters<typeof getTenantIdWithAdminOverride>[0],
    req
  );
  if (!garageId) {
    throw new RouteError(400, "TENANT_REQUIRED", "Garage requis");
  }
  return garageId;
}

/**
 * GET /api/interventions/[id]/delivery-pv/pdf
 * Generate and return delivery PV PDF
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await context.params;
    const garageId = await getGarageIdForIntervention(user, req, interventionId);

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    // Verify intervention and get all related data
    const intervention = await prisma.intervention.findFirst({
      where:
        user.role === "ADMIN"
          ? { id: interventionId, deletedAt: null }
          : { id: interventionId, garageId, deletedAt: null },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
        garage: true,
      },
    });

    if (!intervention) {
      return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
    }

    // Get session (either by ID or find the DELIVERY session)
    const session = await prisma.evidenceCaptureSession.findFirst({
      where: sessionId
        ? {
            id: sessionId,
            interventionId,
            garageId,
            step: "DELIVERY" as EvidenceCaptureStep,
          }
        : {
            interventionId,
            garageId,
            step: "DELIVERY" as EvidenceCaptureStep,
          },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session de restitution non trouvée" }, { status: 404 });
    }

    // Get and decrypt client data
    const clientRaw = intervention.vehicle?.client;
    const client = clientRaw
      ? (decryptClientData(clientRaw as Record<string, unknown>) as {
          firstName: string;
          lastName: string;
          email?: string | null;
          phone?: string | null;
        })
      : null;
    const clientFirstName = client?.firstName || "";
    const clientLastName = client?.lastName || "";
    const clientEmail = client?.email || undefined;
    const clientPhone = client?.phone || undefined;

    // Extract data from session items
    const formItem = session.items.find((i) => i.type === "FORM" && i.category === "DELIVERY_FORM");
    const photoItems = session.items.filter((i) => i.type === "PHOTO");
    const signatureItem = session.items.find((i) => i.type === "SIGNATURE");

    // Parse form data
    const formData = (formItem?.jsonData as {
      outtakeChecklist?: Record<string, boolean>;
      hasReservations?: boolean;
      reservations?: string;
    }) || {};

    const outtakeChecklist = formData.outtakeChecklist || {};
    const hasReservations = formData.hasReservations || false;
    const reservations = formData.reservations || null;

    // Get signature data if signed
    const signatureData = signatureItem?.jsonData as {
      signerName?: string;
      signedAt?: string;
    } | null;

    // Load photos data for PDF
    const photos: DeliveryPvPhoto[] = [];
    for (const photo of photoItems) {
      const photoData: DeliveryPvPhoto = {
        label: photo.label || "Photo",
        category: photo.category || "",
        storageKey: photo.storageKey,
        imageData: null,
      };

      // Try to load image data for PDF embedding
      if (photo.storageKey) {
        try {
          const fs = await import("fs/promises");
          const path = await import("path");
          const absPath = path.join(process.cwd(), "uploads", photo.storageKey);
          photoData.imageData = await fs.readFile(absPath);
        } catch {
          // Image loading failed, will show placeholder
        }
      }

      photos.push(photoData);
    }

    // Build PDF data
    const pdfData: DeliveryPvData = {
      interventionId,
      createdAt: session.createdAt,
      signedAt: signatureData?.signedAt ? new Date(signatureData.signedAt) : null,
      signerName: signatureData?.signerName || null,

      client: {
        firstName: clientFirstName,
        lastName: clientLastName,
        email: clientEmail,
        phone: clientPhone,
      },

      vehicle: {
        brand: intervention.vehicle?.brand || "",
        model: intervention.vehicle?.model || "",
        plate: intervention.vehicle?.plate || "",
        vin: intervention.vehicle?.vin || undefined,
      },

      odometerKm: intervention.odometerKm,

      outtakeChecklist: {
        roadTest: outtakeChecklist.roadTest || false,
        lightsOff: outtakeChecklist.lightsOff || false,
        noisesGone: outtakeChecklist.noisesGone || false,
        leaksFixed: outtakeChecklist.leaksFixed || false,
        cleanVehicle: outtakeChecklist.cleanVehicle || false,
        toolsRemoved: outtakeChecklist.toolsRemoved || false,
      },

      hasReservations,
      reservations,

      photos,

      organisation: {
        name: intervention.garage?.name || "",
        displayName: intervention.garage?.displayName || undefined,
        address: intervention.garage?.address || undefined,
        city: intervention.garage?.city || undefined,
        postalCode: intervention.garage?.postalCode || undefined,
        phone: intervention.garage?.phone || undefined,
        email: intervention.garage?.email || undefined,
        siret: intervention.garage?.siret || undefined,
        vatNumber: intervention.garage?.vatNumber || undefined,
      },

      // Garage signature (will be loaded below)
      garageSignatureImage: null,
      garageSignerName: intervention.garage?.displayName || intervention.garage?.name || undefined,
    };

    // Load garage signature if available
    const garage = intervention.garage;
    if (garage?.signatureImageKey) {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const sigPath = path.join(process.cwd(), "uploads", garage.signatureImageKey);
        pdfData.garageSignatureImage = await fs.readFile(sigPath);
      } catch {
        // Signature not found, continue without it
      }
    }

    // Generate PDF
    const brandingCtx = await buildPdfBrandingContext(garageId);
    const pdfBytes = await generateDeliveryPdf(pdfData, brandingCtx);

    // Return PDF
    const filename = `pv_restitution_${intervention.vehicle?.plate || interventionId.slice(0, 8)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
