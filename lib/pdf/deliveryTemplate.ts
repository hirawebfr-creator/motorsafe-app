/**
 * EVIDENCE-CAPTURE-01: PDF Template for Delivery/Restitution PV
 *
 * Creates a professional PDF with:
 * - Garage header with name, address, SIRET
 * - Client and vehicle information
 * - Outtake checklist results
 * - Reservations/warnings
 * - Full-page photos (one per page or grid)
 * - Signature section (garage pre-filled + client)
 * - Legal footer
 *
 * Uses PDFKit for consistency with other SafeMotor PDFs
 */

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { PdfBrandingContext } from "./branding";

// ============================================
// Types
// ============================================

export interface DeliveryPvPhoto {
  label: string;
  category: string;
  storageKey: string | null;
  imageData?: Uint8Array | Buffer | null;
}

export interface DeliveryPvData {
  interventionId: string;
  createdAt: Date;
  signedAt?: Date | null;
  signerName?: string | null;
  signerIp?: string | null;

  client: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };

  vehicle: {
    brand: string;
    model: string;
    plate: string;
    vin?: string | null;
  };

  odometerKm?: number | null;

  outtakeChecklist: {
    roadTest?: boolean;
    lightsOff?: boolean;
    noisesGone?: boolean;
    leaksFixed?: boolean;
    cleanVehicle?: boolean;
    toolsRemoved?: boolean;
  };

  hasReservations: boolean;
  reservations?: string | null;

  photos: DeliveryPvPhoto[];

  organisation: {
    name: string;
    displayName?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    email?: string | null;
    siret?: string | null;
    vatNumber?: string | null;
  };

  garageSignatureImage?: Buffer | null;
  garageSignerName?: string | null;
}

// ============================================
// Constants
// ============================================

const CHECKLIST_LABELS: Record<string, string> = {
  roadTest: "Essai routier effectue",
  lightsOff: "Voyants eteints",
  noisesGone: "Bruits resolus",
  leaksFixed: "Fuites corrigees",
  cleanVehicle: "Vehicule propre",
  toolsRemoved: "Outils retires",
};

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(num: number): string {
  return num.toLocaleString("fr-FR");
}

// ============================================
// Main Export Function
// ============================================

export async function generateDeliveryPdf(
  data: DeliveryPvData,
  brandingCtx: PdfBrandingContext | null = null
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
        info: {
          Title: `PV de Restitution - ${data.vehicle.plate}`,
          Author: data.organisation.displayName || data.organisation.name,
          Subject: "Proces-verbal de restitution vehicule",
          Creator: "SafeMotor",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer | Uint8Array) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(new Uint8Array(result));
      });
      doc.on("error", reject);

      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const contentWidth = right - left;

      // Helper functions
      const row = (label: string, value: string, bold = false) => {
        const labelWidth = 150;
        const y = doc.y;
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text(label, left, y, { width: labelWidth });
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor("#000").text(value, left + labelWidth, y, { width: contentWidth - labelWidth });
        doc.moveDown(0.4);
      };

      const section = (title: string) => {
        doc.moveDown(0.6);
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a56db").text(title);
        doc.moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).strokeColor("#1a56db").lineWidth(1).stroke();
        doc.moveDown(0.5);
        doc.fillColor("#000");
      };

      // ========================================
      // PAGE 1: Main Info
      // ========================================

      // === HEADER ===
      const garageName = brandingCtx?.garage.displayName || data.organisation.displayName || data.organisation.name;

      // Logo if available
      if (brandingCtx?.logoBuffer) {
        try {
          doc.image(brandingCtx.logoBuffer, left, doc.y, { width: 80, height: 80, fit: [80, 80] });
          doc.moveUp(4);
          doc.text("", left + 100, doc.y); // Move cursor
        } catch {
          // Logo failed
        }
      }

      doc.fontSize(20).font("Helvetica-Bold").fillColor("#1a56db").text(garageName.toUpperCase(), { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#000").text("PROCES-VERBAL DE RESTITUTION", { align: "center" });
      doc.moveDown(0.3);

      // Reference and date
      doc.fontSize(10).font("Helvetica").fillColor("#666");
      doc.text(`Reference: ${data.interventionId.slice(0, 12).toUpperCase()}`, { align: "center" });
      doc.text(`Date: ${formatDate(data.createdAt)}`, { align: "center" });
      doc.moveDown(1);
      doc.fillColor("#000");

      // === GARAGE INFO ===
      section("Etablissement");
      row("Nom:", garageName);
      const addressParts = [
        data.organisation.address,
        [data.organisation.postalCode, data.organisation.city].filter(Boolean).join(" "),
      ].filter(Boolean);
      if (addressParts.length > 0) row("Adresse:", addressParts.join(", "));
      if (data.organisation.phone) row("Telephone:", data.organisation.phone);
      if (data.organisation.siret) row("SIRET:", data.organisation.siret);

      // === CLIENT INFO ===
      section("Client");
      const clientName = `${data.client.firstName} ${data.client.lastName}`.trim();
      row("Nom:", clientName, true);
      if (data.client.email) row("Email:", data.client.email);
      if (data.client.phone) row("Telephone:", data.client.phone);

      // === VEHICLE INFO ===
      section("Vehicule");
      row("Immatriculation:", data.vehicle.plate, true);
      row("Marque / Modele:", `${data.vehicle.brand} ${data.vehicle.model}`);
      if (data.vehicle.vin) row("VIN:", data.vehicle.vin);
      if (data.odometerKm) row("Kilometrage sortie:", `${formatNumber(data.odometerKm)} km`);

      // === TESTS DE SORTIE ===
      section("Tests de sortie");

      const checkedCount = Object.values(data.outtakeChecklist).filter(Boolean).length;
      const totalCount = Object.keys(CHECKLIST_LABELS).length;

      doc.font("Helvetica-Bold").fontSize(11);
      if (checkedCount >= 4) {
        doc.fillColor("#059669").text(`${checkedCount}/${totalCount} tests valides`, left);
      } else {
        doc.fillColor("#d97706").text(`${checkedCount}/${totalCount} tests valides`, left);
      }
      doc.fillColor("#000").moveDown(0.4);

      // Checklist items
      doc.font("Helvetica").fontSize(10);
      for (const [key, label] of Object.entries(CHECKLIST_LABELS)) {
        const isChecked = data.outtakeChecklist[key as keyof typeof data.outtakeChecklist] || false;
        const checkmark = isChecked ? "[X]" : "[ ]";
        const color = isChecked ? "#059669" : "#9ca3af";
        doc.fillColor(color).text(`${checkmark} ${label}`, left);
        doc.moveDown(0.2);
      }
      doc.fillColor("#000");

      // === RESERVES ===
      section("Reserves");

      if (data.hasReservations && data.reservations) {
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#d97706");
        doc.text("RESERVES SIGNALEES:", left);
        doc.moveDown(0.3);
        doc.font("Helvetica").fontSize(10).fillColor("#000");
        doc.text(data.reservations, left, doc.y, { width: contentWidth });
      } else {
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#059669");
        doc.text("AUCUNE RESERVE - Travaux conformes", left);
      }
      doc.fillColor("#000");
      doc.moveDown(0.5);

      // === SIGNATURE SECTION ===
      section("Signatures");

      const sigBoxWidth = (contentWidth - 20) / 2;
      const sigBoxHeight = 90;
      const sigY = doc.y + 10;

      // Garage signature box
      doc.rect(left, sigY, sigBoxWidth, sigBoxHeight).stroke("#ccc");
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#666");
      doc.text("SIGNATURE GARAGE", left + 5, sigY + 5);

      // Add garage signature image if available
      if (data.garageSignatureImage) {
        try {
          const sigBuffer = Buffer.isBuffer(data.garageSignatureImage)
            ? data.garageSignatureImage
            : Buffer.from(data.garageSignatureImage);
          doc.image(sigBuffer, left + 10, sigY + 20, {
            width: sigBoxWidth - 20,
            height: 50,
            fit: [sigBoxWidth - 20, 50],
          });
        } catch {
          // Signature failed
        }
      }

      if (data.garageSignerName) {
        doc.font("Helvetica").fontSize(9).fillColor("#000");
        doc.text(data.garageSignerName, left + 5, sigY + sigBoxHeight - 15);
      }

      // Client signature box
      const clientSigX = left + sigBoxWidth + 20;
      doc.rect(clientSigX, sigY, sigBoxWidth, sigBoxHeight).stroke("#ccc");
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#666");
      doc.text("SIGNATURE CLIENT", clientSigX + 5, sigY + 5);

      if (data.signedAt && data.signerName) {
        // Signed
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#059669");
        doc.text("SIGNE ELECTRONIQUEMENT", clientSigX + 5, sigY + 25);
        doc.font("Helvetica").fontSize(9).fillColor("#000");
        doc.text(`Par: ${data.signerName}`, clientSigX + 5, sigY + 40);
        doc.text(`Le: ${formatDateTime(data.signedAt)}`, clientSigX + 5, sigY + 52);
        if (data.signerIp) {
          doc.fontSize(8).fillColor("#666");
          doc.text(`IP: ${data.signerIp}`, clientSigX + 5, sigY + 64);
        }
      } else {
        // Not signed
        doc.font("Helvetica").fontSize(9).fillColor("#d97706");
        doc.text("EN ATTENTE DE SIGNATURE", clientSigX + 5, sigY + 35);
      }

      doc.fillColor("#000");

      // === FOOTER ===
      doc.fontSize(7).fillColor("#999");
      doc.text(
        "Ce proces-verbal atteste de l'etat du vehicule a la sortie. En signant, le client confirme la prise en charge.",
        left,
        doc.page.height - 60,
        { width: contentWidth, align: "center" }
      );
      doc.text(
        `Genere avec SafeMotor - safemotor.fr | ${new Date().toISOString().split("T")[0]}`,
        left,
        doc.page.height - 45,
        { width: contentWidth, align: "center" }
      );

      // ========================================
      // PAGE 2+: Photos (if any)
      // ========================================

      if (data.photos.length > 0) {
        doc.addPage();

        // Header for photos page
        doc.fontSize(16).font("Helvetica-Bold").fillColor("#1a56db").text("PHOTOS DE SORTIE", { align: "center" });
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").fillColor("#666");
        doc.text(`Vehicule: ${data.vehicle.plate} - ${data.vehicle.brand} ${data.vehicle.model}`, { align: "center" });
        doc.text(`${data.photos.length} photo(s) jointe(s)`, { align: "center" });
        doc.moveDown(1);
        doc.fillColor("#000");

        // Photos grid (2 columns, larger images)
        const photoWidth = (contentWidth - 20) / 2;
        const photoHeight = 200;
        let currentY = doc.y;
        let col = 0;

        for (let i = 0; i < data.photos.length; i++) {
          const photo = data.photos[i];
          const x = left + col * (photoWidth + 20);

          // Check if we need a new page
          if (currentY + photoHeight + 30 > doc.page.height - 60) {
            doc.addPage();
            currentY = doc.page.margins.top;
            col = 0;
          }

          // Photo frame
          doc.rect(x, currentY, photoWidth, photoHeight).stroke("#e5e7eb");

          // Try to add image
          if (photo.imageData) {
            try {
              const imgBuffer = Buffer.isBuffer(photo.imageData)
                ? photo.imageData
                : Buffer.from(photo.imageData);

              doc.image(imgBuffer, x + 5, currentY + 5, {
                width: photoWidth - 10,
                height: photoHeight - 30,
                fit: [photoWidth - 10, photoHeight - 30],
                align: "center",
                valign: "center",
              });
            } catch (imgErr) {
              // Image failed - show placeholder
              doc.fontSize(10).fillColor("#9ca3af");
              doc.text("[Image non disponible]", x + 10, currentY + photoHeight / 2, {
                width: photoWidth - 20,
                align: "center",
              });
            }
          } else {
            // No image data
            doc.fontSize(10).fillColor("#9ca3af");
            doc.text("[Image non disponible]", x + 10, currentY + photoHeight / 2, {
              width: photoWidth - 20,
              align: "center",
            });
          }

          // Photo label
          doc.fontSize(9).font("Helvetica-Bold").fillColor("#333");
          doc.text(photo.label || `Photo ${i + 1}`, x + 5, currentY + photoHeight - 20, {
            width: photoWidth - 10,
          });

          // Category if available
          if (photo.category) {
            doc.fontSize(8).font("Helvetica").fillColor("#666");
            doc.text(photo.category, x + 5, currentY + photoHeight - 8, {
              width: photoWidth - 10,
            });
          }

          col++;
          if (col >= 2) {
            col = 0;
            currentY += photoHeight + 25;
          }
        }

        // Footer on photos page
        doc.fontSize(7).fillColor("#999");
        doc.text(
          `Photos prises lors de la restitution du ${formatDate(data.createdAt)}`,
          left,
          doc.page.height - 45,
          { width: contentWidth, align: "center" }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
