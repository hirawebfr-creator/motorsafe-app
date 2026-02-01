/**
 * EVIDENCE-CAPTURE-01: Send Intake PV by Email
 *
 * POST /api/interventions/[id]/intake-pv/send
 *   - Generates PDF with all intake PV data
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
import { sendIntakePvEmail, getGarageLogoUrl } from "@/lib/email";
import { decryptClientData } from "@/lib/encryption";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";
import { generateIntakePdf, IntakePvData, IntakePvPhoto } from "@/lib/pdf/intakeTemplate";
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
 * POST /api/interventions/[id]/intake-pv/send
 * Send intake PV email to client with PDF and signature link
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    console.log("[IntakePV] Starting POST request");
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await context.params;
    console.log("[IntakePV] User:", user.id, "Intervention:", interventionId);
    const garageId = await getGarageIdForIntervention(user, req, interventionId);
    console.log("[IntakePV] GarageId:", garageId);

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

    // Verify session exists and is for INTAKE step
    const session = await prisma.evidenceCaptureSession.findFirst({
      where: {
        id: sessionId,
        interventionId,
        garageId,
        step: "INTAKE" as EvidenceCaptureStep,
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      console.log("[IntakePV] Session not found");
      return NextResponse.json(failure("Session de reception non trouvee"), { status: 404 });
    }
    console.log("[IntakePV] Session found:", session.id);

    // Get and decrypt client data
    const clientRaw = intervention.vehicle?.client;
    if (!clientRaw) {
      return NextResponse.json(failure("Client non trouve"), { status: 404 });
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
    const formItem = session.items.find((i) => i.type === "FORM" && i.category === "INTAKE_FORM");
    const photoItems = session.items.filter((i) => i.type === "PHOTO");

    // Parse form data
    const formData = (formItem?.jsonData as {
      warnings?: Record<string, boolean>;
      additionalNotes?: string;
      fuelLevel?: number;
    }) || {};

    const warnings = formData.warnings || {};
    const additionalNotes = formData.additionalNotes || null;
    const fuelLevel = formData.fuelLevel ?? null;

    const warningsCount = Object.values(warnings).filter(Boolean).length;

    // Load photos data for PDF
    const photos: IntakePvPhoto[] = [];
    for (const photo of photoItems) {
      const photoData: IntakePvPhoto = {
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
    const pdfData: IntakePvData = {
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
      fuelLevel,

      intakeChecklist: {
        engineLight: warnings.engineLight || false,
        oilLight: warnings.oilLight || false,
        batteryLight: warnings.batteryLight || false,
        brakeLight: warnings.brakeLight || false,
        absLight: warnings.absLight || false,
        airbagLight: warnings.airbagLight || false,
        tireLight: warnings.tireLight || false,
        tempLight: warnings.tempLight || false,
        noises: warnings.noises || false,
        leaks: warnings.leaks || false,
        bodyDamage: warnings.bodyDamage || false,
        scratches: warnings.scratches || false,
      },

      additionalNotes,

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
        console.log("[IntakePV] Garage signature not found, continuing without it");
      }
    }

    // Generate PDF hash for integrity verification (PDF is regenerated on demand via /api/signatures/[token]/pdf)
    console.log("[IntakePV] Building PDF branding context");
    const brandingCtx = await buildPdfBrandingContext(garageId);
    console.log("[IntakePV] Generating PDF for hash calculation");
    const pdfBytes = await generateIntakePdf(pdfData, brandingCtx);
    console.log("[IntakePV] PDF generated, size:", pdfBytes.length);

    // Calculate PDF hash for integrity (don't save file - serverless environment)
    const pdfHash = sha256(Buffer.from(pdfBytes).toString("base64"));

    // Generate signature token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create signature request
    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        token,
        expiresAt,
        documentType: "INTERVENTION_INTAKE",
        documentId: interventionId,
        garageId,
        status: "SENT",
        pdfRoute: `/api/interventions/${interventionId}/intake-pv/pdf`,
        pdfHash,
        sentAt: new Date(),
        signerEmail: clientEmail,
      },
    });

    // Build signing URL
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://safemotor.fr";
    const signingUrl = `${baseUrl}/sign/${token}?evidence=true&step=INTAKE&sessionId=${sessionId}`;

    // Check if garage has a logo
    const hasLogo = !!intervention.garage?.logoKey;
    const garageLogoUrl = getGarageLogoUrl(garageId, hasLogo);

    // Build garage address
    const addressParts = [
      intervention.garage?.address,
      [intervention.garage?.postalCode, intervention.garage?.city].filter(Boolean).join(" "),
    ].filter(Boolean);

    // Send email
    const emailResult = await sendIntakePvEmail({
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
      odometerKm: intervention.odometerKm || undefined,
      warningsCount,
      photosCount: photos.length,
      expiresAt,
      garageLogoUrl,
    });

    if (!emailResult.success) {
      console.error("[IntakePV] Email failed:", emailResult.error);
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
        action: "intake_pv_sent",
        sessionId,
        signatureRequestId: signatureRequest.id,
        clientEmail: clientEmail,
        warningsCount,
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
    console.error("[IntakePV] Unhandled error:", err);
    return toErrorResponse(err);
  }
}
