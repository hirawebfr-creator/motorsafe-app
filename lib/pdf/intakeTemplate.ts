/**
 * EVIDENCE-CAPTURE-01: PDF Template for Intake/Reception PV
 *
 * Creates a professional PDF with:
 * - Garage header with name, address, SIRET
 * - Client and vehicle information
 * - Odometer reading and fuel level
 * - Intake checklist (warnings/issues noted)
 * - Additional notes
 * - Photos (6 required views)
 * - Signature section (client)
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

export interface IntakePvPhoto {
  label: string;
  category: string;
  storageKey: string | null;
  imageData?: Uint8Array | Buffer | null;
}

export interface IntakePvData {
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
  fuelLevel?: number | null; // 0, 25, 50, 75, 100

  intakeChecklist: {
    engineLight?: boolean;
    oilLight?: boolean;
    batteryLight?: boolean;
    brakeLight?: boolean;
    absLight?: boolean;
    airbagLight?: boolean;
    tireLight?: boolean;
    tempLight?: boolean;
    noises?: boolean;
    leaks?: boolean;
    bodyDamage?: boolean;
    scratches?: boolean;
  };

  additionalNotes?: string | null;

  photos: IntakePvPhoto[];

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
  engineLight: "Voyant moteur",
  oilLight: "Voyant huile",
  batteryLight: "Voyant batterie",
  brakeLight: "Voyant freins",
  absLight: "Voyant ABS",
  airbagLight: "Voyant airbag",
  tireLight: "Voyant pression pneus",
  tempLight: "Voyant temperature",
  noises: "Bruits anormaux",
  leaks: "Fuites visibles",
  bodyDamage: "Degats carrosserie",
  scratches: "Rayures visibles",
};

const FUEL_LABELS: Record<number, string> = {
  0: "Vide",
  25: "1/4",
  50: "1/2",
  75: "3/4",
  100: "Plein",
};

// ============================================
// Helper Functions
// ============================================

function formatDateFr(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// PDF Generation
// ============================================

export async function generateIntakePdf(
  data: IntakePvData,
  brandingCtx?: PdfBrandingContext | null
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        info: {
          Title: `PV Reception - ${data.vehicle.plate}`,
          Author: data.organisation.displayName || data.organisation.name,
          Subject: "Proces-verbal de reception vehicule",
          Creator: "SafeMotor",
        },
      });

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(new Uint8Array(result));
      });
      doc.on("error", reject);

      // Colors
      const primaryColor = brandingCtx?.brandColor || "#1a56db";
      const secondaryColor = "#059669"; // Green for success
      const warningColor = "#d97706"; // Orange for warnings
      const textColor = "#1f2937";
      const mutedColor = "#6b7280";
      const bgColor = "#f8fafc";

      const pageWidth = doc.page.width - 80;

      // ============================================
      // HEADER SECTION
      // ============================================
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

      // Logo if available
      let headerTextX = 40;
      if (brandingCtx?.logoBuffer) {
        try {
          doc.image(brandingCtx.logoBuffer, 40, 20, { height: 50 });
          headerTextX = 110;
        } catch {
          // Logo failed to load
        }
      }

      // Title
      doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold");
      doc.text("PV DE RECEPTION", headerTextX, 30, { width: pageWidth - 70 });

      doc.fontSize(11).font("Helvetica");
      doc.text(
        `${data.organisation.displayName || data.organisation.name}`,
        headerTextX,
        55,
        { width: pageWidth - 70 }
      );

      // Date on the right
      doc.fontSize(10);
      const dateStr = formatDateFr(data.createdAt);
      doc.text(`Date: ${dateStr}`, doc.page.width - 180, 30, {
        width: 140,
        align: "right",
      });

      // Document ID
      doc.text(`Ref: ${data.interventionId.slice(0, 8).toUpperCase()}`, doc.page.width - 180, 45, {
        width: 140,
        align: "right",
      });

      let y = 120;

      // ============================================
      // ETABLISSEMENT SECTION
      // ============================================
      doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold");
      doc.text("ETABLISSEMENT", 40, y);
      y += 20;

      doc.fillColor(textColor).fontSize(10).font("Helvetica");
      const orgLines = [
        data.organisation.displayName || data.organisation.name,
        data.organisation.address,
        [data.organisation.postalCode, data.organisation.city].filter(Boolean).join(" "),
        data.organisation.phone ? `Tel: ${data.organisation.phone}` : null,
        data.organisation.email,
        data.organisation.siret ? `SIRET: ${data.organisation.siret}` : null,
      ].filter(Boolean);

      for (const line of orgLines) {
        doc.text(line as string, 40, y, { width: pageWidth / 2 - 20 });
        y += 14;
      }

      // ============================================
      // CLIENT SECTION (right side)
      // ============================================
      let clientY = 120;
      doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold");
      doc.text("CLIENT", pageWidth / 2 + 60, clientY);
      clientY += 20;

      doc.fillColor(textColor).fontSize(10).font("Helvetica");
      const clientName = `${data.client.firstName} ${data.client.lastName}`.trim();
      if (clientName) {
        doc.text(clientName, pageWidth / 2 + 60, clientY, { width: pageWidth / 2 - 20 });
        clientY += 14;
      }
      if (data.client.email) {
        doc.text(data.client.email, pageWidth / 2 + 60, clientY, { width: pageWidth / 2 - 20 });
        clientY += 14;
      }
      if (data.client.phone) {
        doc.text(`Tel: ${data.client.phone}`, pageWidth / 2 + 60, clientY, { width: pageWidth / 2 - 20 });
        clientY += 14;
      }

      y = Math.max(y, clientY) + 20;

      // ============================================
      // VEHICULE SECTION
      // ============================================
      doc.rect(40, y, pageWidth, 70).fill(bgColor);
      doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold");
      doc.text("VEHICULE", 50, y + 10);

      doc.fillColor(textColor).fontSize(10).font("Helvetica");
      doc.text(`Marque / Modele: ${data.vehicle.brand} ${data.vehicle.model}`, 50, y + 28);
      doc.text(`Immatriculation: ${data.vehicle.plate}`, 50, y + 42);
      if (data.vehicle.vin) {
        doc.text(`VIN: ${data.vehicle.vin}`, 50, y + 56);
      }

      // Odometer and fuel on the right
      doc.text(
        `Kilometrage: ${data.odometerKm ? data.odometerKm.toLocaleString("fr-FR") + " km" : "-"}`,
        pageWidth / 2 + 60,
        y + 28
      );
      doc.text(
        `Niveau carburant: ${data.fuelLevel !== undefined && data.fuelLevel !== null ? FUEL_LABELS[data.fuelLevel] || "-" : "-"}`,
        pageWidth / 2 + 60,
        y + 42
      );

      y += 90;

      // ============================================
      // CONSTAT D'ENTREE SECTION
      // ============================================
      doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold");
      doc.text("CONSTAT D'ENTREE", 40, y);
      y += 20;

      // Count issues
      const issueKeys = Object.keys(data.intakeChecklist) as (keyof typeof data.intakeChecklist)[];
      const issuesFound = issueKeys.filter((k) => data.intakeChecklist[k] === true);
      const issueCount = issuesFound.length;

      // Summary badge
      if (issueCount === 0) {
        doc.rect(40, y, 200, 24).fill(secondaryColor);
        doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
        doc.text("Aucune anomalie signalee", 50, y + 7);
      } else {
        doc.rect(40, y, 200, 24).fill(warningColor);
        doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
        doc.text(`${issueCount} anomalie(s) signalee(s)`, 50, y + 7);
      }
      y += 35;

      // Checklist grid (3 columns)
      doc.fillColor(textColor).fontSize(9).font("Helvetica");
      const colWidth = pageWidth / 3;
      let col = 0;
      const startY = y;

      for (const key of issueKeys) {
        const checked = data.intakeChecklist[key] === true;
        const label = CHECKLIST_LABELS[key] || key;
        const xPos = 40 + col * colWidth;

        // Checkbox
        if (checked) {
          doc.rect(xPos, y, 12, 12).fill(warningColor);
          doc.fillColor("#ffffff").fontSize(8);
          doc.text("X", xPos + 3, y + 2);
        } else {
          doc.rect(xPos, y, 12, 12).lineWidth(1).stroke(mutedColor);
        }

        // Label
        doc.fillColor(checked ? warningColor : textColor).fontSize(9);
        doc.text(label, xPos + 18, y + 2, { width: colWidth - 25 });

        col++;
        if (col >= 3) {
          col = 0;
          y += 20;
        }
      }

      if (col !== 0) y += 20;
      y = Math.max(y, startY + 80);

      // Additional notes
      if (data.additionalNotes) {
        y += 10;
        doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold");
        doc.text("Notes supplementaires:", 40, y);
        y += 14;
        doc.fillColor(textColor).font("Helvetica");
        doc.text(data.additionalNotes, 40, y, { width: pageWidth });
        y += doc.heightOfString(data.additionalNotes, { width: pageWidth }) + 10;
      }

      y += 20;

      // ============================================
      // SIGNATURE SECTION
      // ============================================
      // Check if we need a new page
      if (y > doc.page.height - 200) {
        doc.addPage();
        y = 40;
      }

      doc.rect(40, y, pageWidth, 120).fill(bgColor);
      doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold");
      doc.text("SIGNATURES", 50, y + 10);

      // Two signature boxes side by side
      const sigBoxWidth = (pageWidth - 30) / 2;
      const sigBoxY = y + 30;

      // Garage signature
      doc.rect(50, sigBoxY, sigBoxWidth, 80).lineWidth(1).stroke(mutedColor);
      doc.fillColor(mutedColor).fontSize(9).font("Helvetica");
      doc.text("Signature garage", 55, sigBoxY + 5);
      if (data.garageSignerName) {
        doc.fillColor(textColor).fontSize(10);
        doc.text(data.garageSignerName, 55, sigBoxY + 60);
      }
      if (data.garageSignatureImage) {
        try {
          doc.image(data.garageSignatureImage, 55, sigBoxY + 20, { height: 35 });
        } catch {
          // Signature image failed
        }
      }

      // Client signature
      doc.rect(60 + sigBoxWidth, sigBoxY, sigBoxWidth, 80).lineWidth(1).stroke(mutedColor);
      doc.fillColor(mutedColor).fontSize(9).font("Helvetica");
      doc.text("Signature client", 65 + sigBoxWidth, sigBoxY + 5);

      if (data.signerName) {
        doc.fillColor(textColor).fontSize(10);
        doc.text(data.signerName, 65 + sigBoxWidth, sigBoxY + 60);
      }

      if (data.signedAt) {
        doc.fillColor(secondaryColor).fontSize(8);
        doc.text(`Signe le ${formatDateFr(data.signedAt)}`, 65 + sigBoxWidth, sigBoxY + 72);
      }

      y += 140;

      // ============================================
      // LEGAL FOOTER
      // ============================================
      doc.fillColor(mutedColor).fontSize(8).font("Helvetica");
      const legalText = `En signant ce document, le client confirme avoir remis son vehicule dans l'etat decrit ci-dessus. Ce proces-verbal de reception fait foi en cas de litige. Document genere par SafeMotor le ${formatDateFr(new Date())}.`;
      doc.text(legalText, 40, doc.page.height - 60, {
        width: pageWidth,
        align: "center",
      });

      // ============================================
      // PHOTOS PAGE(S)
      // ============================================
      const photosWithData = data.photos.filter((p) => p.imageData);
      if (photosWithData.length > 0) {
        doc.addPage();

        // Photos header
        doc.rect(0, 0, doc.page.width, 60).fill(primaryColor);
        doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold");
        doc.text("PHOTOS D'ENTREE", 40, 20);
        doc.fontSize(10).font("Helvetica");
        doc.text(`${photosWithData.length} photo(s) - ${data.vehicle.plate}`, 40, 40);

        y = 80;

        // Grid layout: 2 columns, 3 rows per page
        const photoWidth = (pageWidth - 20) / 2;
        const photoHeight = 180;
        let photoIndex = 0;

        for (const photo of photosWithData) {
          if (photoIndex > 0 && photoIndex % 6 === 0) {
            doc.addPage();
            y = 40;
          }

          const col = photoIndex % 2;
          const row = Math.floor((photoIndex % 6) / 2);
          const xPos = 40 + col * (photoWidth + 20);
          const yPos = y + row * (photoHeight + 40);

          // Photo frame
          doc.rect(xPos, yPos, photoWidth, photoHeight).lineWidth(1).stroke(mutedColor);

          // Photo label
          doc.fillColor(textColor).fontSize(9).font("Helvetica-Bold");
          doc.text(photo.label, xPos, yPos + photoHeight + 5, {
            width: photoWidth,
            align: "center",
          });

          // Photo image
          if (photo.imageData) {
            try {
              doc.image(photo.imageData as Buffer, xPos + 5, yPos + 5, {
                fit: [photoWidth - 10, photoHeight - 10],
                align: "center",
                valign: "center",
              });
            } catch {
              doc.fillColor(mutedColor).fontSize(8);
              doc.text("Image non disponible", xPos + 5, yPos + photoHeight / 2 - 5, {
                width: photoWidth - 10,
                align: "center",
              });
            }
          }

          photoIndex++;
        }
      }

      // Finalize PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
