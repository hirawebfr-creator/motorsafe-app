/**
 * INSURANCE-READY-EXPORT-03: Expert Dossier PDF Generator
 * 
 * Generates a comprehensive PDF for insurance experts containing:
 * - Cover page with garage/vehicle info
 * - Summary page
 * - Timeline (tamper-evident events)
 * - Key photos
 * - Standardized Q&A
 * - Integrity references
 */

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { createHash } from "crypto";
import path from "path";
import fs from "fs";
import type { ExpertPackData } from "@/lib/export/expertPack";

// ============================================
// TYPES
// ============================================

export interface GarageInfo {
  name: string;
  displayName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  siret?: string | null;
  logoKey?: string | null;
}

export interface VehicleInfo {
  plate: string;
  brand?: string | null;
  model?: string | null;
  vin?: string | null;
  mileageIn?: number | null;
  mileageOut?: number | null;
}

export interface InterventionInfo {
  id: string;
  reference?: string | null;
  entryDate?: Date | null;
  exitDate?: Date | null;
  clientName?: string;
}

export interface ExpertPdfResult {
  pdfBuffer: Buffer;
  sha256: string;
  filename: string;
}

// ============================================
// HELPERS
// ============================================

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Non renseigné";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Non renseigné";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "Non renseigné";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Non renseigné";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskVin(vin: string | null | undefined, mask: boolean): string {
  if (!vin) return "Non renseigné";
  if (!mask) return vin;
  // Mask middle characters: WVW***********1234
  if (vin.length < 8) return vin;
  return vin.slice(0, 3) + "*".repeat(vin.length - 7) + vin.slice(-4);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getY(doc: any): number {
  return typeof doc.y === "number" ? doc.y : Number(doc.y);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkNewPage(doc: any, requiredSpace: number = 100): void {
  if (getY(doc) > doc.page.height - doc.page.margins.bottom - requiredSpace) {
    doc.addPage();
  }
}

// ============================================
// PDF GENERATOR
// ============================================

export async function generateExpertDossierPdf(params: {
  garage: GarageInfo;
  vehicle: VehicleInfo;
  intervention: InterventionInfo;
  data: ExpertPackData;
  exportDate: Date;
  manifestHash?: string;
  chainValid: boolean;
  chainEntries: number;
  maskVin?: boolean;
  fetchPhoto?: (url: string) => Promise<Buffer | null>;
}): Promise<ExpertPdfResult> {
  const {
    garage,
    vehicle,
    intervention,
    data,
    exportDate,
    manifestHash,
    chainValid,
    chainEntries,
    maskVin: shouldMaskVin = false,
    fetchPhoto,
  } = params;

  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;

  // Colors
  const primaryColor = "#1E3A5F";
  const accentColor = "#2E7D32";
  const grayColor = "#666666";

  // ========================================
  // PAGE 1: COVER
  // ========================================
  
  let y = getY(doc);

  // Logo
  const garageName = garage.displayName || garage.name || "Garage";
  let hasLogo = false;
  if (garage.logoKey) {
    try {
      const logoPath = path.join(process.cwd(), "uploads", garage.logoKey);
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        doc.image(logoBuffer, left, y, { width: 80, height: 50, fit: [80, 50] });
        hasLogo = true;
      }
    } catch {
      // Continue without logo
    }
  }

  // Title
  const titleX = hasLogo ? left + 100 : left;
  doc.fontSize(22).font("Helvetica-Bold").fillColor(primaryColor);
  doc.text("DOSSIER EXPERT", titleX, y, { width: contentWidth - (hasLogo ? 100 : 0) });
  y = getY(doc) + 5;

  doc.fontSize(14).font("Helvetica").fillColor(grayColor);
  doc.text(`Intervention ${intervention.reference || intervention.id}`, titleX, y);
  y = getY(doc) + 30;

  // Divider
  doc.moveTo(left, y).lineTo(right, y).strokeColor(primaryColor).lineWidth(2).stroke();
  y += 25;

  // Vehicle box
  doc.roundedRect(left, y, contentWidth, 100, 5).fillColor("#F5F5F5").fill();
  y += 15;

  doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor);
  doc.text("VÉHICULE", left + 15, y);
  y += 20;

  doc.fontSize(11).font("Helvetica").fillColor("#000000");
  const vehicleLabel = `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() || "Non renseigné";
  doc.text(`Marque / Modèle: ${vehicleLabel}`, left + 15, y);
  y += 16;
  doc.text(`Immatriculation: ${vehicle.plate}`, left + 15, y);
  y += 16;
  doc.text(`VIN: ${maskVin(vehicle.vin, shouldMaskVin)}`, left + 15, y);
  y += 16;
  const kmText = vehicle.mileageIn
    ? `${vehicle.mileageIn.toLocaleString("fr-FR")} km${vehicle.mileageOut ? ` → ${vehicle.mileageOut.toLocaleString("fr-FR")} km` : ""}`
    : "Non renseigné";
  doc.text(`Kilométrage: ${kmText}`, left + 15, y);
  y += 35;

  // Garage box
  doc.roundedRect(left, y, contentWidth, 80, 5).strokeColor(primaryColor).lineWidth(1).stroke();
  y += 15;

  doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor);
  doc.text("GARAGE", left + 15, y);
  y += 18;

  doc.fontSize(10).font("Helvetica").fillColor("#000000");
  doc.text(garageName, left + 15, y);
  y += 14;
  const addressParts = [garage.addressLine1, garage.addressLine2, `${garage.postalCode || ""} ${garage.city || ""}`.trim()].filter(Boolean);
  if (addressParts.length > 0) {
    doc.text(addressParts.join(", "), left + 15, y);
    y += 14;
  }
  if (garage.siret) {
    doc.text(`SIRET: ${garage.siret}`, left + 15, y);
    y += 14;
  }
  y += 25;

  // Dates box
  doc.roundedRect(left, y, contentWidth, 60, 5).strokeColor(accentColor).lineWidth(1).stroke();
  y += 15;

  doc.fontSize(11).font("Helvetica").fillColor("#000000");
  doc.text(`Date d'entrée: ${formatDate(intervention.entryDate)}`, left + 15, y);
  y += 16;
  doc.text(`Date de sortie: ${formatDate(intervention.exitDate)}`, left + 15, y);
  y += 16;
  doc.text(`Date d'export: ${formatDate(exportDate)}`, left + 15, y);
  y += 40;

  // Summary box
  doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor);
  doc.text("RÉSUMÉ", left, y);
  y += 20;

  doc.fontSize(10).font("Helvetica").fillColor("#000000");
  doc.text(`Type d'intervention: ${data.summary.interventionType}`, left, y);
  y += 14;
  doc.text(`Résultat: ${data.summary.result}`, left, y);
  y += 14;
  doc.text(`Documents signés: ${data.summary.signedDocsCount}`, left, y);
  y += 14;
  
  const motifTrunc = data.summary.motif.length > 200 ? data.summary.motif.slice(0, 200) + "..." : data.summary.motif;
  doc.text(`Motif: ${motifTrunc}`, left, y, { width: contentWidth });

  // ========================================
  // PAGE 2: TIMELINE
  // ========================================
  doc.addPage();
  y = getY(doc);

  doc.fontSize(16).font("Helvetica-Bold").fillColor(primaryColor);
  doc.text("CHRONOLOGIE DES ÉVÉNEMENTS", left, y);
  y = getY(doc) + 20;

  doc.moveTo(left, y).lineTo(right, y).strokeColor(primaryColor).lineWidth(1).stroke();
  y += 15;

  if (data.timeline.length === 0) {
    doc.fontSize(10).font("Helvetica").fillColor(grayColor);
    doc.text("Aucun événement enregistré.", left, y);
  } else {
    for (const event of data.timeline) {
      checkNewPage(doc, 60);
      y = getY(doc);

      // Timeline dot
      doc.circle(left + 8, y + 8, 4).fillColor(accentColor).fill();
      doc.moveTo(left + 8, y + 12).lineTo(left + 8, y + 50).strokeColor("#CCCCCC").lineWidth(1).stroke();

      // Event content
      doc.fontSize(9).font("Helvetica").fillColor(grayColor);
      doc.text(formatDateTime(event.timestamp), left + 25, y);
      y += 12;

      doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000");
      doc.text(event.title, left + 25, y, { width: contentWidth - 40 });
      y = getY(doc) + 3;

      if (event.description) {
        doc.fontSize(9).font("Helvetica").fillColor(grayColor);
        const descTrunc = event.description.length > 150 ? event.description.slice(0, 150) + "..." : event.description;
        doc.text(descTrunc, left + 25, y, { width: contentWidth - 40 });
        y = getY(doc);
      }

      if (event.attachmentRef) {
        doc.fontSize(8).font("Helvetica").fillColor(accentColor);
        doc.text(`📎 ${event.attachmentRef}`, left + 25, y);
        y = getY(doc);
      }

      y += 15;
      doc.y = y;
    }
  }

  // ========================================
  // PAGE 3+: PHOTOS
  // ========================================
  if (data.photos.length > 0 && fetchPhoto) {
    doc.addPage();
    y = getY(doc);

    doc.fontSize(16).font("Helvetica-Bold").fillColor(primaryColor);
    doc.text("PHOTOS CLÉS", left, y);
    y = getY(doc) + 20;

    doc.moveTo(left, y).lineTo(right, y).strokeColor(primaryColor).lineWidth(1).stroke();
    y += 20;

    const photoWidth = (contentWidth - 20) / 2;
    const photoHeight = 120;
    let col = 0;

    for (const photo of data.photos.slice(0, 12)) {
      // Max 12 photos (6 per page, 2 pages)
      checkNewPage(doc, photoHeight + 50);

      if (col === 0) {
        y = getY(doc);
      }

      const x = left + col * (photoWidth + 20);

      try {
        const buffer = await fetchPhoto(photo.url);
        if (buffer) {
          doc.image(buffer, x, y, { width: photoWidth, height: photoHeight, fit: [photoWidth, photoHeight] });
        } else {
          // Placeholder
          doc.rect(x, y, photoWidth, photoHeight).strokeColor("#CCCCCC").stroke();
          doc.fontSize(9).fillColor(grayColor).text("Image indisponible", x + 10, y + 50);
        }
      } catch {
        doc.rect(x, y, photoWidth, photoHeight).strokeColor("#CCCCCC").stroke();
        doc.fontSize(9).fillColor(grayColor).text("Erreur chargement", x + 10, y + 50);
      }

      // Caption
      doc.fontSize(8).font("Helvetica").fillColor(grayColor);
      doc.text(`${photo.reference} - ${photo.category}`, x, y + photoHeight + 5, { width: photoWidth });
      doc.text(formatDate(photo.createdAt), x, y + photoHeight + 15, { width: photoWidth });

      col++;
      if (col >= 2) {
        col = 0;
        doc.y = y + photoHeight + 35;
      }
    }
  }

  // ========================================
  // Q&A PAGE
  // ========================================
  doc.addPage();
  y = getY(doc);

  doc.fontSize(16).font("Helvetica-Bold").fillColor(primaryColor);
  doc.text("QUESTIONS / RÉPONSES STANDARDISÉES", left, y);
  y = getY(doc) + 20;

  doc.moveTo(left, y).lineTo(right, y).strokeColor(primaryColor).lineWidth(1).stroke();
  y += 20;

  doc.fontSize(9).font("Helvetica").fillColor(grayColor);
  doc.text("Ces réponses sont générées automatiquement à partir des données enregistrées.", left, y);
  y = getY(doc) + 20;

  for (let i = 0; i < data.qa.length; i++) {
    const qa = data.qa[i];
    checkNewPage(doc, 60);
    y = getY(doc);

    // Question
    doc.fontSize(10).font("Helvetica-Bold").fillColor(primaryColor);
    doc.text(`Q${i + 1}: ${qa.question}`, left, y, { width: contentWidth });
    y = getY(doc) + 5;

    // Answer
    doc.fontSize(10).font("Helvetica").fillColor("#000000");
    const answerTrunc = qa.answer.length > 300 ? qa.answer.slice(0, 300) + "..." : qa.answer;
    doc.text(answerTrunc, left + 15, y, { width: contentWidth - 15 });
    y = getY(doc) + 15;

    doc.y = y;
  }

  // ========================================
  // INTEGRITY PAGE (Last)
  // ========================================
  doc.addPage();
  y = getY(doc);

  doc.fontSize(16).font("Helvetica-Bold").fillColor(primaryColor);
  doc.text("RÉFÉRENCES D'INTÉGRITÉ", left, y);
  y = getY(doc) + 20;

  doc.moveTo(left, y).lineTo(right, y).strokeColor(primaryColor).lineWidth(1).stroke();
  y += 25;

  // Integrity status
  const integrityColor = chainValid ? accentColor : "#D32F2F";
  doc.roundedRect(left, y, contentWidth, 80, 5).fillColor(chainValid ? "#E8F5E9" : "#FFEBEE").fill();
  y += 20;

  doc.fontSize(14).font("Helvetica-Bold").fillColor(integrityColor);
  doc.text(chainValid ? "✓ CHAÎNE DE PREUVES VALIDE" : "⚠ CHAÎNE DE PREUVES NON VÉRIFIÉE", left + 15, y);
  y += 25;

  doc.fontSize(10).font("Helvetica").fillColor("#000000");
  doc.text(`Nombre d'entrées dans la chaîne: ${chainEntries}`, left + 15, y);
  y += 40;

  // Manifest hash
  if (manifestHash) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor(primaryColor);
    doc.text("Référence manifest:", left, y);
    y += 15;
    doc.fontSize(9).font("Courier").fillColor(grayColor);
    doc.text(manifestHash, left, y, { width: contentWidth });
    y = getY(doc) + 20;
  }

  // Note
  doc.fontSize(9).font("Helvetica").fillColor(grayColor);
  doc.text(
    "Les pièces sources sont listées dans l'index des pièces (02_INDEX_PIECES.pdf) avec leurs empreintes SHA-256.",
    left,
    y,
    { width: contentWidth }
  );
  y = getY(doc) + 20;

  doc.text(
    "Ce dossier a été généré automatiquement par SafeMotor. Toute modification externe invaliderait les références d'intégrité.",
    left,
    y,
    { width: contentWidth }
  );

  // Footer on all pages
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 30;
    doc.fontSize(8).font("Helvetica").fillColor(grayColor);
    doc.text(`Page ${i + 1}/${pageCount}`, left, footerY, { align: "center", width: contentWidth });
    doc.text(`Dossier Expert - ${intervention.reference || intervention.id}`, left, footerY, { align: "right", width: contentWidth });
  }

  // Finalize
  doc.end();

  // Wait for stream to finish
  await new Promise<void>((resolve) => doc.on("end", resolve));

  const pdfBuffer = Buffer.concat(chunks);
  const pdfHash = sha256(pdfBuffer);
  const filename = `01B_DOSSIER_EXPERT_${vehicle.plate.replace(/\s/g, "_")}_${formatDate(exportDate).replace(/\s/g, "_")}.pdf`;

  return {
    pdfBuffer,
    sha256: pdfHash,
    filename,
  };
}
