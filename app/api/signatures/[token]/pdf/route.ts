import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { buildOrderMasterPdf } from "@/lib/pdf/orderMaster";
import { generateQuotePdf, QuotePdfData } from "@/lib/pdf/quoteTemplate";
import { generateDeliveryPdf, DeliveryPvData, DeliveryPvPhoto } from "@/lib/pdf/deliveryTemplate";
import { generateIntakePdf, IntakePvData, IntakePvPhoto } from "@/lib/pdf/intakeTemplate";
import { buildPdfBrandingContext } from "@/lib/pdf/branding";
import { decryptClientData } from "@/lib/encryption";
import { isGarageSubscriptionActive } from "@/lib/guards";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { EvidenceCaptureStep } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 30 requests per 5 minutes per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_SEC = 5 * 60;

type Ctx = { params: Promise<{ token: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    // Rate limit check (IP-based)
    const rl = await checkIpRateLimit(req, "sign_pdf", RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Trop de requêtes. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { token } = await ctx.params;

    if (!token) {
      // Generic error
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 400 });
    }

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
      include: { garage: { select: { id: true, plan: true, subscriptionStatus: true } } },
    });

    if (!signatureRequest) {
      // Generic error (don't reveal if token exists)
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 404 });
    }

    // BILLING-GUARD-01: Check garage subscription (allow viewing already signed docs)
    if (signatureRequest.status !== "SIGNED" && !isGarageSubscriptionActive(signatureRequest.garage)) {
      return NextResponse.json(
        { ok: false, error: { code: "SUBSCRIPTION_INACTIVE", message: "Le garage n'a pas d'abonnement actif." } },
        { status: 402 }
      );
    }

    // Check expiration
    if (signatureRequest.expiresAt < new Date()) {
      return NextResponse.json(failure("Ce lien de signature a expiré"), { status: 410 });
    }

    // Support QUOTE and INTERVENTION_ORDER documents
    if (signatureRequest.documentType === "QUOTE") {
      // Generate Quote PDF
      try {
        const quote = await prisma.quote.findUnique({
          where: { id: signatureRequest.documentId },
          include: {
            lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
            client: true,
            vehicle: true,
            organisation: true,
          },
        });

        if (!quote) {
          return NextResponse.json(failure("Devis introuvable"), { status: 404 });
        }

        // Decrypt client data
        const client = decryptClientData(quote.client as Record<string, unknown>) as typeof quote.client;

        // Load branding context
        const brandingCtx = await buildPdfBrandingContext(quote.organisationId);

        // Prepare PDF data
        const pdfData: QuotePdfData = {
          quoteNumber: quote.quoteNumber,
          status: quote.status,
          createdAt: quote.createdAt,
          sentAt: quote.sentAt,
          acceptedAt: quote.acceptedAt,
          signedAt: signatureRequest.status === "SIGNED" && signatureRequest.signedAt ? signatureRequest.signedAt : undefined,
          signerName: signatureRequest.status === "SIGNED" ? signatureRequest.signerNameDeclared || undefined : undefined,
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
            city: quote.organisation.city,
            postalCode: quote.organisation.postalCode,
            phone: quote.organisation.phone,
            email: quote.organisation.email,
            siret: quote.organisation.siret,
            vatNumber: quote.organisation.vatNumber,
          },
        };

        const bytes = await generateQuotePdf(pdfData, brandingCtx);
        const buffer = Buffer.from(bytes);
        const fileName = `devis-${quote.quoteNumber || quote.id}.pdf`;

        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${fileName}"`,
            "Cache-Control": "private, no-store",
          },
        });
      } catch (pdfErr) {
        console.error("Quote PDF generation error:", pdfErr);
        return NextResponse.json(failure("Erreur lors de la génération du PDF"), { status: 500 });
      }
    }

    // Handle INTERVENTION_DELIVERY (PV de restitution)
    if (signatureRequest.documentType === "INTERVENTION_DELIVERY") {
      try {
        const interventionId = signatureRequest.documentId;

        // Get intervention with all related data
        const intervention = await prisma.intervention.findUnique({
          where: { id: interventionId },
          include: {
            vehicle: { include: { client: true } },
            garage: true,
          },
        });

        if (!intervention) {
          return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
        }

        // Get delivery session
        const session = await prisma.evidenceCaptureSession.findFirst({
          where: {
            interventionId,
            step: "DELIVERY" as EvidenceCaptureStep,
          },
          include: {
            items: { orderBy: { createdAt: "asc" } },
          },
        });

        if (!session) {
          return NextResponse.json(failure("Session de restitution non trouvée"), { status: 404 });
        }

        // Decrypt client data
        const clientRaw = intervention.vehicle?.client;
        const client = clientRaw
          ? (decryptClientData(clientRaw as Record<string, unknown>) as {
              firstName: string;
              lastName: string;
              email?: string | null;
              phone?: string | null;
            })
          : { firstName: "", lastName: "", email: null, phone: null };

        // Extract form data
        const formItem = session.items.find((i) => i.type === "FORM" && i.category === "DELIVERY_FORM");
        const photoItems = session.items.filter((i) => i.type === "PHOTO");

        const formData = (formItem?.jsonData as {
          outtakeChecklist?: Record<string, boolean>;
          hasReservations?: boolean;
          reservations?: string;
        }) || {};

        const outtakeChecklist = formData.outtakeChecklist || {};
        const hasReservations = formData.hasReservations || false;
        const reservations = formData.reservations || null;

        // Load photos
        const photos: DeliveryPvPhoto[] = [];
        for (const photo of photoItems) {
          const photoData: DeliveryPvPhoto = {
            label: photo.label || "Photo",
            category: photo.category || "",
            storageKey: photo.storageKey,
            imageData: null,
          };

          if (photo.storageKey) {
            try {
              const fs = await import("fs/promises");
              const path = await import("path");
              const absPath = path.join(process.cwd(), "uploads", photo.storageKey);
              photoData.imageData = await fs.readFile(absPath);
            } catch {
              // Photo not found
            }
          }

          photos.push(photoData);
        }

        // Build PDF data
        const pdfData: DeliveryPvData = {
          interventionId,
          createdAt: session.createdAt,
          signedAt: signatureRequest.status === "SIGNED" ? signatureRequest.signedAt : null,
          signerName: signatureRequest.status === "SIGNED" ? signatureRequest.signerNameDeclared : null,
          signerIp: null, // IP not stored in SignatureRequest model

          client: {
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
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
            // Signature not found
          }
        }

        // Generate PDF
        const brandingCtx = intervention.garageId
          ? await buildPdfBrandingContext(intervention.garageId)
          : null;
        const pdfBytes = await generateDeliveryPdf(pdfData, brandingCtx);
        const fileName = `pv_restitution_${intervention.vehicle?.plate || interventionId.slice(0, 8)}.pdf`;

        return new NextResponse(Buffer.from(pdfBytes), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${fileName}"`,
            "Cache-Control": "private, no-store",
          },
        });
      } catch (pdfErr) {
        console.error("Delivery PV PDF generation error:", pdfErr);
        return NextResponse.json(failure("Erreur lors de la génération du PDF"), { status: 500 });
      }
    }

    // Handle INTERVENTION_INTAKE (PV de reception)
    if (signatureRequest.documentType === "INTERVENTION_INTAKE") {
      try {
        const interventionId = signatureRequest.documentId;

        // Get intervention with all related data
        const intervention = await prisma.intervention.findUnique({
          where: { id: interventionId },
          include: {
            vehicle: { include: { client: true } },
            garage: true,
          },
        });

        if (!intervention) {
          return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
        }

        // Get intake session
        const session = await prisma.evidenceCaptureSession.findFirst({
          where: {
            interventionId,
            step: "INTAKE" as EvidenceCaptureStep,
          },
          include: {
            items: { orderBy: { createdAt: "asc" } },
          },
        });

        if (!session) {
          return NextResponse.json(failure("Session de reception non trouvee"), { status: 404 });
        }

        // Decrypt client data
        const clientRaw = intervention.vehicle?.client;
        const client = clientRaw
          ? (decryptClientData(clientRaw as Record<string, unknown>) as {
              firstName: string;
              lastName: string;
              email?: string | null;
              phone?: string | null;
            })
          : { firstName: "", lastName: "", email: null, phone: null };

        // Extract form data
        const formItem = session.items.find((i) => i.type === "FORM" && i.category === "INTAKE_FORM");
        const photoItems = session.items.filter((i) => i.type === "PHOTO");

        const formData = (formItem?.jsonData as {
          warnings?: Record<string, boolean>;
          additionalNotes?: string;
          fuelLevel?: number;
        }) || {};

        const warnings = formData.warnings || {};
        const additionalNotes = formData.additionalNotes || null;
        const fuelLevel = formData.fuelLevel ?? null;

        // Load photos
        const photos: IntakePvPhoto[] = [];
        for (const photo of photoItems) {
          const photoData: IntakePvPhoto = {
            label: photo.label || "Photo",
            category: photo.category || "",
            storageKey: photo.storageKey,
            imageData: null,
          };

          if (photo.storageKey) {
            try {
              const fs = await import("fs/promises");
              const path = await import("path");
              const absPath = path.join(process.cwd(), "uploads", photo.storageKey);
              photoData.imageData = await fs.readFile(absPath);
            } catch {
              // Photo not found
            }
          }

          photos.push(photoData);
        }

        // Build PDF data
        const pdfData: IntakePvData = {
          interventionId,
          createdAt: session.createdAt,
          signedAt: signatureRequest.status === "SIGNED" ? signatureRequest.signedAt : null,
          signerName: signatureRequest.status === "SIGNED" ? signatureRequest.signerNameDeclared : null,
          signerIp: null,

          client: {
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
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
            // Signature not found
          }
        }

        // Generate PDF
        const brandingCtx = intervention.garageId
          ? await buildPdfBrandingContext(intervention.garageId)
          : null;
        const pdfBytes = await generateIntakePdf(pdfData, brandingCtx);
        const fileName = `pv_reception_${intervention.vehicle?.plate || interventionId.slice(0, 8)}.pdf`;

        return new NextResponse(Buffer.from(pdfBytes), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${fileName}"`,
            "Cache-Control": "private, no-store",
          },
        });
      } catch (pdfErr) {
        console.error("Intake PV PDF generation error:", pdfErr);
        return NextResponse.json(failure("Erreur lors de la génération du PDF"), { status: 500 });
      }
    }

    // Only support INTERVENTION_ORDER for other intervention types
    if (!signatureRequest.documentType.startsWith("INTERVENTION_")) {
      return NextResponse.json(failure("Type de document non supporté pour l'aperçu PDF"), { status: 400 });
    }

    // Generate PDF using the shared function (for INTERVENTION_ORDER, etc.)
    try {
      const result = await buildOrderMasterPdf(signatureRequest.documentId, {
        showSignedWatermark: signatureRequest.status === "SIGNED",
        signerName: signatureRequest.status === "SIGNED" ? signatureRequest.signerNameDeclared || undefined : undefined,
        signedAt: signatureRequest.status === "SIGNED" && signatureRequest.signedAt ? signatureRequest.signedAt : undefined,
      });

      return new NextResponse(new Uint8Array(result.pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${result.filename}"`,
          "Cache-Control": "private, no-store",
          "X-PDF-Hash": result.sha256,
        },
      });
    } catch (pdfErr) {
      console.error("PDF generation error:", pdfErr);
      return NextResponse.json(failure("Erreur lors de la génération du PDF"), { status: 500 });
    }
  } catch (err) {
    console.error("Error GET /api/signatures/[token]/pdf:", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
