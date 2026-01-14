/**
 * POST /api/interventions/[id]/signature/yousign
 * 
 * Creates a Yousign signature request for an intervention's order document
 * 
 * Flow:
 * 1. Generate the PDF (Ordre de Réparation) - INLINE to avoid auth issues
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
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { getLegalContent } from "@/content/legal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  documentType: z.enum(["INTERVENTION_ORDER", "INTERVENTION_DELIVERY", "QUOTE"]).default("INTERVENTION_ORDER"),
}).partial();

// =========== PDF Generation Helpers ===========
function asText(value: unknown, fallback = "Non renseigné") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Non renseigné";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Non renseigné";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "Non renseigné";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Non renseigné";
  return d.toLocaleString("fr-FR");
}

// Generate OR PDF inline (no HTTP fetch needed)
async function generateOrderPdfBuffer(
  intervention: any,
  client: { firstName: string; lastName: string; email?: string; phone?: string; address?: string },
  garage: any
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  
  doc.on("data", (chunk: Buffer | Uint8Array) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;

  const row = (label: string, value: string, bold = false) => {
    const labelWidth = 160;
    const valueWidth = contentWidth - labelWidth;
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).text(label, left, y, { width: labelWidth });
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).text(value, left + labelWidth, y, { width: valueWidth });
    doc.moveDown(0.4);
  };

  const section = (title: string) => {
    doc.moveDown(0.6);
    doc.fontSize(12).font("Helvetica-Bold").text(title);
    doc.moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).strokeColor("#444").lineWidth(0.5).stroke();
    doc.moveDown(0.4);
  };

  // === EN-TÊTE ===
  doc.fontSize(18).font("Helvetica-Bold").text("ORDRE DE RÉPARATION", left, doc.y, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").text(`Date: ${formatDate(new Date())}`, { align: "center" });
  doc.moveDown(0.8);

  // === INFOS GARAGE ===
  if (garage) {
    section("Établissement");
    row("Raison sociale", asText(garage.name));
    row("Adresse", asText(garage.address));
    row("Téléphone", asText(garage.phone));
    row("Email", asText(garage.email));
    row("SIRET", asText(garage.siret));
  }

  // === INFOS CLIENT ===
  section("Client");
  row("Nom", `${client.firstName} ${client.lastName}`);
  row("Téléphone", asText(client.phone));
  row("Email", asText(client.email));
  row("Adresse", asText(client.address));

  // === INFOS VÉHICULE ===
  section("Véhicule");
  row("Immatriculation", intervention.vehicle.plate, true);
  row("Marque / Modèle", `${intervention.vehicle.brand} ${intervention.vehicle.model}`);
  row("VIN", asText(intervention.vehicle.vin));
  row("Carburant", asText(intervention.vehicle.fuel));
  row("Année", asText(intervention.vehicle.year));
  row("Kilométrage entrée", intervention.odometerKm ? `${intervention.odometerKm} km` : "Non renseigné");
  row("Date réception", formatDateTime(intervention.createdAt));

  // === TYPE D'INTERVENTION ===
  section("Nature de l'intervention");
  row("Type principal", intervention.type);
  if (intervention.tags && intervention.tags.length > 0) {
    row("Catégories", intervention.tags.join(", "));
  }

  // === ÉTAT D'ENTRÉE / SYMPTÔMES ===
  section("État d'entrée et symptômes");
  
  if (intervention.intakeChecklist) {
    const checks = intervention.intakeChecklist;
    const anomalies: string[] = [];
    if (checks.lights) anomalies.push("Voyants allumés");
    if (checks.noises) anomalies.push("Bruits anormaux");
    if (checks.leaks) anomalies.push("Fuites détectées");
    if (checks.smoke) anomalies.push("Fumée visible");
    if (checks.bodyDamage) anomalies.push("Dégâts carrosserie");
    row("Anomalies constatées", anomalies.length > 0 ? anomalies.join(", ") : "Aucune anomalie signalée");
  } else {
    row("Anomalies constatées", "Non renseigné");
  }

  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica-Bold").text("Symptômes décrits par le client:", left, doc.y);
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(10).text(asText(intervention.intakeNotes, "Aucun symptôme décrit"), { width: contentWidth });

  // === ESTIMATION / ACCORD ===
  section("Estimation et accord");
  if (intervention.amountCents) {
    row("Montant estimé", `${(intervention.amountCents / 100).toFixed(2)} € TTC`);
  } else {
    row("Montant estimé", "À définir après diagnostic");
  }
  if (intervention.agreementAt) {
    row("Accord client", `Validé le ${formatDateTime(intervention.agreementAt)}`);
    row("Méthode accord", asText(intervention.agreementMethod, "Application"));
  } else {
    row("Accord client", "En attente");
  }

  // === AUTORISATIONS ===
  section("Autorisations");
  doc.fontSize(9).font("Helvetica").text(
    "En signant le présent ordre de réparation, le client autorise l'établissement à:",
    left, doc.y, { width: contentWidth }
  );
  doc.moveDown(0.3);
  const authorizations = [
    "• Effectuer les essais routiers nécessaires au diagnostic et à la vérification des réparations",
    "• Procéder aux démontages requis pour établir un diagnostic précis",
    "• Réaliser les travaux décrits ci-dessus dans le respect des règles de l'art",
  ];
  authorizations.forEach((auth) => {
    doc.fontSize(9).font("Helvetica").text(auth, left + 10, doc.y, { width: contentWidth - 20 });
    doc.moveDown(0.2);
  });

  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica-Bold").text("Note importante:", left, doc.y);
  doc.font("Helvetica").text(
    "En cas de refus des réparations après diagnostic, les frais de diagnostic pourront être facturés selon le barème en vigueur.",
    left, doc.y + 12, { width: contentWidth }
  );

  // === RÉFÉRENCES LÉGALES ===
  const legalContent = getLegalContent(intervention.type);
  doc.moveDown(1);
  section("Références & clauses");
  doc.fontSize(9).font("Helvetica-Bold").text(legalContent.title, left, doc.y);
  doc.moveDown(0.3);
  legalContent.bullets.forEach((bullet) => {
    doc.font("Helvetica").fontSize(8).text(`• ${bullet}`, left + 10, doc.y, { width: contentWidth - 20 });
    doc.moveDown(0.2);
  });

  // === SIGNATURES ===
  doc.moveDown(1.5);
  const sigY = doc.y;
  const sigWidth = (contentWidth - 40) / 2;

  // Client signature box
  doc.fontSize(10).font("Helvetica-Bold").text("Signature client", left, sigY);
  doc.fontSize(8).font("Helvetica").text("(Précédée de la mention \"Lu et approuvé\")", left, sigY + 12);
  doc.rect(left, sigY + 28, sigWidth, 60).stroke();

  doc.fontSize(10).font("Helvetica-Bold").text("Signature établissement", left + sigWidth + 40, sigY);
  doc.fontSize(8).font("Helvetica").text("Date et cachet", left + sigWidth + 40, sigY + 12);
  doc.rect(left + sigWidth + 40, sigY + 28, sigWidth, 60).stroke();

  // === FOOTER ===
  doc.moveDown(4);
  doc.fontSize(8).font("Helvetica").fillColor("#666").text(
    `Document généré le ${formatDateTime(new Date())} - Réf. ${intervention.id}`,
    left, doc.y, { align: "center", width: contentWidth }
  );

  doc.end();
  return done;
}
// =========== End PDF Generation ===========

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

    // Check if there's already an ongoing signature request for this docType
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

    // Gate INTERVENTION_DELIVERY: intervention must be closed
    if (documentType === "INTERVENTION_DELIVERY" && !intervention.closedAt) {
      return NextResponse.json(
        failure("L'intervention doit être clôturée pour envoyer le PV de restitution."),
        { status: 400 }
      );
    }

    // Generate the PDF INLINE (no HTTP fetch to avoid auth issues)
    console.log(`[Yousign] Generating PDF inline for intervention ${interventionId}, type: ${documentType}`);
    
    const pdfBuffer = await generateOrderPdfBuffer(intervention, client, intervention.garage);
    const docLabel = documentType === "INTERVENTION_DELIVERY" ? "PV" : "OR";
    const filename = `${docLabel}_${intervention.vehicle.plate.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

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
