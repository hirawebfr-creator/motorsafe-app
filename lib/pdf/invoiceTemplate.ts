/**
 * Modern PDF Template for Invoices (Factures)
 * 
 * Creates a professional, visually appealing PDF with:
 * - Clean header with logo and document info
 * - Styled table for line items
 * - Summary box with totals and payment status
 * - Footer with legal mentions
 */

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
import { PdfBrandingContext } from "./branding";

// ============================================
// Types
// ============================================

export interface InvoicePdfData {
  invoiceNumber: string | null;
  status: string;
  createdAt: Date;
  dueDate?: Date | null;
  paidAt?: Date | null;
  
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
  amountPaid: number;
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
    iban?: string | null;
    bic?: string | null;
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
const PRIMARY_COLOR = rgb(0.39, 0.40, 0.95); // Indigo #6366F1
const SUCCESS_COLOR = rgb(0.063, 0.725, 0.506); // Green #10B981
const DANGER_COLOR = rgb(0.937, 0.267, 0.267); // Red #EF4444
const TEXT_COLOR = rgb(0.067, 0.09, 0.165); // #111827
const MUTED_COLOR = rgb(0.42, 0.45, 0.51); // #6B7280
const BORDER_COLOR = rgb(0.90, 0.91, 0.92); // #E5E7EB
const HEADER_BG = rgb(0.969, 0.973, 0.98); // #F8F9FB
const ACCENT_BG = rgb(0.933, 0.941, 1); // #EEF2FF

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
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
  borderColor?: ReturnType<typeof rgb>,
  borderWidth = 1
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color,
    borderColor,
    borderWidth: borderColor ? borderWidth : 0,
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
  data: InvoicePdfData,
  brandingCtx: PdfBrandingContext | null,
  startY: number
): number {
  let y = startY;
  
  // === LEFT: Organisation Info ===
  const orgName = brandingCtx?.garage.displayName || data.organisation.displayName || data.organisation.name;
  page.drawText(orgName.toUpperCase(), {
    x: MARGIN_LEFT,
    y,
    size: 18,
    font: fonts.bold,
    color: PRIMARY_COLOR,
  });
  y -= 22;
  
  if (data.organisation.address) {
    page.drawText(data.organisation.address, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 13;
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
    y -= 13;
  }
  
  if (data.organisation.phone) {
    page.drawText(`Tel: ${data.organisation.phone}`, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 13;
  }
  
  if (data.organisation.email) {
    page.drawText(data.organisation.email, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    y -= 13;
  }
  
  // === RIGHT: Invoice Title Box ===
  const boxWidth = 200;
  const boxHeight = 85;
  const boxX = PAGE_WIDTH - MARGIN_RIGHT - boxWidth;
  const boxY = startY - boxHeight + 15;
  
  // Gradient effect simulation with two overlapping rectangles
  drawRoundedRect(page, boxX, boxY, boxWidth, boxHeight, ACCENT_BG, PRIMARY_COLOR, 1.5);
  
  // "FACTURE" title
  page.drawText("FACTURE", {
    x: boxX + 18,
    y: boxY + boxHeight - 28,
    size: 22,
    font: fonts.bold,
    color: PRIMARY_COLOR,
  });
  
  // Invoice number
  const invoiceNum = data.invoiceNumber || `#${data.invoiceNumber}`;
  page.drawText(invoiceNum, {
    x: boxX + 18,
    y: boxY + boxHeight - 50,
    size: 12,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  
  // Date
  page.drawText(`Date: ${formatDate(data.createdAt)}`, {
    x: boxX + 18,
    y: boxY + boxHeight - 68,
    size: 9,
    font: fonts.regular,
    color: MUTED_COLOR,
  });
  
  // Due date if present
  if (data.dueDate) {
    page.drawText(`Échéance: ${formatDate(data.dueDate)}`, {
      x: boxX + 18,
      y: boxY + boxHeight - 82,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
  }
  
  return Math.min(y, boxY) - 35;
}

function renderClientSection(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: InvoicePdfData,
  startY: number
): number {
  let y = startY;
  
  // Section title
  page.drawText("FACTURE A", {
    x: MARGIN_LEFT,
    y,
    size: 9,
    font: fonts.bold,
    color: MUTED_COLOR,
  });
  y -= 20;
  
  // Client box
  const boxHeight = 90;
  const boxWidth = 230;
  drawRoundedRect(page, MARGIN_LEFT, y - boxHeight, boxWidth, boxHeight, HEADER_BG);
  
  const clientName = `${data.client.firstName} ${data.client.lastName}`;
  page.drawText(clientName, {
    x: MARGIN_LEFT + 15,
    y: y - 20,
    size: 12,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  
  let clientY = y - 38;
  
  if (data.client.address) {
    page.drawText(data.client.address, {
      x: MARGIN_LEFT + 15,
      y: clientY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    clientY -= 14;
  }
  
  if (data.client.postalCode || data.client.city) {
    const cityLine = [data.client.postalCode, data.client.city].filter(Boolean).join(" ");
    page.drawText(cityLine, {
      x: MARGIN_LEFT + 15,
      y: clientY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    clientY -= 14;
  }
  
  if (data.client.email) {
    page.drawText(data.client.email, {
      x: MARGIN_LEFT + 15,
      y: clientY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    clientY -= 14;
  }
  
  if (data.client.phone) {
    page.drawText(`Tel: ${data.client.phone}`, {
      x: MARGIN_LEFT + 15,
      y: clientY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
  }
  
  // Vehicle info (if present) - on the right
  if (data.vehicle) {
    const vehicleX = MARGIN_LEFT + boxWidth + 35;
    
    page.drawText("VEHICULE", {
      x: vehicleX,
      y: startY,
      size: 9,
      font: fonts.bold,
      color: MUTED_COLOR,
    });
    
    drawRoundedRect(page, vehicleX, y - boxHeight, boxWidth, boxHeight, HEADER_BG);
    
    const vehicleName = `${data.vehicle.brand} ${data.vehicle.model}`;
    page.drawText(vehicleName, {
      x: vehicleX + 15,
      y: y - 20,
      size: 12,
      font: fonts.bold,
      color: TEXT_COLOR,
    });
    
    page.drawText(`Immatriculation: ${data.vehicle.plate}`, {
      x: vehicleX + 15,
      y: y - 38,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    
    if (data.vehicle.vin) {
      page.drawText(`VIN: ${data.vehicle.vin}`, {
        x: vehicleX + 15,
        y: y - 52,
        size: 9,
        font: fonts.regular,
        color: MUTED_COLOR,
      });
    }
    
    if (data.vehicle.mileage) {
      page.drawText(`Kilometrage: ${data.vehicle.mileage.toLocaleString("fr-FR")} km`, {
        x: vehicleX + 15,
        y: y - (data.vehicle.vin ? 66 : 52),
        size: 9,
        font: fonts.regular,
        color: MUTED_COLOR,
      });
    }
  }
  
  return y - boxHeight - 30;
}

function renderLinesTable(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: InvoicePdfData,
  startY: number
): number {
  let y = startY;
  
  // Table header
  const headerHeight = 32;
  drawRoundedRect(page, MARGIN_LEFT, y - headerHeight, CONTENT_WIDTH, headerHeight, PRIMARY_COLOR);
  
  // Column positions
  const col1 = MARGIN_LEFT + 12; // Description
  const col2 = MARGIN_LEFT + 260; // Qté
  const col3 = MARGIN_LEFT + 310; // P.U. HT
  const col4 = MARGIN_LEFT + 380; // TVA
  const col5 = MARGIN_LEFT + 430; // Total TTC
  
  const headerY = y - 21;
  const white = rgb(1, 1, 1);
  
  page.drawText("Description", { x: col1, y: headerY, size: 9, font: fonts.bold, color: white });
  page.drawText("Qte", { x: col2, y: headerY, size: 9, font: fonts.bold, color: white });
  page.drawText("P.U. HT", { x: col3, y: headerY, size: 9, font: fonts.bold, color: white });
  page.drawText("TVA", { x: col4, y: headerY, size: 9, font: fonts.bold, color: white });
  page.drawText("Total TTC", { x: col5, y: headerY, size: 9, font: fonts.bold, color: white });
  
  y -= headerHeight;
  
  // Table rows
  const rowHeight = 28;
  let rowIndex = 0;
  
  for (const line of data.lines) {
    const isEven = rowIndex % 2 === 0;
    const rowBg = isEven ? rgb(1, 1, 1) : HEADER_BG;
    
    drawRoundedRect(page, MARGIN_LEFT, y - rowHeight, CONTENT_WIDTH, rowHeight, rowBg);
    
    const rowY = y - 18;
    
    // Description (truncated if too long)
    const desc = truncateText(line.description, 38);
    page.drawText(desc, { x: col1, y: rowY, size: 9, font: fonts.regular, color: TEXT_COLOR });
    
    // Quantity
    page.drawText(String(line.qty), { x: col2, y: rowY, size: 9, font: fonts.regular, color: TEXT_COLOR });
    
    // Unit price HT
    page.drawText(formatCurrency(line.unitPriceExcl, data.currency), { x: col3, y: rowY, size: 9, font: fonts.regular, color: TEXT_COLOR });
    
    // VAT rate
    page.drawText(formatVatRate(line.vatRate), { x: col4, y: rowY, size: 9, font: fonts.regular, color: MUTED_COLOR });
    
    // Total TTC
    const totalText = formatCurrency(line.lineTotalIncl, data.currency);
    const totalWidth = fonts.bold.widthOfTextAtSize(totalText, 9);
    page.drawText(totalText, { x: PAGE_WIDTH - MARGIN_RIGHT - 12 - totalWidth, y: rowY, size: 9, font: fonts.bold, color: TEXT_COLOR });
    
    y -= rowHeight;
    rowIndex++;
    
    // Check if we need a new page
    if (y < MARGIN_BOTTOM + 150) {
      // Would need new page logic here for very long invoices
      break;
    }
  }
  
  // Bottom border
  drawLine(page, MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y, BORDER_COLOR);
  
  return y - 25;
}

function renderTotalsSection(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: InvoicePdfData,
  startY: number
): number {
  let y = startY;
  
  // Totals box on the right
  const boxWidth = 220;
  const boxHeight = 120;
  const boxX = PAGE_WIDTH - MARGIN_RIGHT - boxWidth;
  
  drawRoundedRect(page, boxX, y - boxHeight, boxWidth, boxHeight, HEADER_BG, BORDER_COLOR);
  
  const labelX = boxX + 18;
  const valueX = boxX + boxWidth - 18;
  
  // Subtotal HT
  page.drawText("Sous-total HT", { x: labelX, y: y - 25, size: 10, font: fonts.regular, color: MUTED_COLOR });
  const subtotalText = formatCurrency(data.subtotalExcl, data.currency);
  const subtotalWidth = fonts.regular.widthOfTextAtSize(subtotalText, 10);
  page.drawText(subtotalText, { x: valueX - subtotalWidth, y: y - 25, size: 10, font: fonts.regular, color: TEXT_COLOR });
  
  // TVA
  page.drawText("TVA", { x: labelX, y: y - 48, size: 10, font: fonts.regular, color: MUTED_COLOR });
  const vatText = formatCurrency(data.totalVat, data.currency);
  const vatWidth = fonts.regular.widthOfTextAtSize(vatText, 10);
  page.drawText(vatText, { x: valueX - vatWidth, y: y - 48, size: 10, font: fonts.regular, color: TEXT_COLOR });
  
  // Separator
  drawLine(page, labelX, y - 62, valueX, y - 62, BORDER_COLOR, 0.5);
  
  // Total TTC
  page.drawText("TOTAL TTC", { x: labelX, y: y - 82, size: 12, font: fonts.bold, color: TEXT_COLOR });
  const totalText = formatCurrency(data.totalIncl, data.currency);
  const totalWidth = fonts.bold.widthOfTextAtSize(totalText, 16);
  page.drawText(totalText, { x: valueX - totalWidth, y: y - 84, size: 16, font: fonts.bold, color: PRIMARY_COLOR });
  
  // Amount paid
  page.drawText("Déjà payé", { x: labelX, y: y - 105, size: 9, font: fonts.regular, color: MUTED_COLOR });
  const paidText = formatCurrency(data.amountPaid, data.currency);
  const paidWidth = fonts.regular.widthOfTextAtSize(paidText, 9);
  page.drawText(paidText, { x: valueX - paidWidth, y: y - 105, size: 9, font: fonts.regular, color: SUCCESS_COLOR });
  
  y = y - boxHeight - 20;
  
  // Balance due if applicable
  const balanceDue = data.totalIncl - data.amountPaid;
  if (balanceDue > 0.01) {
    const balanceBoxWidth = 220;
    const balanceBoxHeight = 50;
    
    drawRoundedRect(page, boxX, y - balanceBoxHeight, balanceBoxWidth, balanceBoxHeight, rgb(1, 0.95, 0.94), DANGER_COLOR, 1.5);
    
    page.drawText("SOLDE DU", { x: boxX + 18, y: y - 22, size: 10, font: fonts.bold, color: DANGER_COLOR });
    const balanceText = formatCurrency(balanceDue, data.currency);
    const balanceWidth = fonts.bold.widthOfTextAtSize(balanceText, 16);
    page.drawText(balanceText, { x: boxX + balanceBoxWidth - 18 - balanceWidth, y: y - 35, size: 16, font: fonts.bold, color: DANGER_COLOR });
    
    y = y - balanceBoxHeight - 15;
  } else if (data.amountPaid >= data.totalIncl) {
    // Paid badge
    const paidBoxWidth = 220;
    const paidBoxHeight = 45;
    
    drawRoundedRect(page, boxX, y - paidBoxHeight, paidBoxWidth, paidBoxHeight, rgb(0.94, 0.99, 0.95), SUCCESS_COLOR, 1.5);
    
    // Circle indicator
    page.drawCircle({
      x: boxX + 28,
      y: y - paidBoxHeight / 2,
      size: 10,
      color: SUCCESS_COLOR,
    });
    
    page.drawText("FACTURE PAYEE", { x: boxX + 50, y: y - 28, size: 12, font: fonts.bold, color: rgb(0.06, 0.44, 0.25) });
    
    y = y - paidBoxHeight - 15;
  }
  
  return y;
}

function renderPaymentInfo(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: InvoicePdfData,
  startY: number
): number {
  let y = startY;
  
  // Only show if IBAN is available
  if (!data.organisation.iban) return y;
  
  // Payment info box on the left
  const boxWidth = 280;
  const boxHeight = 70;
  
  page.drawText("INFORMATIONS DE PAIEMENT", {
    x: MARGIN_LEFT,
    y,
    size: 9,
    font: fonts.bold,
    color: MUTED_COLOR,
  });
  y -= 18;
  
  drawRoundedRect(page, MARGIN_LEFT, y - boxHeight, boxWidth, boxHeight, ACCENT_BG);
  
  let infoY = y - 18;
  
  page.drawText(`IBAN: ${data.organisation.iban}`, {
    x: MARGIN_LEFT + 15,
    y: infoY,
    size: 9,
    font: fonts.regular,
    color: TEXT_COLOR,
  });
  infoY -= 16;
  
  if (data.organisation.bic) {
    page.drawText(`BIC: ${data.organisation.bic}`, {
      x: MARGIN_LEFT + 15,
      y: infoY,
      size: 9,
      font: fonts.regular,
      color: TEXT_COLOR,
    });
    infoY -= 16;
  }
  
  page.drawText(`Titulaire: ${data.organisation.displayName || data.organisation.name}`, {
    x: MARGIN_LEFT + 15,
    y: infoY,
    size: 9,
    font: fonts.regular,
    color: MUTED_COLOR,
  });
  
  return y - boxHeight - 20;
}

function renderLegalSection(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  data: InvoicePdfData,
  startY: number
): number {
  let y = startY;
  
  // Legal mentions
  const legalY = Math.min(y, MARGIN_BOTTOM + 70);
  
  let legalLine = legalY;
  
  if (data.organisation.siret) {
    page.drawText(`SIRET: ${data.organisation.siret}`, {
      x: MARGIN_LEFT,
      y: legalLine,
      size: 7,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    legalLine -= 11;
  }
  
  if (data.organisation.vatNumber) {
    page.drawText(`N. TVA Intracommunautaire: ${data.organisation.vatNumber}`, {
      x: MARGIN_LEFT,
      y: legalLine,
      size: 7,
      font: fonts.regular,
      color: MUTED_COLOR,
    });
    legalLine -= 11;
  }
  
  // Conditions
  page.drawText("En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.", {
    x: MARGIN_LEFT,
    y: legalLine,
    size: 7,
    font: fonts.regular,
    color: MUTED_COLOR,
  });
  
  return legalLine;
}

function renderFooter(page: PDFPage, fonts: { regular: PDFFont }): void {
  const footerY = MARGIN_BOTTOM - 25;
  
  // Separator line
  drawLine(page, MARGIN_LEFT, footerY + 18, PAGE_WIDTH - MARGIN_RIGHT, footerY + 18, BORDER_COLOR);
  
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

export async function generateInvoicePdf(
  data: InvoicePdfData,
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
  
  // Only render payment info if space allows
  if (y > MARGIN_BOTTOM + 120) {
    y = renderPaymentInfo(page, fonts, data, y);
  }
  
  // Only render legal section if we have space
  if (y > MARGIN_BOTTOM + 60) {
    renderLegalSection(page, fonts, data, y);
  }
  
  // Footer
  renderFooter(page, fonts);
  
  return pdf.save();
}
