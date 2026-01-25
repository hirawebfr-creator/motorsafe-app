/**
 * Modern PDF Template for Quotes (Devis)
 * 
 * Creates a professional, visually appealing PDF with:
 * - Clean header with logo and document info
 * - Styled table for line items
 * - Summary box with totals
 * - Footer with legal mentions
 */

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
import { PdfBrandingContext } from "./branding";

// ============================================
// Types
// ============================================

export interface QuotePdfData {
  quoteNumber: string | null;
  status: string;
  createdAt: Date;
  sentAt?: Date | null;
  acceptedAt?: Date | null;
  signedAt?: Date | null;
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
  
  vehicle?: {
    brand: string;
    model: string;
    plate: string;
    vin?: string | null;
    mileage?: number | null;
  } | null;
  
  lines: {
    description: string;
    qty: number;
    unitPriceExcl: number;
    vatRate: number;
    lineTotalExcl: number;
    lineVatAmount: number;
    lineTotalIncl: number;
  }[];
  
  subtotalExcl: number;
  totalVat: number;
  totalIncl: number;
  currency: string;
  
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
}

// ============================================
// Constants
// ============================================

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 60;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Colors (rgb values 0-1)
const PRIMARY_COLOR = rgb(0.29, 0.33, 0.91); // Indigo #4A54E8
const TEXT_COLOR = rgb(0.13, 0.13, 0.13);
const MUTED_COLOR = rgb(0.45, 0.45, 0.45);
const BORDER_COLOR = rgb(0.85, 0.85, 0.85);
const HEADER_BG = rgb(0.96, 0.97, 0.98);
const ACCENT_BG = rgb(0.97, 0.97, 1);

// ============================================
// Helper Functions
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

function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatVatRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// ============================================
// Drawing Functions
// ============================================

function drawRoundedRect(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ReturnType<typeof rgb>,
  borderColor?: ReturnType<typeof rgb>
) {
  // Simple rectangle (pdf-lib doesn't support rounded corners natively)
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color,
    borderColor,
    borderWidth: borderColor ? 0.5 : 0,
  });
}

function drawLine(
  page: PDFPage,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: ReturnType<typeof rgb> = BORDER_COLOR,
  thickness = 0.5
) {
  page.drawLine({
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    thickness,
    color,
  });
}

// ============================================
// Section Renderers
// ============================================

function renderHeader(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: QuotePdfData,
  brandingCtx: PdfBrandingContext | null,
  startY: number
): number {
  let y = startY;
  
  // === LEFT: Organisation Info ===
  const orgName = brandingCtx?.garage.displayName || data.organisation.displayName || data.organisation.name;
  page.drawText(orgName.toUpperCase(), {
    x: MARGIN_LEFT,
    y,
    size: 16,
    font: fonts.bold,
    color: PRIMARY_COLOR,
  });
  y -= 18;
  
  if (data.organisation.address) {
    page.drawText(data.organisation.address, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 12;
  }
  
  if (data.organisation.postalCode || data.organisation.city) {
    const cityLine = [data.organisation.postalCode, data.organisation.city].filter(Boolean).join(" ");
    page.drawText(cityLine, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 12;
  }
  
  if (data.organisation.phone) {
    page.drawText(`Tél: ${data.organisation.phone}`, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 12;
  }
  
  if (data.organisation.email) {
    page.drawText(data.organisation.email, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 12;
  }
  
  // === RIGHT: Document Title Box ===
  const boxWidth = 180;
  const boxHeight = 70;
  const boxX = PAGE_WIDTH - MARGIN_RIGHT - boxWidth;
  const boxY = startY - boxHeight + 10;
  
  drawRoundedRect(page, boxX, boxY, boxWidth, boxHeight, ACCENT_BG, PRIMARY_COLOR);
  
  // "DEVIS" title
  page.drawText("DEVIS", {
    x: boxX + 15,
    y: boxY + boxHeight - 25,
    size: 20,
    font: fonts.bold,
    color: PRIMARY_COLOR,
  });
  
  // Quote number
  const quoteNum = data.quoteNumber || `#${data.quoteNumber}`;
  page.drawText(quoteNum, {
    x: boxX + 15,
    y: boxY + boxHeight - 45,
    size: 11,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  
  // Date
  page.drawText(`Date: ${formatDate(data.createdAt)}`, {
    x: boxX + 15,
    y: boxY + boxHeight - 60,
    size: 9,
    font: fonts.regular,
    color: MUTED_COLOR,
  });
  
  return Math.min(y, boxY) - 30;
}

function renderClientSection(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: QuotePdfData,
  startY: number
): number {
  let y = startY;
  
  // Section title
  page.drawText("DESTINATAIRE", {
    x: MARGIN_LEFT,
    y,
    size: 8,
    font: fonts.bold,
    color: MUTED_COLOR,
  });
  y -= 18;
  
  // Client box
  const boxHeight = 80;
  const boxWidth = 220;
  drawRoundedRect(page, MARGIN_LEFT, y - boxHeight, boxWidth, boxHeight, HEADER_BG);
  
  const clientName = `${data.client.firstName} ${data.client.lastName}`;
  page.drawText(clientName, {
    x: MARGIN_LEFT + 12,
    y: y - 18,
    size: 11,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  
  let clientY = y - 34;
  
  if (data.client.address) {
    page.drawText(data.client.address, {
      x: MARGIN_LEFT + 12,
      y: clientY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    clientY -= 13;
  }
  
  if (data.client.postalCode || data.client.city) {
    const cityLine = [data.client.postalCode, data.client.city].filter(Boolean).join(" ");
    page.drawText(cityLine, {
      x: MARGIN_LEFT + 12,
      y: clientY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    clientY -= 13;
  }
  
  if (data.client.email) {
    page.drawText(data.client.email, {
      x: MARGIN_LEFT + 12,
      y: clientY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    clientY -= 13;
  }
  
  if (data.client.phone) {
    page.drawText(`Tél: ${data.client.phone}`, {
      x: MARGIN_LEFT + 12,
      y: clientY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
  }
  
  // Vehicle info (if present) - on the right
  if (data.vehicle) {
    const vehicleX = MARGIN_LEFT + boxWidth + 30;
    
    page.drawText("VÉHICULE", {
      x: vehicleX,
      y: startY,
      size: 8,
      font: fonts.bold,
      color: MUTED_COLOR,
    });
    
    drawRoundedRect(page, vehicleX, y - boxHeight, boxWidth, boxHeight, HEADER_BG);
    
    const vehicleName = `${data.vehicle.brand} ${data.vehicle.model}`;
    page.drawText(vehicleName, {
      x: vehicleX + 12,
      y: y - 18,
      size: 11,
      font: fonts.bold,
      color: TEXT_COLOR,
    });
    
    page.drawText(`Immatriculation: ${data.vehicle.plate}`, {
      x: vehicleX + 12,
      y: y - 34,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    
    if (data.vehicle.vin) {
      page.drawText(`VIN: ${data.vehicle.vin}`, {
        x: vehicleX + 12,
        y: y - 48,
        size: 9,
        font: fonts.regular,
        color: MUTED_COLOR,
      });
    }
    
    if (data.vehicle.mileage) {
      page.drawText(`Kilométrage: ${data.vehicle.mileage.toLocaleString("fr-FR")} km`, {
        x: vehicleX + 12,
        y: y - (data.vehicle.vin ? 62 : 48),
        size: 9,
        font: fonts.regular,
        color: MUTED_COLOR,
      });
    }
  }
  
  return y - boxHeight - 25;
}

function renderLinesTable(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: QuotePdfData,
  startY: number
): number {
  const colWidths = {
    description: CONTENT_WIDTH * 0.40,
    qty: CONTENT_WIDTH * 0.10,
    unitPrice: CONTENT_WIDTH * 0.18,
    vat: CONTENT_WIDTH * 0.12,
    total: CONTENT_WIDTH * 0.20,
  };
  
  const rowHeight = 28;
  const headerHeight = 30;
  let y = startY;
  
  // Table header
  drawRoundedRect(page, MARGIN_LEFT, y - headerHeight, CONTENT_WIDTH, headerHeight, PRIMARY_COLOR);
  
  let headerX = MARGIN_LEFT + 8;
  const headerY = y - 20;
  const headerTextColor = rgb(1, 1, 1);
  
  page.drawText("DÉSIGNATION", { x: headerX, y: headerY, size: 8, font: fonts.bold, color: headerTextColor });
  headerX += colWidths.description;
  
  page.drawText("QTÉ", { x: headerX, y: headerY, size: 8, font: fonts.bold, color: headerTextColor });
  headerX += colWidths.qty;
  
  page.drawText("PRIX UNIT. HT", { x: headerX, y: headerY, size: 8, font: fonts.bold, color: headerTextColor });
  headerX += colWidths.unitPrice;
  
  page.drawText("TVA", { x: headerX, y: headerY, size: 8, font: fonts.bold, color: headerTextColor });
  headerX += colWidths.vat;
  
  page.drawText("TOTAL TTC", { x: headerX, y: headerY, size: 8, font: fonts.bold, color: headerTextColor });
  
  y -= headerHeight;
  
  // Table rows
  data.lines.forEach((line, index) => {
    const isEven = index % 2 === 0;
    
    if (isEven) {
      drawRoundedRect(page, MARGIN_LEFT, y - rowHeight, CONTENT_WIDTH, rowHeight, HEADER_BG);
    }
    
    const rowY = y - 18;
    let rowX = MARGIN_LEFT + 8;
    
    // Description (truncated if too long)
    const desc = truncateText(line.description, 45);
    page.drawText(desc, { x: rowX, y: rowY, size: 9, font: fonts.regular, color: TEXT_COLOR });
    rowX += colWidths.description;
    
    // Quantity
    page.drawText(line.qty.toString(), { x: rowX, y: rowY, size: 9, font: fonts.regular, color: TEXT_COLOR });
    rowX += colWidths.qty;
    
    // Unit price
    page.drawText(formatCurrency(line.unitPriceExcl, data.currency), { x: rowX, y: rowY, size: 9, font: fonts.regular, color: TEXT_COLOR });
    rowX += colWidths.unitPrice;
    
    // VAT rate
    page.drawText(formatVatRate(line.vatRate), { x: rowX, y: rowY, size: 9, font: fonts.regular, color: TEXT_COLOR });
    rowX += colWidths.vat;
    
    // Total TTC
    page.drawText(formatCurrency(line.lineTotalIncl, data.currency), { x: rowX, y: rowY, size: 9, font: fonts.bold, color: TEXT_COLOR });
    
    y -= rowHeight;
    
    // Draw bottom border
    drawLine(page, MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y, BORDER_COLOR);
  });
  
  return y - 20;
}

function renderTotalsSection(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: QuotePdfData,
  startY: number
): number {
  const boxWidth = 220;
  const boxHeight = 90;
  const boxX = PAGE_WIDTH - MARGIN_RIGHT - boxWidth;
  let y = startY;
  
  // Totals box
  drawRoundedRect(page, boxX, y - boxHeight, boxWidth, boxHeight, HEADER_BG, BORDER_COLOR);
  
  const labelX = boxX + 15;
  const valueX = boxX + boxWidth - 15;
  
  // Subtotal HT
  page.drawText("Sous-total HT", { x: labelX, y: y - 22, size: 9, font: fonts.regular, color: MUTED_COLOR });
  const subtotalText = formatCurrency(data.subtotalExcl, data.currency);
  const subtotalWidth = fonts.regular.widthOfTextAtSize(subtotalText, 9);
  page.drawText(subtotalText, { x: valueX - subtotalWidth, y: y - 22, size: 9, font: fonts.regular, color: TEXT_COLOR });
  
  // TVA
  page.drawText("TVA", { x: labelX, y: y - 40, size: 9, font: fonts.regular, color: MUTED_COLOR });
  const vatText = formatCurrency(data.totalVat, data.currency);
  const vatWidth = fonts.regular.widthOfTextAtSize(vatText, 9);
  page.drawText(vatText, { x: valueX - vatWidth, y: y - 40, size: 9, font: fonts.regular, color: TEXT_COLOR });
  
  // Separator
  drawLine(page, labelX, y - 52, valueX, y - 52, BORDER_COLOR, 0.5);
  
  // Total TTC
  page.drawText("TOTAL TTC", { x: labelX, y: y - 70, size: 11, font: fonts.bold, color: TEXT_COLOR });
  const totalText = formatCurrency(data.totalIncl, data.currency);
  const totalWidth = fonts.bold.widthOfTextAtSize(totalText, 14);
  page.drawText(totalText, { x: valueX - totalWidth, y: y - 72, size: 14, font: fonts.bold, color: PRIMARY_COLOR });
  
  y = y - boxHeight - 30;

  // Signature section if signed
  if (data.signedAt && data.signerName) {
    const signBoxWidth = CONTENT_WIDTH;
    const signBoxHeight = 60;
    const signBoxX = MARGIN_LEFT;
    const signBoxY = y - signBoxHeight;
    
    // Green signature box
    const signedBg = rgb(0.94, 0.99, 0.95); // Light green
    const signedBorder = rgb(0.22, 0.80, 0.47); // Green border
    drawRoundedRect(page, signBoxX, signBoxY, signBoxWidth, signBoxHeight, signedBg, signedBorder);
    
    // Green circle indicator instead of checkmark (WinAnsi doesn't support unicode checkmarks)
    const circleX = signBoxX + 22;
    const circleY = signBoxY + signBoxHeight / 2;
    page.drawCircle({
      x: circleX,
      y: circleY,
      size: 8,
      color: signedBorder,
    });
    
    // Signature text
    page.drawText("DOCUMENT SIGNE ELECTRONIQUEMENT", {
      x: signBoxX + 45,
      y: signBoxY + signBoxHeight - 20,
      size: 10,
      font: fonts.bold,
      color: rgb(0.06, 0.44, 0.25), // Dark green
    });
    
    // Format date without accented month names (WinAnsi safe)
    const signedDateObj = new Date(data.signedAt);
    const day = signedDateObj.getDate();
    const month = signedDateObj.getMonth() + 1;
    const year = signedDateObj.getFullYear();
    const hours = signedDateObj.getHours().toString().padStart(2, "0");
    const minutes = signedDateObj.getMinutes().toString().padStart(2, "0");
    const signedDate = `${day}/${month}/${year} a ${hours}:${minutes}`;
    
    page.drawText(`Signe par ${data.signerName} le ${signedDate}`, {
      x: signBoxX + 45,
      y: signBoxY + signBoxHeight - 38,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    
    y = signBoxY - 20;
  }

  return y;
}

function renderLegalSection(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: QuotePdfData,
  startY: number
): number {
  let y = startY;
  
  // Validity and conditions
  page.drawText("CONDITIONS", {
    x: MARGIN_LEFT,
    y,
    size: 8,
    font: fonts.bold,
    color: MUTED_COLOR,
  });
  y -= 15;
  
  const conditions = [
    "• Ce devis est valable 30 jours à compter de sa date d'émission.",
    "• Pour accepter ce devis, veuillez le signer et nous le retourner.",
    "• Paiement selon les conditions convenues lors de l'acceptation.",
  ];
  
  for (const condition of conditions) {
    page.drawText(condition, {
      x: MARGIN_LEFT,
      y,
      size: 8,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 12;
  }
  
  y -= 15;
  
  // Legal mentions
  if (data.organisation.siret) {
    page.drawText(`SIRET: ${data.organisation.siret}`, {
      x: MARGIN_LEFT,
      y,
      size: 7,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 10;
  }
  
  if (data.organisation.vatNumber) {
    page.drawText(`N° TVA: ${data.organisation.vatNumber}`, {
      x: MARGIN_LEFT,
      y,
      size: 7,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
  }
  
  return y;
}

function renderFooter(page: PDFPage, fonts: { regular: PDFFont }): void {
  const footerY = MARGIN_BOTTOM - 20;
  
  // Separator line
  drawLine(page, MARGIN_LEFT, footerY + 15, PAGE_WIDTH - MARGIN_RIGHT, footerY + 15, BORDER_COLOR);
  
  // Footer text
  const footerText = "Généré avec SafeMotor — motorsafe.fr";
  const textWidth = fonts.regular.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (PAGE_WIDTH - textWidth) / 2,
    y: footerY,
    size: 8,
    font: fonts.regular,
    color: MUTED_COLOR,
  });
}

// ============================================
// Main Export Function
// ============================================

export async function generateQuotePdf(
  data: QuotePdfData,
  brandingCtx: PdfBrandingContext | null = null
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular: regularFont, bold: boldFont };
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  
  // Render sections
  y = renderHeader(page, fonts, data, brandingCtx, y);
  y = renderClientSection(page, fonts, data, y);
  y = renderLinesTable(page, fonts, data, y);
  y = renderTotalsSection(page, fonts, data, y);
  
  // Only render legal section if we have space
  if (y > MARGIN_BOTTOM + 100) {
    renderLegalSection(page, fonts, data, y);
  }
  
  // Footer
  renderFooter(page, fonts);
  
  return pdf.save();
}
