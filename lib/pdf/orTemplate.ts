/**
 * Modern PDF Template for Repair Orders (Ordres de Réparation)
 *
 * Creates a professional, visually appealing PDF with:
 * - Clean header with logo and document info
 * - Client and vehicle information
 * - Styled table for work items
 * - Summary box with totals
 * - Signature section
 * - Footer with legal mentions
 */

import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib";
import { PdfBrandingContext } from "./branding";

// ============================================
// Types
// ============================================

export interface OrPdfData {
  orNumber: string;
  status: string;
  createdAt: Date | string;
  issuedAt?: Date | string | null;
  signedAt?: Date | string | null;
  signerName?: string | null;

  client: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
  };

  vehicle: {
    brand: string;
    model: string;
    plate: string;
    vin?: string | null;
    year?: number | null;
    color?: string | null;
    fuel?: string | null;
    mileage?: number | null;
  };

  intervention: {
    id: string;
    type: string;
    title?: string | null;
    notes?: string | null;
    performedAt?: Date | string | null;
    odometerKm?: number | null;
  };

  items: {
    description: string;
    qty: number;
    unitPriceExcl: number;
    vatRate: number;
    lineTotalExcl: number;
    lineTotalIncl: number;
  }[];

  totals: {
    subtotalExcl: number;
    totalVat: number;
    totalIncl: number;
  };

  organisation: {
    name: string;
    displayName?: string | null;
    address?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    email?: string | null;
    siret?: string | null;
    vatNumber?: string | null;
  };
}

// ============================================
// Constants
// ============================================

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Colors
const PRIMARY_COLOR = rgb(0.39, 0.4, 0.95); // #6366F1
const DARK_TEXT = rgb(0.07, 0.07, 0.07);
const MEDIUM_TEXT = rgb(0.42, 0.45, 0.49);
const LIGHT_TEXT = rgb(0.61, 0.64, 0.69);
const BORDER_COLOR = rgb(0.9, 0.91, 0.92);
const HEADER_BG = rgb(0.97, 0.98, 0.98);
const WHITE = rgb(1, 1, 1);
const SUCCESS_COLOR = rgb(0.06, 0.73, 0.51);

// ============================================
// Helpers
// ============================================

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

function drawRoundedRect(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  _radius: number,
  options: { color?: ReturnType<typeof rgb>; borderColor?: ReturnType<typeof rgb>; borderWidth?: number }
) {
  const { color, borderColor, borderWidth = 0 } = options;

  // For simplicity, draw a regular rectangle (pdf-lib doesn't have native rounded rect)
  if (color) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color,
    });
  }
  if (borderColor && borderWidth > 0) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor,
      borderWidth,
    });
  }
}

// ============================================
// PDF Generation
// ============================================

export async function generateOrPdf(
  data: OrPdfData,
  _branding: PdfBrandingContext
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Embed fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN_TOP;

  // ============================================
  // Header Section
  // ============================================

  // Header background
  drawRoundedRect(page, MARGIN_LEFT - 10, y - 90, CONTENT_WIDTH + 20, 100, 8, {
    color: PRIMARY_COLOR,
  });

  // Document title
  page.drawText("ORDRE DE RÉPARATION", {
    x: MARGIN_LEFT + 10,
    y: y - 30,
    size: 20,
    font: fontBold,
    color: WHITE,
  });

  // OR number
  page.drawText(`N° ${data.orNumber}`, {
    x: MARGIN_LEFT + 10,
    y: y - 50,
    size: 12,
    font: fontRegular,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Date (right side)
  const dateText = formatDate(data.createdAt);
  const dateWidth = fontRegular.widthOfTextAtSize(dateText, 12);
  page.drawText(dateText, {
    x: PAGE_WIDTH - MARGIN_RIGHT - dateWidth - 10,
    y: y - 30,
    size: 12,
    font: fontRegular,
    color: WHITE,
  });

  // Status badge
  const statusLabel = data.status === "signed" ? "SIGNÉ" : data.status === "sent" ? "ENVOYÉ" : "BROUILLON";
  const statusColor = data.status === "signed" ? SUCCESS_COLOR : LIGHT_TEXT;
  page.drawText(statusLabel, {
    x: PAGE_WIDTH - MARGIN_RIGHT - fontBold.widthOfTextAtSize(statusLabel, 10) - 10,
    y: y - 50,
    size: 10,
    font: fontBold,
    color: statusColor,
  });

  y -= 120;

  // ============================================
  // Client & Vehicle Info (2 columns)
  // ============================================

  const colWidth = (CONTENT_WIDTH - 20) / 2;

  // Client box
  drawRoundedRect(page, MARGIN_LEFT, y - 100, colWidth, 110, 6, {
    color: HEADER_BG,
  });

  page.drawText("CLIENT", {
    x: MARGIN_LEFT + 12,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: MEDIUM_TEXT,
  });

  const clientName = `${data.client.firstName} ${data.client.lastName}`;
  page.drawText(truncateText(clientName, 35), {
    x: MARGIN_LEFT + 12,
    y: y - 40,
    size: 12,
    font: fontBold,
    color: DARK_TEXT,
  });

  let clientY = y - 58;
  if (data.client.email) {
    page.drawText(truncateText(data.client.email, 35), {
      x: MARGIN_LEFT + 12,
      y: clientY,
      size: 9,
      font: fontRegular,
      color: MEDIUM_TEXT,
    });
    clientY -= 14;
  }
  if (data.client.phone) {
    page.drawText(data.client.phone, {
      x: MARGIN_LEFT + 12,
      y: clientY,
      size: 9,
      font: fontRegular,
      color: MEDIUM_TEXT,
    });
    clientY -= 14;
  }
  if (data.client.address) {
    page.drawText(truncateText(data.client.address, 35), {
      x: MARGIN_LEFT + 12,
      y: clientY,
      size: 9,
      font: fontRegular,
      color: MEDIUM_TEXT,
    });
  }

  // Vehicle box
  const vehicleBoxX = MARGIN_LEFT + colWidth + 20;
  drawRoundedRect(page, vehicleBoxX, y - 100, colWidth, 110, 6, {
    color: HEADER_BG,
  });

  page.drawText("VÉHICULE", {
    x: vehicleBoxX + 12,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: MEDIUM_TEXT,
  });

  const vehicleInfo = `${data.vehicle.brand} ${data.vehicle.model}`;
  page.drawText(truncateText(vehicleInfo, 30), {
    x: vehicleBoxX + 12,
    y: y - 40,
    size: 12,
    font: fontBold,
    color: DARK_TEXT,
  });

  // License plate (styled)
  page.drawText(data.vehicle.plate, {
    x: vehicleBoxX + 12,
    y: y - 60,
    size: 11,
    font: fontBold,
    color: MEDIUM_TEXT,
  });

  let vehicleY = y - 78;
  if (data.vehicle.vin) {
    page.drawText(`VIN: ${truncateText(data.vehicle.vin, 25)}`, {
      x: vehicleBoxX + 12,
      y: vehicleY,
      size: 8,
      font: fontRegular,
      color: LIGHT_TEXT,
    });
    vehicleY -= 12;
  }
  if (data.vehicle.year) {
    page.drawText(`Année: ${data.vehicle.year}`, {
      x: vehicleBoxX + 12,
      y: vehicleY,
      size: 8,
      font: fontRegular,
      color: LIGHT_TEXT,
    });
  }

  y -= 130;

  // ============================================
  // Intervention Info
  // ============================================

  page.drawText("INTERVENTION", {
    x: MARGIN_LEFT,
    y: y,
    size: 9,
    font: fontBold,
    color: MEDIUM_TEXT,
  });

  y -= 20;

  // Intervention details row
  const infoItems = [
    { label: "Type", value: data.intervention.type },
    { label: "Date prévue", value: formatDate(data.intervention.performedAt) },
  ];
  if (data.intervention.odometerKm) {
    infoItems.push({ label: "Kilométrage", value: `${formatNumber(data.intervention.odometerKm)} km` });
  }

  let infoX = MARGIN_LEFT;
  for (const item of infoItems) {
    page.drawText(item.label, {
      x: infoX,
      y: y,
      size: 8,
      font: fontRegular,
      color: LIGHT_TEXT,
    });
    page.drawText(item.value, {
      x: infoX,
      y: y - 14,
      size: 10,
      font: fontBold,
      color: DARK_TEXT,
    });
    infoX += 150;
  }

  y -= 45;

  // Description box (if exists)
  if (data.intervention.title || data.intervention.notes) {
    const descText = data.intervention.title || data.intervention.notes || "";
    drawRoundedRect(page, MARGIN_LEFT, y - 40, CONTENT_WIDTH, 50, 4, {
      color: rgb(1, 0.98, 0.92), // Light yellow
    });

    page.drawText("Description des travaux", {
      x: MARGIN_LEFT + 10,
      y: y - 15,
      size: 8,
      font: fontBold,
      color: rgb(0.57, 0.25, 0.05),
    });

    page.drawText(truncateText(descText, 100), {
      x: MARGIN_LEFT + 10,
      y: y - 32,
      size: 10,
      font: fontRegular,
      color: rgb(0.47, 0.21, 0.03),
    });

    y -= 60;
  }

  // ============================================
  // Work Items Table
  // ============================================

  page.drawText("TRAVAUX À EFFECTUER", {
    x: MARGIN_LEFT,
    y: y,
    size: 9,
    font: fontBold,
    color: MEDIUM_TEXT,
  });

  y -= 20;

  // Table header
  const tableX = MARGIN_LEFT;
  const descColWidth = 240;
  const qtyColWidth = 50;
  const priceColWidth = 80;

  drawRoundedRect(page, tableX, y - 20, CONTENT_WIDTH, 25, 4, {
    color: HEADER_BG,
  });

  page.drawText("Description", {
    x: tableX + 10,
    y: y - 13,
    size: 8,
    font: fontBold,
    color: MEDIUM_TEXT,
  });
  page.drawText("Qté", {
    x: tableX + descColWidth + 20,
    y: y - 13,
    size: 8,
    font: fontBold,
    color: MEDIUM_TEXT,
  });
  page.drawText("Prix HT", {
    x: tableX + descColWidth + qtyColWidth + 30,
    y: y - 13,
    size: 8,
    font: fontBold,
    color: MEDIUM_TEXT,
  });
  page.drawText("Total TTC", {
    x: tableX + descColWidth + qtyColWidth + priceColWidth + 50,
    y: y - 13,
    size: 8,
    font: fontBold,
    color: MEDIUM_TEXT,
  });

  y -= 28;

  // Table rows
  for (const item of data.items) {
    // Row separator
    page.drawLine({
      start: { x: tableX, y: y },
      end: { x: tableX + CONTENT_WIDTH, y: y },
      thickness: 0.5,
      color: BORDER_COLOR,
    });

    y -= 22;

    page.drawText(truncateText(item.description, 50), {
      x: tableX + 10,
      y: y,
      size: 10,
      font: fontRegular,
      color: DARK_TEXT,
    });

    page.drawText(String(item.qty), {
      x: tableX + descColWidth + 25,
      y: y,
      size: 10,
      font: fontRegular,
      color: MEDIUM_TEXT,
    });

    page.drawText(formatCurrency(item.unitPriceExcl), {
      x: tableX + descColWidth + qtyColWidth + 30,
      y: y,
      size: 10,
      font: fontRegular,
      color: MEDIUM_TEXT,
    });

    page.drawText(formatCurrency(item.lineTotalIncl), {
      x: tableX + descColWidth + qtyColWidth + priceColWidth + 50,
      y: y,
      size: 10,
      font: fontBold,
      color: DARK_TEXT,
    });

    y -= 8;
  }

  y -= 15;

  // ============================================
  // Totals Box
  // ============================================

  const totalsBoxWidth = 200;
  const totalsBoxX = PAGE_WIDTH - MARGIN_RIGHT - totalsBoxWidth;

  drawRoundedRect(page, totalsBoxX, y - 80, totalsBoxWidth, 90, 6, {
    color: HEADER_BG,
  });

  // Total HT
  page.drawText("Total HT", {
    x: totalsBoxX + 15,
    y: y - 20,
    size: 10,
    font: fontRegular,
    color: MEDIUM_TEXT,
  });
  page.drawText(formatCurrency(data.totals.subtotalExcl), {
    x: totalsBoxX + totalsBoxWidth - 15 - fontRegular.widthOfTextAtSize(formatCurrency(data.totals.subtotalExcl), 10),
    y: y - 20,
    size: 10,
    font: fontRegular,
    color: MEDIUM_TEXT,
  });

  // TVA
  page.drawText("TVA", {
    x: totalsBoxX + 15,
    y: y - 40,
    size: 10,
    font: fontRegular,
    color: MEDIUM_TEXT,
  });
  page.drawText(formatCurrency(data.totals.totalVat), {
    x: totalsBoxX + totalsBoxWidth - 15 - fontRegular.widthOfTextAtSize(formatCurrency(data.totals.totalVat), 10),
    y: y - 40,
    size: 10,
    font: fontRegular,
    color: MEDIUM_TEXT,
  });

  // Separator
  page.drawLine({
    start: { x: totalsBoxX + 15, y: y - 52 },
    end: { x: totalsBoxX + totalsBoxWidth - 15, y: y - 52 },
    thickness: 1,
    color: BORDER_COLOR,
  });

  // Total TTC
  page.drawText("Total TTC", {
    x: totalsBoxX + 15,
    y: y - 70,
    size: 12,
    font: fontBold,
    color: DARK_TEXT,
  });
  const totalText = formatCurrency(data.totals.totalIncl);
  page.drawText(totalText, {
    x: totalsBoxX + totalsBoxWidth - 15 - fontBold.widthOfTextAtSize(totalText, 14),
    y: y - 70,
    size: 14,
    font: fontBold,
    color: DARK_TEXT,
  });

  y -= 110;

  // ============================================
  // Signature Section
  // ============================================

  drawRoundedRect(page, MARGIN_LEFT, y - 100, CONTENT_WIDTH, 110, 6, {
    color: HEADER_BG,
  });

  page.drawText("ACCORD DU CLIENT", {
    x: MARGIN_LEFT + 15,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: MEDIUM_TEXT,
  });

  const agreementText = `Je soussigné(e), ${data.client.firstName} ${data.client.lastName}, propriétaire du véhicule immatriculé ${data.vehicle.plate}, autorise l'atelier à effectuer les travaux décrits ci-dessus. Je m'engage à régler le montant total de ${formatCurrency(data.totals.totalIncl)} TTC à la restitution du véhicule.`;

  // Split text into lines
  const words = agreementText.split(" ");
  let line = "";
  let agreementY = y - 40;
  const maxLineWidth = CONTENT_WIDTH - 30;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = fontRegular.widthOfTextAtSize(testLine, 9);

    if (testWidth > maxLineWidth && line) {
      page.drawText(line, {
        x: MARGIN_LEFT + 15,
        y: agreementY,
        size: 9,
        font: fontRegular,
        color: MEDIUM_TEXT,
      });
      line = word;
      agreementY -= 12;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, {
      x: MARGIN_LEFT + 15,
      y: agreementY,
      size: 9,
      font: fontRegular,
      color: MEDIUM_TEXT,
    });
  }

  // Date & Signature boxes
  const sigBoxY = y - 95;

  page.drawText("Date:", {
    x: MARGIN_LEFT + 15,
    y: sigBoxY,
    size: 8,
    font: fontRegular,
    color: LIGHT_TEXT,
  });

  if (data.signedAt) {
    page.drawText(formatDate(data.signedAt), {
      x: MARGIN_LEFT + 50,
      y: sigBoxY,
      size: 9,
      font: fontRegular,
      color: DARK_TEXT,
    });
  }

  page.drawText("Signature:", {
    x: MARGIN_LEFT + 200,
    y: sigBoxY,
    size: 8,
    font: fontRegular,
    color: LIGHT_TEXT,
  });

  if (data.status === "signed") {
    page.drawText("✓ Signé électroniquement", {
      x: MARGIN_LEFT + 260,
      y: sigBoxY,
      size: 9,
      font: fontBold,
      color: SUCCESS_COLOR,
    });
  }

  // ============================================
  // Footer
  // ============================================

  const footerY = 40;

  // Organization info
  const orgName = data.organisation.displayName || data.organisation.name;
  page.drawText(orgName, {
    x: MARGIN_LEFT,
    y: footerY,
    size: 8,
    font: fontBold,
    color: MEDIUM_TEXT,
  });

  const legalParts: string[] = [];
  if (data.organisation.siret) legalParts.push(`SIRET: ${data.organisation.siret}`);
  if (data.organisation.vatNumber) legalParts.push(`TVA: ${data.organisation.vatNumber}`);

  if (legalParts.length > 0) {
    page.drawText(legalParts.join(" | "), {
      x: MARGIN_LEFT,
      y: footerY - 12,
      size: 7,
      font: fontRegular,
      color: LIGHT_TEXT,
    });
  }

  // Generated by SafeMotor
  const generatedText = "Généré par SafeMotor";
  page.drawText(generatedText, {
    x: PAGE_WIDTH - MARGIN_RIGHT - fontRegular.widthOfTextAtSize(generatedText, 7),
    y: footerY - 12,
    size: 7,
    font: fontRegular,
    color: LIGHT_TEXT,
  });

  return pdfDoc.save();
}
