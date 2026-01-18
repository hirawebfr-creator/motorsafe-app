/**
 * WORKSHOP-OPS-01: Repair Order PDF Generator
 * 
 * Generates the "Ordre de Réparation" document with:
 * - Vehicle info
 * - Client info
 * - Intervention details
 * - Estimated price
 * - Legal clauses
 * - Signature zone
 */

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { prisma } from "@/lib/prisma";
import { decryptClientData } from "@/lib/encryption";
import { createHash } from "crypto";
import { getRepairOrderClauses } from "@/content/legal";

export interface RepairOrderPdfOptions {
  signatureImage?: string;
  signerName?: string;
  signedAt?: Date;
  showSignedWatermark?: boolean;
}

export interface RepairOrderPdfResult {
  pdfBuffer: Buffer;
  sha256: string;
  filename: string;
  meta: {
    repairOrderId: string;
    interventionId: string;
    garageId: number | null;
    vehiclePlate: string;
    clientName: string;
    generatedAt: Date;
  };
}

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

function formatAmount(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "À définir";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Build the Repair Order PDF
 */
export async function buildRepairOrderPdf(
  repairOrderId: string,
  options: RepairOrderPdfOptions = {}
): Promise<RepairOrderPdfResult> {
  // Fetch repair order with all related data
  const repairOrder = await prisma.repairOrder.findUnique({
    where: { id: repairOrderId },
    include: {
      intervention: {
        include: {
          vehicle: { include: { client: true } },
          garage: true,
        },
      },
    },
  });

  if (!repairOrder) {
    throw new Error(`RepairOrder ${repairOrderId} not found`);
  }

  const intervention = repairOrder.intervention;
  const vehicle = intervention.vehicle;
  const garage = intervention.garage;

  // Decrypt client data
  const clientRaw = vehicle.client as Record<string, unknown>;
  const client = decryptClientData(clientRaw) as {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  const clientName = `${client.firstName} ${client.lastName}`.trim();

  // Create PDF
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
  const garageName = garage?.displayName || garage?.name || "MotorSafe";
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a56db").text(garageName, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#000").text("ORDRE DE RÉPARATION", { align: "center" });
  doc.moveDown(0.3);

  // OR number and date
  doc.fontSize(10).font("Helvetica").fillColor("#666");
  doc.text(`N° OR: ${repairOrder.id.slice(0, 12).toUpperCase()}`, { align: "center" });
  doc.text(`Date: ${formatDate(repairOrder.createdAt)}`, { align: "center" });
  doc.moveDown(1);
  doc.fillColor("#000");

  // === GARAGE INFO ===
  section("Établissement");
  row("Nom:", garageName);
  if (garage?.address) row("Adresse:", garage.address);
  if (garage?.phone) row("Téléphone:", garage.phone);
  if (garage?.siret) row("SIRET:", garage.siret);

  // === CLIENT INFO ===
  section("Client");
  row("Nom:", clientName);
  if (client.phone) row("Téléphone:", client.phone);
  if (client.address) row("Adresse:", client.address);

  // === VEHICLE INFO ===
  section("Véhicule");
  row("Immatriculation:", vehicle.plate);
  row("Marque / Modèle:", `${vehicle.brand} ${vehicle.model}`);
  if (vehicle.vin) row("VIN:", vehicle.vin);

  // === INTERVENTION DETAILS ===
  section("Travaux à effectuer");
  row("Type:", asText(intervention.type));
  if (intervention.title) row("Titre:", intervention.title);
  if (intervention.notes) {
    doc.font("Helvetica").fontSize(10).text(intervention.notes, left, doc.y, { width: contentWidth });
    doc.moveDown(0.4);
  }
  if (intervention.tags && intervention.tags.length > 0) {
    row("Tags:", intervention.tags.join(", "));
  }

  // === ESTIMATED PRICE ===
  section("Montant estimé");
  const amountText = formatAmount(intervention.amountCents);
  doc.font("Helvetica-Bold").fontSize(12).text(`Montant TTC estimé: ${amountText}`, left, doc.y);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9).fillColor("#666");
  doc.text("Ce montant est indicatif. En cas de dépassement supérieur à 10%, vous serez contacté pour accord.", { width: contentWidth });
  doc.fillColor("#000");
  doc.moveDown(0.6);

  // === LEGAL CLAUSES ===
  section("Conditions générales");
  const clauses = getRepairOrderClauses();
  doc.font("Helvetica").fontSize(8).fillColor("#333");
  for (const clause of clauses) {
    doc.text(`• ${clause.title}: ${clause.text}`, left, doc.y, { width: contentWidth });
    doc.moveDown(0.2);
  }
  doc.fillColor("#000");

  // === SIGNATURE ZONE ===
  doc.moveDown(1);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ccc").lineWidth(0.5).stroke();
  doc.moveDown(0.5);

  doc.font("Helvetica-Bold").fontSize(10).text("Accord du client", left);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9);
  doc.text("En signant ce document, je reconnais avoir pris connaissance des travaux à effectuer et des conditions générales.", { width: contentWidth });
  doc.moveDown(0.5);

  // Signature box
  const sigBoxY = doc.y;
  const sigBoxWidth = 200;
  const sigBoxHeight = 80;

  doc.rect(left, sigBoxY, sigBoxWidth, sigBoxHeight).stroke();
  doc.fontSize(8).text("Signature client:", left + 5, sigBoxY + 5);

  if (options.signatureImage) {
    try {
      const sigBuffer = Buffer.from(options.signatureImage.replace(/^data:image\/\w+;base64,/, ""), "base64");
      doc.image(sigBuffer, left + 10, sigBoxY + 20, { width: sigBoxWidth - 20, height: sigBoxHeight - 30, fit: [sigBoxWidth - 20, sigBoxHeight - 30] });
    } catch {
      // Ignore signature image errors
    }
  }

  // Date and name next to signature
  doc.fontSize(9).text("Date:", left + sigBoxWidth + 20, sigBoxY + 10);
  doc.text(options.signedAt ? formatDate(options.signedAt) : "_______________", left + sigBoxWidth + 60, sigBoxY + 10);
  doc.text("Nom:", left + sigBoxWidth + 20, sigBoxY + 30);
  doc.text(options.signerName || "_______________", left + sigBoxWidth + 60, sigBoxY + 30);

  // Signed watermark
  if (options.showSignedWatermark) {
    doc.save();
    doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.fontSize(60).fillColor("#00800030").text("SIGNÉ", 100, 400);
    doc.restore();
  }

  // Footer with hash placeholder
  doc.fontSize(7).fillColor("#999");
  doc.text(`Document généré le ${new Date().toISOString()} | Hash: [COMPUTED]`, left, doc.page.height - 50, { align: "center", width: contentWidth });
  doc.text("Généré avec SafeMotor — motorsafe.fr", left, doc.page.height - 40, { align: "center", width: contentWidth });
  doc.fillColor("#000");

  doc.end();
  const pdfBuffer = await done;

  // Compute hash
  const sha256 = createHash("sha256").update(pdfBuffer).digest("hex");

  return {
    pdfBuffer,
    sha256,
    filename: `OR-${repairOrder.id.slice(0, 8)}-${vehicle.plate.replace(/\s/g, "")}.pdf`,
    meta: {
      repairOrderId: repairOrder.id,
      interventionId: intervention.id,
      garageId: intervention.garageId,
      vehiclePlate: vehicle.plate,
      clientName,
      generatedAt: new Date(),
    },
  };
}
