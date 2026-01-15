/**
 * Order Master PDF Generator
 * Generates the "Ordre de Réparation / Accord client" document
 * Used for both preview and final signed version
 */

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { prisma } from "@/lib/prisma";
import { decryptClientData } from "@/lib/encryption";
import { selectLegalModules } from "@/lib/legal/selectLegalModules";
import { createHash } from "crypto";

// Types
export interface OrderMasterOptions {
  /** Include signature image (base64 PNG) */
  signatureImage?: string;
  /** Signer's declared name */
  signerName?: string;
  /** Signature date */
  signedAt?: Date;
  /** Include "SIGNÉ" watermark */
  showSignedWatermark?: boolean;
}

export interface OrderMasterResult {
  pdfBuffer: Buffer;
  sha256: string;
  filename: string;
  meta: {
    interventionId: string;
    garageId: number | null;
    vehiclePlate: string;
    clientName: string;
    generatedAt: Date;
  };
}

// Helpers
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

/**
 * Build the Order Master PDF for an intervention
 * @param interventionId - The intervention ID
 * @param options - Optional signature data to embed
 * @returns PDF buffer, hash, and metadata
 */
export async function buildOrderMasterPdf(
  interventionId: string,
  options: OrderMasterOptions = {}
): Promise<OrderMasterResult> {
  // 1. Fetch intervention with all related data
  const intervention = await prisma.intervention.findUnique({
    where: { id: interventionId },
    include: {
      vehicle: { include: { client: true } },
      garage: true,
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!intervention) {
    throw new Error(`Intervention ${interventionId} not found`);
  }

  // 2. Decrypt client data
  const clientRaw = intervention.vehicle.client as Record<string, unknown>;
  const client = decryptClientData(clientRaw) as {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  const garage = intervention.garage;
  const intv = intervention as Record<string, unknown>;

  // 3. Create PDF document
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

  // Helper functions
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

  // === HEADER ===
  doc.fontSize(18).font("Helvetica-Bold").text("ORDRE DE RÉPARATION", left, doc.y, { align: "center" });
  
  // Show "SIGNÉ" watermark if signed
  if (options.showSignedWatermark && options.signedAt) {
    doc.save();
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#059669");
    doc.text(`✓ SIGNÉ LE ${formatDateTime(options.signedAt)}`, { align: "center" });
    doc.restore();
    doc.fillColor("#000");
  }
  
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").text(`Date: ${formatDate(new Date())}`, { align: "center" });
  doc.moveDown(0.8);

  // === GARAGE INFO ===
  if (garage) {
    section("Établissement");
    row("Raison sociale", asText(garage.name));
    row("Adresse", asText(garage.address));
    row("Téléphone", asText(garage.phone));
    row("Email", asText(garage.email));
    row("SIRET", asText(garage.siret));
  }

  // === CLIENT INFO ===
  section("Client");
  row("Nom", `${client.firstName} ${client.lastName}`);
  row("Téléphone", asText(client.phone));
  row("Email", asText(client.email));
  row("Adresse", asText(client.address));

  // === VEHICLE INFO ===
  section("Véhicule");
  row("Immatriculation", intervention.vehicle.plate, true);
  row("Marque / Modèle", `${intervention.vehicle.brand} ${intervention.vehicle.model}`);
  row("VIN", asText(intervention.vehicle.vin));
  row("Carburant", asText(intervention.vehicle.fuel));
  row("Année", asText(intervention.vehicle.year));
  row("Kilométrage entrée", intv.odometerKm ? `${intv.odometerKm} km` : "Non renseigné");
  row("Date réception", formatDateTime(intervention.createdAt));

  // === INTERVENTION TYPE ===
  section("Nature de l'intervention");
  row("Type principal", intervention.type);
  if (intv.tags && Array.isArray(intv.tags) && intv.tags.length > 0) {
    row("Catégories", (intv.tags as string[]).join(", "));
  }

  // === INTAKE STATE ===
  section("État d'entrée et symptômes");

  if (intv.intakeChecklist && typeof intv.intakeChecklist === "object") {
    const checks = intv.intakeChecklist as Record<string, boolean>;
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
  doc.font("Helvetica").fontSize(10).text(asText(intv.intakeNotes, "Aucun symptôme décrit"), { width: contentWidth });

  // === ENTRY DOCUMENTS ===
  if (intervention.documents && intervention.documents.length > 0) {
    const entryDocs = intervention.documents.filter((d) => d.category === "ENTREE" || d.category === "DIAGNOSTIC");
    if (entryDocs.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica-Bold").text("Documents joints à l'entrée:", left, doc.y);
      doc.moveDown(0.2);
      entryDocs.forEach((d, i) => {
        doc.font("Helvetica").fontSize(9).text(`  ${i + 1}. ${d.fileName}`, left, doc.y);
      });
    }
  }

  // === ESTIMATE & AGREEMENT ===
  section("Estimation et accord");
  if (intv.amountCents && typeof intv.amountCents === "number") {
    row("Montant estimé", `${(intv.amountCents / 100).toFixed(2)} € TTC`);
  } else {
    row("Montant estimé", "À définir après diagnostic");
  }
  if (intv.agreementAt) {
    row("Accord client", `Validé le ${formatDateTime(intv.agreementAt as Date)}`);
    row("Méthode accord", asText(intv.agreementMethod, "Application"));
  } else {
    row("Accord client", "En attente");
  }

  // === AUTHORIZATIONS ===
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

  // === OBSERVATIONS ===
  doc.moveDown(1);
  section("Observations");
  doc.fontSize(9).font("Helvetica").text("", left, doc.y);
  // Empty zone for handwritten notes
  doc.moveDown(3);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ccc").lineWidth(0.3).stroke();
  doc.moveDown(0.5);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
  doc.moveDown(0.5);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();

  // === LEGAL CLAUSES (from intervention tags) ===
  const tags = (intv.tags as string[]) || [];
  const legalSelection = selectLegalModules(tags);
  
  doc.moveDown(1);
  section("Clauses applicables");
  
  // Display modules activated
  if (legalSelection.modules.length > 1) {
    doc.fontSize(8).font("Helvetica").fillColor("#666")
      .text(`Modules: ${legalSelection.modules.join(", ")}`, left, doc.y);
    doc.fillColor("#000");
    doc.moveDown(0.4);
  }
  
  // Display each clause
  legalSelection.clauses.forEach((clause, i) => {
    // Clause title with level indicator
    const prefix = clause.level === "important" ? "[!] " : "";
    doc.fontSize(9).font("Helvetica-Bold").text(`${i + 1}. ${prefix}${clause.title}`, left, doc.y, { width: contentWidth });
    doc.moveDown(0.2);
    
    // Clause text
    doc.font("Helvetica").fontSize(8).text(clause.text, left + 10, doc.y, { width: contentWidth - 20 });
    doc.moveDown(0.4);
  });

  // === LEGAL REFERENCES (annexe) ===
  if (legalSelection.allReferences.length > 0) {
    doc.moveDown(0.5);
    doc.fontSize(8).font("Helvetica-Bold").text("Références légales:", left, doc.y);
    doc.moveDown(0.2);
    
    // Deduplicate references
    const uniqueRefs = legalSelection.allReferences.filter((ref, i, arr) => 
      arr.findIndex(r => r.label === ref.label && r.articleRef === ref.articleRef) === i
    );
    
    uniqueRefs.forEach((ref) => {
      const refText = ref.articleRef 
        ? `• ${ref.label} (${ref.articleRef})`
        : `• ${ref.label}`;
      doc.font("Helvetica").fontSize(7).fillColor("#444").text(refText, left + 10, doc.y, { width: contentWidth - 20 });
      if (ref.sourceUrl) {
        doc.fillColor("#0066cc").text(`  ${ref.sourceUrl}`, left + 10, doc.y, { width: contentWidth - 20, link: ref.sourceUrl });
      }
      doc.fillColor("#000");
      doc.moveDown(0.15);
    });
  }

  doc.moveDown(0.3);
  doc.fontSize(7).fillColor("#888").text(
    `Version: v1.0 | Date: ${formatDate(new Date())} | Document généré par MotorSafe`,
    left, doc.y, { width: contentWidth }
  );
  doc.fillColor("#000");

  // === SIGNATURES ===
  doc.moveDown(1.5);
  const sigY = doc.y;
  const sigWidth = (contentWidth - 40) / 2;

  // Client signature box
  doc.fontSize(10).font("Helvetica-Bold").text("Signature client", left, sigY);
  doc.fontSize(8).font("Helvetica").text("(Précédée de la mention \"Lu et approuvé\")", left, sigY + 12);
  doc.rect(left, sigY + 28, sigWidth, 60).stroke();

  // If signature provided, embed it
  if (options.signerName && options.signedAt) {
    // Add "Lu et approuvé" text
    doc.fontSize(8).font("Helvetica").text("Lu et approuvé", left + 5, sigY + 32);
    
    // Add signer name
    doc.fontSize(10).font("Helvetica-Bold").text(options.signerName, left + 5, sigY + 45);
    
    // Add signature date
    doc.fontSize(7).font("Helvetica").fillColor("#666").text(
      `Signé le ${formatDateTime(options.signedAt)}`,
      left + 5, sigY + 60
    );
    doc.fillColor("#000");

    // If signature image provided, add it
    if (options.signatureImage) {
      try {
        // signatureImage should be base64 PNG data (without data:image/png;base64, prefix)
        const imgData = options.signatureImage.replace(/^data:image\/\w+;base64,/, "");
        const imgBuffer = Buffer.from(imgData, "base64");
        doc.image(imgBuffer, left + 5, sigY + 35, { width: sigWidth - 20, height: 45, fit: [sigWidth - 20, 45] });
      } catch (imgErr) {
        console.warn("Failed to embed signature image:", imgErr);
        // Continue without image
      }
    }
  }

  // Establishment signature box
  doc.fontSize(10).font("Helvetica-Bold").text("Signature établissement", left + sigWidth + 40, sigY);
  doc.fontSize(8).font("Helvetica").text("Date et cachet", left + sigWidth + 40, sigY + 12);
  doc.rect(left + sigWidth + 40, sigY + 28, sigWidth, 60).stroke();

  // === FOOTER ===
  doc.moveDown(4);
  doc.fontSize(8).font("Helvetica").fillColor("#666").text(
    `Document généré le ${formatDateTime(new Date())} - Réf. ${intervention.id}`,
    left, doc.y, { align: "center", width: contentWidth }
  );

  // 4. Finalize PDF
  doc.end();
  const pdfBuffer = await done;

  // 5. Calculate SHA256 hash
  const sha256 = createHash("sha256").update(pdfBuffer).digest("hex");

  // 6. Generate filename
  const plate = intervention.vehicle.plate.replace(/[^a-zA-Z0-9]/g, "-");
  const suffix = options.signedAt ? "_SIGNE" : "";
  const filename = `OR_${plate}_${formatDate(new Date()).replace(/\s/g, "-")}${suffix}.pdf`;

  return {
    pdfBuffer,
    sha256,
    filename,
    meta: {
      interventionId: intervention.id,
      garageId: garage?.id ?? null,
      vehiclePlate: intervention.vehicle.plate,
      clientName: `${client.firstName} ${client.lastName}`,
      generatedAt: new Date(),
    },
  };
}
