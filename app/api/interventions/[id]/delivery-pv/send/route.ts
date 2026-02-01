/**
 * EVIDENCE-CAPTURE-01: Send Delivery PV by Email
 *
 * POST /api/interventions/[id]/delivery-pv/send
 *   - Generates PDF with all delivery PV data
 *   - Creates signature token
 *   - Sends professional email to client
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantIdWithAdminOverride } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { sendDeliveryPvEmail, getGarageLogoUrl } from "@/lib/email";
import { decryptClientData } from "@/lib/encryption";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";
import { generateDeliveryPdf, DeliveryPvData, DeliveryPvPhoto } from "@/lib/pdf/deliveryTemplate";
import { buildPdfBrandingContext } from "@/lib/pdf/branding";
import { EvidenceCaptureStep } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SendPvSchema = z.object({
  sessionId: z.string().min(1),
  clientEmail: z.string().email().optional(), // Override client email if provided
});

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

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * POST /api/interventions/[id]/delivery-pv/send
 * Send delivery PV email to client with PDF and signature link
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    console.log("[DeliveryPV] Starting POST request");
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await context.params;
    console.log("[DeliveryPV] User:", user.id, "Intervention:", interventionId);
    const garageId = await getGarageIdForIntervention(user, req, interventionId);
    console.log("[DeliveryPV] GarageId:", garageId);

    // Parse body
    const json = await req.json().catch(() => null);
    const parsed = SendPvSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() },
        },
        { status: 400 }
      );
    }

    const { sessionId, clientEmail: overrideEmail } = parsed.data;

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
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Verify session exists and is for DELIVERY step
    const session = await prisma.evidenceCaptureSession.findFirst({
      where: {
        id: sessionId,
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
      console.log("[DeliveryPV] Session not found");
      return NextResponse.json(failure("Session de restitution non trouvée"), { status: 404 });
    }
    console.log("[DeliveryPV] Session found:", session.id);

    // Get and decrypt client data
    const clientRaw = intervention.vehicle?.client;
    if (!clientRaw) {
      return NextResponse.json(failure("Client non trouvé"), { status: 404 });
    }

    // Decrypt client data (handles both encrypted and plain text)
    const client = decryptClientData(clientRaw as Record<string, unknown>) as {
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
    };

    const clientEmail = overrideEmail || client.email;
    if (!clientEmail) {
      return NextResponse.json(failure("Email client requis"), { status: 400 });
    }

    const clientFirstName = client.firstName || "";
    const clientLastName = client.lastName || "";
    const clientPhone = client.phone || undefined;

    // Extract data from session items
    const formItem = session.items.find((i) => i.type === "FORM" && i.category === "DELIVERY_FORM");
    const photoItems = session.items.filter((i) => i.type === "PHOTO");

    // Parse form data
    const formData = (formItem?.jsonData as {
      outtakeChecklist?: Record<string, boolean>;
      hasReservations?: boolean;
      reservations?: string;
    }) || {};

    const outtakeChecklist = formData.outtakeChecklist || {};
    const hasReservations = formData.hasReservations || false;
    const reservations = formData.reservations || null;

    const testsValidated = Object.values(outtakeChecklist).filter(Boolean).length;
    const totalTests = 6; // Total checklist items

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
      createdAt: new Date(),
      signedAt: null,
      signerName: null,

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
        console.log("[DeliveryPV] Garage signature not found, continuing without it");
      }
    }

    // Generate PDF
    console.log("[DeliveryPV] Building PDF branding context");
    const brandingCtx = await buildPdfBrandingContext(garageId);
    console.log("[DeliveryPV] Generating PDF");
    const pdfBytes = await generateDeliveryPdf(pdfData, brandingCtx);
    console.log("[DeliveryPV] PDF generated, size:", pdfBytes.length);

    // Save PDF to storage
    const fs = await import("fs/promises");
    const path = await import("path");

    const pdfHash = sha256(Buffer.from(pdfBytes).toString("base64"));
    const pdfKey = `uploads/${garageId}/evidence/${interventionId}/delivery/pv_restitution_${pdfHash.slice(0, 12)}.pdf`;
    const pdfAbsPath = path.join(process.cwd(), "uploads", pdfKey);

    await fs.mkdir(path.dirname(pdfAbsPath), { recursive: true });
    await fs.writeFile(pdfAbsPath, pdfBytes);

    // Generate signature token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create signature request
    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        token,
        expiresAt,
        documentType: "INTERVENTION_DELIVERY",
        documentId: interventionId,
        garageId,
        status: "SENT",
        pdfRoute: `/api/interventions/${interventionId}/delivery-pv/pdf`,
        pdfHash,
        sentAt: new Date(),
        signerEmail: clientEmail,
      },
    });

    // Build signing URL
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://safemotor.fr";
    const signingUrl = `${baseUrl}/sign/${token}?evidence=true&step=DELIVERY&sessionId=${sessionId}`;

    // Check if garage has a logo
    const hasLogo = !!intervention.garage?.logoKey;
    const garageLogoUrl = getGarageLogoUrl(garageId, hasLogo);

    // Build garage address
    const addressParts = [
      intervention.garage?.address,
      [intervention.garage?.postalCode, intervention.garage?.city].filter(Boolean).join(" "),
    ].filter(Boolean);

    // Send email
    const emailResult = await sendDeliveryPvEmail({
      to: clientEmail,
      signingUrl,
      clientName: `${clientFirstName} ${clientLastName}`.trim() || undefined,
      garageName: intervention.garage?.displayName || intervention.garage?.name || "Le garage",
      garagePhone: intervention.garage?.phone || undefined,
      garageEmail: intervention.garage?.email || undefined,
      garageAddress: addressParts.join(", ") || undefined,
      vehiclePlate: intervention.vehicle?.plate || "",
      vehicleBrand: intervention.vehicle?.brand || "",
      vehicleModel: intervention.vehicle?.model || "",
      testsValidated,
      totalTests,
      hasReservations,
      photosCount: photos.length,
      expiresAt,
      garageLogoUrl,
    });

    if (!emailResult.success) {
      console.error("[DeliveryPV] Email failed:", emailResult.error);
      // Don't fail the request, but log the error
    }

    // Update session to mark as sent
    await prisma.evidenceCaptureSession.update({
      where: { id: sessionId },
      data: {
        status: "READY",
      },
    });

    // Add to evidence chain
    await addEvidenceEntry({
      garageId,
      entityType: "intervention",
      entityId: interventionId,
      eventType: "snapshot",
      payload: {
        action: "delivery_pv_sent",
        sessionId,
        signatureRequestId: signatureRequest.id,
        clientEmail: clientEmail,
        testsValidated,
        hasReservations,
        photosCount: photos.length,
        pdfHash,
      },
      context: {
        userId: user.id,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json(
      success({
        sent: true,
        signatureRequestId: signatureRequest.id,
        signingUrl,
        expiresAt: expiresAt.toISOString(),
        emailSent: emailResult.success,
        emailMessageId: emailResult.messageId,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
