/**
 * POST /api/interventions/[id]/signature/yousign
 * 
 * Creates a Yousign signature request for an intervention's order document
 * 
 * Flow:
 * 1. Generate the PDF (Ordre de Réparation)
 * 2. Create Yousign signature request
 * 3. Upload the PDF document
 * 4. Add the client as signer with signature field
 * 5. Activate the signature request
 * 6. Save to database
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireActiveSubscription, requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { decryptClientData } from "@/lib/encryption";
import {
  createSignatureRequest,
  uploadDocument,
  addSigner,
  activateSignatureRequest,
  getYousignConfig,
} from "@/lib/yousign";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const APP_URL = process.env.APP_URL || "http://localhost:3000";

const BodySchema = z.object({
  documentType: z.enum(["INTERVENTION_ORDER", "INTERVENTION_DELIVERY", "QUOTE"]).default("INTERVENTION_ORDER"),
}).partial();

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    requireActiveSubscription(user);
    const garageId = getTenantId(user);

    const { id: interventionId } = await ctx.params;

    // Parse optional body
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    const documentType = parsed.success ? (parsed.data.documentType || "INTERVENTION_ORDER") : "INTERVENTION_ORDER";

    // Check Yousign configuration
    const yousignConfig = getYousignConfig();
    if (!yousignConfig.isConfigured) {
      return NextResponse.json(
        failure("Yousign n'est pas configuré. Contactez l'administrateur."),
        { status: 500 }
      );
    }

    // Fetch the intervention with related data
    const intervention = await prisma.intervention.findFirst({
      where: {
        id: interventionId,
        garageId: user.role === "ADMIN" ? undefined : garageId,
        deletedAt: null,
      },
      include: {
        vehicle: { include: { client: true } },
        garage: true,
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Decrypt client data
    const clientRaw = intervention.vehicle.client as Record<string, unknown>;
    const client = decryptClientData(clientRaw) as {
      id: number;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    };

    if (!client.email) {
      return NextResponse.json(
        failure("Le client n'a pas d'adresse email. Veuillez la renseigner avant de demander une signature."),
        { status: 400 }
      );
    }

    // Check if there's already an ongoing signature request
    const existingRequest = await prisma.eSignatureRequest.findFirst({
      where: {
        interventionId,
        documentType,
        status: { in: ["DRAFT", "ONGOING"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        failure("Une demande de signature est déjà en cours pour ce document."),
        { status: 400 }
      );
    }

    // Generate the PDF
    console.log(`[Yousign] Generating PDF for intervention ${interventionId}`);
    const pdfUrl = documentType === "INTERVENTION_ORDER"
      ? `${APP_URL}/api/interventions/${interventionId}/order/pdf`
      : `${APP_URL}/api/interventions/${interventionId}/pdf`;

    // Fetch the PDF internally
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        Cookie: req.headers.get("Cookie") || "",
      },
    });

    if (!pdfResponse.ok) {
      console.error(`[Yousign] Failed to generate PDF: ${pdfResponse.status}`);
      return NextResponse.json(failure("Erreur lors de la génération du PDF"), { status: 500 });
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const filename = `OR_${intervention.vehicle.plate}_${new Date().toISOString().split("T")[0]}.pdf`;

    console.log(`[Yousign] PDF generated, size: ${pdfBuffer.length} bytes`);

    // 1. Create Yousign signature request
    console.log(`[Yousign] Creating signature request`);
    const signatureRequest = await createSignatureRequest({
      name: `Ordre de Réparation - ${intervention.vehicle.plate} - ${client.firstName} ${client.lastName}`,
      delivery_mode: "email",
      timezone: "Europe/Paris",
      external_id: `intervention:${interventionId}`,
    });

    console.log(`[Yousign] Signature request created: ${signatureRequest.id}`);

    // 2. Upload document
    console.log(`[Yousign] Uploading document`);
    const document = await uploadDocument(signatureRequest.id, {
      pdfBuffer,
      filename,
      nature: "signable_document",
      parse_anchors: true, // Enable anchor parsing
    });

    console.log(`[Yousign] Document uploaded: ${document.id}, ${document.total_pages} pages`);

    // 3. Add signer with signature field
    // Place signature on the last page at a reasonable position
    const signaturePage = document.total_pages;
    const signatureField = {
      type: "signature" as const,
      document_id: document.id,
      page: signaturePage,
      // Position at bottom left of the signature box area (based on the PDF layout)
      x: 50,
      y: 100, // From bottom
      width: 200,
      height: 60,
    };

    console.log(`[Yousign] Adding signer: ${client.email}`);
    const signer = await addSigner(signatureRequest.id, {
      first_name: client.firstName,
      last_name: client.lastName,
      email: client.email,
      phone_number: client.phone,
      locale: "fr",
      signature_level: "electronic_signature",
      signature_authentication_mode: "no_otp",
      fields: [signatureField],
    });

    console.log(`[Yousign] Signer added: ${signer.id}`);

    // 4. Activate the signature request
    console.log(`[Yousign] Activating signature request`);
    const activated = await activateSignatureRequest(signatureRequest.id);

    console.log(`[Yousign] Signature request activated, status: ${activated.status}`);

    // 5. Save to database
    const eSignRequest = await prisma.eSignatureRequest.create({
      data: {
        provider: "YOUSIGN",
        providerSignatureRequestId: signatureRequest.id,
        providerDocumentId: document.id,
        status: "ONGOING",
        garageId,
        interventionId,
        signerEmail: client.email,
        signerName: `${client.firstName} ${client.lastName}`,
        signerPhone: client.phone || null,
        documentType,
        documentFileName: filename,
        activatedAt: new Date(),
        providerMetaJson: JSON.parse(JSON.stringify({
          signatureRequest: activated,
          document,
          signer,
        })),
      },
    });

    console.log(`[Yousign] ESignatureRequest created: ${eSignRequest.id}`);

    return NextResponse.json(
      success({
        id: eSignRequest.id,
        status: "ONGOING",
        providerSignatureRequestId: signatureRequest.id,
        signerEmail: client.email,
        signerName: `${client.firstName} ${client.lastName}`,
        message: `Demande de signature envoyée à ${client.email}`,
      })
    );
  } catch (err) {
    console.error("[Yousign] Error creating signature request:", err);
    return toErrorResponse(err);
  }
}

// GET: Check status of existing signature requests
export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);

    const { id: interventionId } = await ctx.params;

    const requests = await prisma.eSignatureRequest.findMany({
      where: {
        interventionId,
        garageId: user.role === "ADMIN" ? undefined : garageId,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        provider: true,
        status: true,
        documentType: true,
        signerEmail: true,
        signerName: true,
        signedDocumentUrl: true,
        auditTrailUrl: true,
        activatedAt: true,
        signedAt: true,
        declinedAt: true,
        expiredAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(success(requests));
  } catch (err) {
    console.error("[Yousign] Error fetching signature requests:", err);
    return toErrorResponse(err);
  }
}
