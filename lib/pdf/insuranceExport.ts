/**
 * INSURANCE-READY-EXPORT-02: PDF Generators for Insurance Export
 * 
 * Generates:
 * - Cover letter (Lettre d'accompagnement) with garage branding
 * - Index of documents (Index des pièces) with SHA256 hashes
 */

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { createHash } from "crypto";
import path from "path";
import fs from "fs";

// Types
export interface ExportFileInfo {
  path: string;
  sha256: string;
  sizeBytes: number;
  description: string;
  category: string;
  createdAt?: Date | string;
}

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

export interface InterventionExportInfo {
  id: string;
  reference?: string | null;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleVin?: string | null;
  clientName: string;
  mileageIn?: number | null;
  mileageOut?: number | null;
  entryDate?: Date | string | null;
  exitDate?: Date | string | null;
  status: string;
  description?: string | null;
  totalTTC?: number | null;
}

export interface CoverLetterResult {
  pdfBuffer: Buffer;
  sha256: string;
  filename: string;
}

export interface IndexResult {
  pdfBuffer: Buffer;
  sha256: string;
  filename: string;
}

// Helpers
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
  return d.toLocaleString("fr-FR", { 
    day: "2-digit", 
    month: "long", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function sha256Hash(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getY(doc: any): number {
  return typeof doc.y === 'number' ? doc.y : Number(doc.y);
}

/**
 * Generate cover letter PDF (01_LETTRE_ACCOMPAGNEMENT.pdf)
 */
export async function generateCoverLetterPdf(params: {
  garage: GarageInfo;
  intervention: InterventionExportInfo;
  exportDate: Date;
  filesCount: number;
  totalSize: number;
  chainValid: boolean;
  chainEntries: number;
}): Promise<CoverLetterResult> {
  const { garage, intervention, exportDate, filesCount, totalSize, chainValid, chainEntries } = params;

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;

  // === HEADER with garage branding ===
  let headerY = getY(doc);
  const garageName = garage.displayName || garage.name || "Garage";

  // Try to load logo
  let hasLogo = false;
  if (garage.logoKey) {
    try {
      const logoPath = path.join(process.cwd(), "uploads", garage.logoKey);
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        doc.image(logoBuffer, left, headerY, { width: 80, height: 40, fit: [80, 40] });
        hasLogo = true;
      }
    } catch {
      // Continue without logo
    }
  }

  if (hasLogo) {
    doc.fontSize(16).font("Helvetica-Bold").text(garageName, left + 90, headerY, { width: contentWidth - 100 });
    const addrParts = [
      garage.addressLine1,
      garage.addressLine2,
      [garage.postalCode, garage.city].filter(Boolean).join(" "),
    ].filter(Boolean);
    if (addrParts.length > 0) {
      doc.fontSize(9).font("Helvetica").fillColor("#666").text(addrParts.join(" — "), left + 90, getY(doc));
    }
    const contactParts = [garage.phone, garage.email].filter(Boolean);
    if (contactParts.length > 0) {
      doc.fontSize(9).font("Helvetica").text(contactParts.join(" • "), left + 90, getY(doc));
    }
    if (garage.siret) {
      doc.fontSize(8).text(`SIRET : ${garage.siret}`, left + 90, getY(doc));
    }
    doc.fillColor("#000");
    doc.y = Math.max(getY(doc), headerY + 50);
  } else {
    doc.fontSize(16).font("Helvetica-Bold").text(garageName, left, headerY, { align: "center", width: contentWidth });
    const addrParts = [
      garage.addressLine1,
      [garage.postalCode, garage.city].filter(Boolean).join(" "),
    ].filter(Boolean);
    if (addrParts.length > 0) {
      doc.fontSize(9).font("Helvetica").fillColor("#666").text(addrParts.join(" — "), { align: "center", width: contentWidth });
    }
    if (garage.siret) {
      doc.fontSize(8).text(`SIRET : ${garage.siret}`, { align: "center", width: contentWidth });
    }
    doc.fillColor("#000");
  }

  doc.moveDown(1);
  doc.moveTo(left, getY(doc)).lineTo(right, getY(doc)).strokeColor("#ccc").lineWidth(0.5).stroke();
  doc.moveDown(1);

  // Date and reference
  doc.fontSize(10).font("Helvetica").text(`${formatDate(exportDate)}`, { align: "right", width: contentWidth });
  doc.moveDown(0.5);

  // Title
  doc.moveDown(1);
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a365d").text("DOSSIER D'INTERVENTION COMPLET", { align: "center", width: contentWidth });
  doc.fontSize(12).font("Helvetica").fillColor("#666").text("Export pour expertise / assurance", { align: "center", width: contentWidth });
  doc.fillColor("#000");
  doc.moveDown(1.5);

  // Introduction
  doc.fontSize(11).font("Helvetica").text("Madame, Monsieur,", left, getY(doc));
  doc.moveDown(0.8);
  doc.text(`Veuillez trouver ci-joint le dossier complet relatif à l'intervention sur le véhicule identifié ci-dessous. Ce dossier a été exporté depuis notre système de gestion Motorsafe et contient l'ensemble des pièces justificatives associées à cette intervention.`, left, getY(doc), { width: contentWidth, align: "justify" });
  doc.moveDown(1.5);

  // Vehicle info box
  const boxY = getY(doc);
  doc.rect(left, boxY, contentWidth, 110).fillAndStroke("#f7fafc", "#e2e8f0");
  doc.fillColor("#000");

  doc.fontSize(11).font("Helvetica-Bold").text("VÉHICULE CONCERNÉ", left + 15, boxY + 12);
  doc.moveDown(0.3);
  
  const labelCol = left + 15;
  const valueCol = left + 150;
  let rowY = boxY + 30;

  const addRow = (label: string, value: string) => {
    doc.fontSize(10).font("Helvetica").fillColor("#666").text(label, labelCol, rowY);
    doc.font("Helvetica-Bold").fillColor("#000").text(value, valueCol, rowY);
    rowY += 16;
  };

  addRow("Immatriculation :", intervention.vehiclePlate);
  addRow("Marque / Modèle :", `${intervention.vehicleBrand} ${intervention.vehicleModel}`);
  if (intervention.vehicleVin) {
    addRow("VIN :", intervention.vehicleVin);
  }
  addRow("Client :", intervention.clientName);

  doc.y = boxY + 120;
  doc.moveDown(1);

  // Intervention info box
  const intBoxY = getY(doc);
  doc.rect(left, intBoxY, contentWidth, 130).fillAndStroke("#fffdf7", "#eab308");
  doc.fillColor("#000");

  doc.fontSize(11).font("Helvetica-Bold").text("DÉTAILS DE L'INTERVENTION", left + 15, intBoxY + 12);
  doc.moveDown(0.3);

  rowY = intBoxY + 30;
  addRow("Référence :", intervention.reference || intervention.id);
  addRow("Date d'entrée :", formatDate(intervention.entryDate));
  addRow("Date de sortie :", formatDate(intervention.exitDate));
  if (intervention.mileageIn) {
    addRow("Kilométrage entrée :", `${intervention.mileageIn.toLocaleString("fr-FR")} km`);
  }
  if (intervention.mileageOut) {
    addRow("Kilométrage sortie :", `${intervention.mileageOut.toLocaleString("fr-FR")} km`);
  }
  addRow("Statut :", intervention.status);

  doc.y = intBoxY + 140;
  doc.moveDown(1);

  // Content summary
  doc.fontSize(11).font("Helvetica-Bold").text("CONTENU DU DOSSIER", left, getY(doc));
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica").text(`Ce dossier contient ${filesCount} fichiers pour un total de ${formatBytes(totalSize)}.`, left, getY(doc), { width: contentWidth });
  doc.moveDown(0.5);

  // Folder structure
  doc.text("Structure du dossier :", left, getY(doc));
  doc.moveDown(0.3);
  const folders = [
    "00_README.txt — Instructions de lecture",
    "01_LETTRE_ACCOMPAGNEMENT.pdf — Ce document",
    "02_INDEX_PIECES.pdf — Index avec empreintes SHA256",
    "03_DOCUMENTS_SIGNES/ — Documents signés (OR, devis, factures)",
    "04_PREUVES_SIGNATURE/ — Preuves de signature électronique",
    "05_PHOTOS/ — Photos du véhicule",
    "06_TECH/ — Rapports techniques",
    "07_AUDIT/ — Journal d'audit",
    "08_CHAINE_PREUVE/ — Chaîne de preuves cryptographique",
    "09_INTEGRITE/ — Manifest et rapport d'intégrité",
  ];
  for (const folder of folders) {
    doc.text(`  • ${folder}`, left + 15, getY(doc), { width: contentWidth - 20 });
    doc.moveDown(0.2);
  }
  doc.moveDown(1);

  // Integrity section
  doc.fontSize(11).font("Helvetica-Bold").text("INTÉGRITÉ ET AUTHENTICITÉ", left, getY(doc));
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");

  if (chainValid) {
    doc.fillColor("#166534").text("✓ Chaîne de preuves vérifiée : INTÈGRE", left, getY(doc));
  } else {
    doc.fillColor("#dc2626").text("✗ Attention : Anomalie détectée dans la chaîne", left, getY(doc));
  }
  doc.fillColor("#000");
  doc.moveDown(0.3);
  doc.text(`Nombre d'événements dans la chaîne : ${chainEntries}`, left, getY(doc));
  doc.moveDown(0.5);
  doc.text("Chaque document inclus possède une empreinte SHA256 permettant de vérifier son intégrité. L'index des pièces (02_INDEX_PIECES.pdf) détaille ces empreintes.", left, getY(doc), { width: contentWidth, align: "justify" });
  doc.moveDown(1.5);

  // Closing
  doc.text("Nous restons à votre disposition pour tout complément d'information.", left, getY(doc));
  doc.moveDown(1);
  doc.text("Cordialement,", left, getY(doc));
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").text(garageName, left, getY(doc));
  if (garage.phone || garage.email) {
    doc.font("Helvetica").fontSize(9).fillColor("#666");
    doc.text([garage.phone, garage.email].filter(Boolean).join(" • "), left, getY(doc));
    doc.fillColor("#000");
  }

  // Footer
  doc.fontSize(8).fillColor("#999");
  doc.text(
    `Document généré automatiquement par Motorsafe — ${formatDateTime(exportDate)}`,
    left,
    doc.page.height - 50,
    { width: contentWidth, align: "center" }
  );

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const sha256 = sha256Hash(pdfBuffer);
      resolve({
        pdfBuffer,
        sha256,
        filename: "01_LETTRE_ACCOMPAGNEMENT.pdf",
      });
    });
  });
}

/**
 * Generate index of documents PDF (02_INDEX_PIECES.pdf)
 */
export async function generateIndexPdf(params: {
  garage: GarageInfo;
  intervention: InterventionExportInfo;
  exportDate: Date;
  files: ExportFileInfo[];
  manifestHash: string;
}): Promise<IndexResult> {
  const { garage, intervention, exportDate, files, manifestHash } = params;

  const doc = new PDFDocument({ size: "A4", margin: 40, layout: "landscape" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;
  const garageName = garage.displayName || garage.name || "Garage";

  // Header
  doc.fontSize(14).font("Helvetica-Bold").text("INDEX DES PIÈCES JUSTIFICATIVES", left, 30, { width: contentWidth, align: "center" });
  doc.fontSize(10).font("Helvetica").fillColor("#666").text(`Intervention ${intervention.reference || intervention.id} — ${intervention.vehiclePlate}`, left, getY(doc), { width: contentWidth, align: "center" });
  doc.text(`Exporté le ${formatDateTime(exportDate)} par ${garageName}`, left, getY(doc), { width: contentWidth, align: "center" });
  doc.fillColor("#000");
  doc.moveDown(1);

  // Table header
  const tableTop = getY(doc);
  const col = {
    num: left,
    cat: left + 30,
    file: left + 120,
    desc: left + 320,
    size: left + 520,
    hash: left + 580,
  };
  const colWidth = {
    num: 28,
    cat: 88,
    file: 198,
    desc: 198,
    size: 58,
    hash: contentWidth - 580,
  };

  // Header row
  doc.rect(left, tableTop, contentWidth, 20).fill("#1a365d");
  doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");
  doc.text("N°", col.num + 3, tableTop + 6, { width: colWidth.num });
  doc.text("Catégorie", col.cat + 3, tableTop + 6, { width: colWidth.cat });
  doc.text("Fichier", col.file + 3, tableTop + 6, { width: colWidth.file });
  doc.text("Description", col.desc + 3, tableTop + 6, { width: colWidth.desc });
  doc.text("Taille", col.size + 3, tableTop + 6, { width: colWidth.size });
  doc.text("SHA256 (8 premiers caractères)", col.hash + 3, tableTop + 6, { width: colWidth.hash });
  doc.fillColor("#000");

  let rowY = tableTop + 22;
  let rowNum = 1;
  const rowHeight = 14;
  const maxRowsPerPage = 30;
  let rowsOnPage = 0;

  for (const file of files) {
    // Check if we need a new page
    if (rowsOnPage >= maxRowsPerPage) {
      doc.addPage({ layout: "landscape" });
      rowY = 40;
      rowsOnPage = 0;

      // Repeat header
      doc.rect(left, rowY, contentWidth, 20).fill("#1a365d");
      doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");
      doc.text("N°", col.num + 3, rowY + 6, { width: colWidth.num });
      doc.text("Catégorie", col.cat + 3, rowY + 6, { width: colWidth.cat });
      doc.text("Fichier", col.file + 3, rowY + 6, { width: colWidth.file });
      doc.text("Description", col.desc + 3, rowY + 6, { width: colWidth.desc });
      doc.text("Taille", col.size + 3, rowY + 6, { width: colWidth.size });
      doc.text("SHA256", col.hash + 3, rowY + 6, { width: colWidth.hash });
      doc.fillColor("#000");
      rowY += 22;
    }

    // Alternating row colors
    if (rowNum % 2 === 0) {
      doc.rect(left, rowY, contentWidth, rowHeight).fill("#f7fafc");
    }
    doc.fillColor("#000").fontSize(7).font("Helvetica");

    doc.text(String(rowNum), col.num + 3, rowY + 3, { width: colWidth.num });
    doc.text(file.category, col.cat + 3, rowY + 3, { width: colWidth.cat });
    doc.text(file.path.split("/").pop() || file.path, col.file + 3, rowY + 3, { width: colWidth.file });
    doc.text(file.description.substring(0, 40), col.desc + 3, rowY + 3, { width: colWidth.desc });
    doc.text(formatBytes(file.sizeBytes), col.size + 3, rowY + 3, { width: colWidth.size });
    doc.font("Courier").text(file.sha256.substring(0, 8) + "...", col.hash + 3, rowY + 3, { width: colWidth.hash });
    doc.font("Helvetica");

    rowY += rowHeight;
    rowNum++;
    rowsOnPage++;
  }

  // Summary section
  doc.moveDown(2);
  const totalSize = files.reduce((sum, f) => sum + f.sizeBytes, 0);

  // Draw summary box
  const summaryY = rowY + 20;
  doc.rect(left, summaryY, 300, 60).fillAndStroke("#fffdf7", "#eab308");
  doc.fillColor("#000").fontSize(9).font("Helvetica-Bold");
  doc.text("RÉSUMÉ", left + 10, summaryY + 8);
  doc.font("Helvetica").fontSize(8);
  doc.text(`Total fichiers : ${files.length}`, left + 10, summaryY + 22);
  doc.text(`Taille totale : ${formatBytes(totalSize)}`, left + 10, summaryY + 34);
  doc.text(`Hash manifest : ${manifestHash.substring(0, 16)}...`, left + 10, summaryY + 46);

  // Integrity notice
  doc.rect(left + 320, summaryY, contentWidth - 320, 60).fillAndStroke("#f0fdf4", "#22c55e");
  doc.fillColor("#166534").fontSize(9).font("Helvetica-Bold");
  doc.text("VÉRIFICATION D'INTÉGRITÉ", left + 330, summaryY + 8);
  doc.font("Helvetica").fontSize(8);
  doc.text("Pour vérifier l'intégrité d'un fichier :", left + 330, summaryY + 22);
  doc.text("1. Calculez le SHA256 du fichier avec un outil standard", left + 330, summaryY + 34);
  doc.text("2. Comparez avec le hash indiqué dans 09_INTEGRITE/manifest.json", left + 330, summaryY + 46);

  // Footer
  doc.fillColor("#999").fontSize(7);
  doc.text(
    `Index généré automatiquement par Motorsafe — Document ${rowNum - 1} fichiers — ${formatDateTime(exportDate)}`,
    left,
    doc.page.height - 30,
    { width: contentWidth, align: "center" }
  );

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const sha256 = sha256Hash(pdfBuffer);
      resolve({
        pdfBuffer,
        sha256,
        filename: "02_INDEX_PIECES.pdf",
      });
    });
  });
}

/**
 * Generate README.txt for the export
 */
export function generateReadmeTxt(params: {
  garageName: string;
  interventionRef: string;
  vehiclePlate: string;
  exportDate: Date;
}): { content: string; sha256: string } {
  const { garageName, interventionRef, vehiclePlate, exportDate } = params;

  const content = `===============================================================================
                     DOSSIER D'INTERVENTION MOTORSAFE
===============================================================================

Garage        : ${garageName}
Intervention  : ${interventionRef}
Véhicule      : ${vehiclePlate}
Date export   : ${formatDateTime(exportDate)}

-------------------------------------------------------------------------------
                          CONTENU DU DOSSIER
-------------------------------------------------------------------------------

Ce dossier contient l'ensemble des pièces justificatives relatives à 
l'intervention mentionnée ci-dessus. Il est structuré comme suit :

  00_README.txt                 Ce fichier
  01_LETTRE_ACCOMPAGNEMENT.pdf  Lettre de présentation avec en-tête garage
  02_INDEX_PIECES.pdf           Index de tous les documents avec empreintes

  03_DOCUMENTS_SIGNES/          Documents signés électroniquement
    - Ordres de réparation
    - Devis validés
    - Factures

  04_PREUVES_SIGNATURE/         Preuves de signature électronique
    - Certificats de signature
    - Horodatages

  05_PHOTOS/                    Photos du véhicule
    - Photos d'entrée
    - Photos de sortie
    - Constats dégâts

  06_TECH/                      Rapports techniques
    - Diagnostics
    - Rapports de contrôle

  07_AUDIT/                     Journal d'audit complet
    - Toutes les actions horodatées

  08_CHAINE_PREUVE/             Chaîne de preuves cryptographique
    - Hash chain inviolable
    - Événements chronologiques

  09_INTEGRITE/                 Fichiers de vérification
    - manifest.json      Liste de tous les fichiers avec SHA256
    - manifest.sha256    Hash du manifest
    - integrity_report.txt  Rapport de vérification

-------------------------------------------------------------------------------
                       VÉRIFICATION D'INTÉGRITÉ
-------------------------------------------------------------------------------

Chaque fichier de ce dossier possède une empreinte SHA256 unique listée
dans le fichier 09_INTEGRITE/manifest.json.

Pour vérifier qu'un fichier n'a pas été modifié :

Windows (PowerShell) :
  Get-FileHash -Algorithm SHA256 "chemin/du/fichier.pdf"

macOS / Linux :
  sha256sum chemin/du/fichier.pdf

Comparez le résultat avec le hash indiqué dans le manifest.

-------------------------------------------------------------------------------
                         VALEUR PROBANTE
-------------------------------------------------------------------------------

Ce dossier constitue un ensemble de preuves numériques à valeur probante :

• Tous les documents sont horodatés et signés électroniquement
• La chaîne de preuves est cryptographiquement inviolable
• Toute modification d'un maillon invalide la chaîne entière
• Le manifest permet de détecter toute altération de fichier

En cas de litige, ce dossier peut être présenté comme preuve de l'état
du véhicule et des travaux effectués à la date indiquée.

-------------------------------------------------------------------------------
                            CONTACT
-------------------------------------------------------------------------------

Pour toute question concernant ce dossier :
${garageName}

Système de gestion : Motorsafe (https://motorsafe.tech)

===============================================================================
`;

  return {
    content,
    sha256: sha256Hash(content),
  };
}
