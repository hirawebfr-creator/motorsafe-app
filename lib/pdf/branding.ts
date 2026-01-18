/**
 * WHITE-LABEL-PARTNERS-01: PDF Branding Utilities
 * 
 * Shared utilities for adding garage logo, header, footer, and partner badge to PDFs.
 * Used by all PDF generation routes to ensure consistent branding.
 */

import { prisma } from "@/lib/prisma";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { isPartnerBadgeActive, loadPartnerBadgeSvg } from "./partnerBadge";
import { hasFeature, FeatureKey } from "@/lib/entitlements";

// ============================================
// Types
// ============================================

export interface BrandingGarage {
  id: number;
  name: string;
  displayName?: string | null;
  logoKey?: string | null;
  brandColor?: string | null;
  partnerBadgeEnabled?: boolean;
  partnerBadgeAdminOverride?: string;
  plan?: string;
}

export interface PdfBrandingContext {
  garage: BrandingGarage;
  logoBuffer: Buffer | null;
  hasBranding: boolean;
  showPartnerBadge: boolean;
  brandColor: string;
}

// ============================================
// Logo Loading
// ============================================

/**
 * Load garage logo from storage (S3 or local)
 * Returns null if logo not found or error
 */
export async function loadGarageLogo(logoKey: string | null | undefined): Promise<Buffer | null> {
  if (!logoKey) return null;

  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;

  if (bucket && region) {
    try {
      const client = new S3Client({
        region,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
      });

      const response = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: logoKey,
        })
      );

      if (response.Body) {
        const chunks: Uint8Array[] = [];
        const stream = response.Body as AsyncIterable<Uint8Array>;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      }
    } catch (err) {
      console.warn("[PDF Branding] Failed to load logo from S3:", err);
    }
  } else {
    // Local storage fallback
    try {
      const localPath = join(process.cwd(), "uploads", logoKey);
      if (existsSync(localPath)) {
        return readFileSync(localPath);
      }
    } catch (err) {
      console.warn("[PDF Branding] Failed to load logo from local:", err);
    }
  }

  return null;
}

// ============================================
// Branding Context Builder
// ============================================

/**
 * Build PDF branding context for a garage
 * Checks features, loads logo, determines badge status
 */
export async function buildPdfBrandingContext(garageId: number): Promise<PdfBrandingContext | null> {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: {
      id: true,
      name: true,
      displayName: true,
      logoKey: true,
      brandColor: true,
      partnerBadgeEnabled: true,
      partnerBadgeAdminOverride: true,
      plan: true,
    },
  });

  if (!garage) return null;

  // Check branding feature
  const hasBranding = await hasFeature(garageId, FeatureKey.BRANDING);
  
  // Load logo only if branding enabled
  const logoBuffer = hasBranding ? await loadGarageLogo(garage.logoKey) : null;
  
  // Check partner badge (PRO only)
  const hasPartnerFeature = await hasFeature(garageId, FeatureKey.PARTNER_BADGE);
  const showPartnerBadge = hasPartnerFeature && isPartnerBadgeActive(garage);

  return {
    garage,
    logoBuffer,
    hasBranding,
    showPartnerBadge,
    brandColor: garage.brandColor || "#4ADE80",
  };
}

// ============================================
// PDF Rendering Functions
// ============================================

const DEFAULT_LOGO_HEIGHT = 36;
const PARTNER_BADGE_WIDTH = 50;
const FOOTER_HEIGHT = 20;

/**
 * Render PDF header with garage logo and document info
 * Returns the Y position after the header
 */
export function renderPdfHeader(
  doc: PDFKit.PDFDocument,
  ctx: PdfBrandingContext,
  options?: {
    title?: string;
    documentNumber?: string;
    date?: string;
  }
): number {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = doc.page.margins.top;

  let headerY = top;

  // === LEFT: Logo or Garage Name ===
  if (ctx.logoBuffer && ctx.hasBranding) {
    try {
      doc.image(ctx.logoBuffer, left, headerY, { height: DEFAULT_LOGO_HEIGHT });
    } catch (err) {
      // Fallback to text if image fails
      console.warn("[PDF Branding] Logo render failed, using text fallback");
      doc.fontSize(14).font("Helvetica-Bold")
        .text(ctx.garage.displayName || ctx.garage.name, left, headerY);
    }
  } else {
    // No logo: use garage name
    doc.fontSize(14).font("Helvetica-Bold")
      .text(ctx.garage.displayName || ctx.garage.name, left, headerY);
  }

  // === RIGHT: Partner badge (if enabled) ===
  if (ctx.showPartnerBadge) {
    const badgeBuffer = loadPartnerBadgeSvg();
    if (badgeBuffer) {
      try {
        doc.image(badgeBuffer, right - PARTNER_BADGE_WIDTH, headerY, { width: PARTNER_BADGE_WIDTH });
      } catch {
        // Silently ignore badge rendering failure
      }
    }
  }

  // === RIGHT: Document info ===
  const infoX = right - 150;
  let infoY = headerY;
  
  if (options?.documentNumber) {
    doc.fontSize(9).font("Helvetica-Bold").text(options.documentNumber, infoX, infoY, { width: 150, align: "right" });
    infoY += 12;
  }
  if (options?.date) {
    doc.fontSize(9).font("Helvetica").text(options.date, infoX, infoY, { width: 150, align: "right" });
    infoY += 12;
  }

  // Title below logo
  const titleY = headerY + DEFAULT_LOGO_HEIGHT + 10;
  if (options?.title) {
    doc.fontSize(16).font("Helvetica-Bold").text(options.title, left, titleY);
  }

  // Divider line
  const dividerY = titleY + (options?.title ? 24 : 0);
  doc.moveTo(left, dividerY).lineTo(right, dividerY).strokeColor("#ddd").lineWidth(0.5).stroke();

  return dividerY + 15;
}

/**
 * Render PDF footer with "Généré avec SafeMotor" branding
 * Should be called on each page
 */
export function renderPdfFooter(doc: PDFKit.PDFDocument, _ctx: PdfBrandingContext): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const bottom = doc.page.height - doc.page.margins.bottom;
  const footerY = bottom - FOOTER_HEIGHT;

  // Divider line
  doc.moveTo(left, footerY - 5).lineTo(right, footerY - 5).strokeColor("#ddd").lineWidth(0.5).stroke();

  // Footer text
  doc.fontSize(8).font("Helvetica").fillColor("#888")
    .text("Généré avec SafeMotor — motorsafe.fr", left, footerY, {
      width: right - left,
      align: "center",
    });

  // Page number (if multiple pages)
  const pageNum = doc.bufferedPageRange();
  if (pageNum.count > 1) {
    doc.text(`Page ${pageNum.start + 1}`, right - 50, footerY, { width: 50, align: "right" });
  }
}

/**
 * Setup page footer hook - call this after creating the document
 * Automatically adds footer to each page
 */
export function setupPageFooterHook(doc: PDFKit.PDFDocument, ctx: PdfBrandingContext): void {
  doc.on("pageAdded", () => {
    renderPdfFooter(doc, ctx);
  });
}

// ============================================
// Helper: Get minimal branding for PDF
// ============================================

/**
 * Quick branding check for PDF routes that just need logo
 * Returns logo buffer if available, null otherwise
 */
export async function getLogoForPdf(garageId: number): Promise<Buffer | null> {
  const hasBranding = await hasFeature(garageId, FeatureKey.BRANDING);
  if (!hasBranding) return null;

  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: { logoKey: true },
  });

  if (!garage?.logoKey) return null;

  return loadGarageLogo(garage.logoKey);
}

// ============================================
// PDF-LIB Support (for quotes/invoices)
// ============================================

import { PDFPage, rgb, PDFFont } from "pdf-lib";

/**
 * Render header for pdf-lib documents (quotes/invoices)
 * Returns the Y position to start content (from top, pdf-lib uses bottom-up)
 */
export async function renderPdfLibHeader(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  ctx: PdfBrandingContext,
  options?: {
    title?: string;
    documentNumber?: string;
    date?: string;
  }
): Promise<number> {
  const { width, height } = page.getSize();
  const left = 50;
  const top = height - 50;
  let y = top;

  // === LEFT: Logo or Garage Name ===
  if (ctx.logoBuffer && ctx.hasBranding) {
    try {
      // Embed PNG logo
      const pdfDoc = page.doc;
      const logoImage = await pdfDoc.embedPng(ctx.logoBuffer);
      const logoDims = logoImage.scale(36 / logoImage.height); // Scale to 36px height
      page.drawImage(logoImage, {
        x: left,
        y: y - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch {
      // Fallback to text
      page.drawText(ctx.garage.displayName || ctx.garage.name, {
        x: left,
        y,
        size: 14,
        font: fonts.bold,
      });
    }
  } else {
    // No logo: use garage name
    page.drawText(ctx.garage.displayName || ctx.garage.name, {
      x: left,
      y,
      size: 14,
      font: fonts.bold,
    });
  }

  // === RIGHT: Document info ===
  const rightMargin = width - 50;
  if (options?.documentNumber) {
    const text = options.documentNumber;
    const textWidth = fonts.bold.widthOfTextAtSize(text, 10);
    page.drawText(text, {
      x: rightMargin - textWidth,
      y,
      size: 10,
      font: fonts.bold,
    });
    y -= 14;
  }
  if (options?.date) {
    const text = options.date;
    const textWidth = fonts.regular.widthOfTextAtSize(text, 10);
    page.drawText(text, {
      x: rightMargin - textWidth,
      y,
      size: 10,
      font: fonts.regular,
    });
  }

  // Title below header
  y = top - 50;
  if (options?.title) {
    page.drawText(options.title, {
      x: left,
      y,
      size: 14,
      font: fonts.bold,
    });
    y -= 20;
  }

  // Divider line
  page.drawLine({
    start: { x: left, y: y + 5 },
    end: { x: rightMargin, y: y + 5 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  return y - 10;
}

/**
 * Render footer for pdf-lib documents
 */
export function renderPdfLibFooter(
  page: PDFPage,
  fonts: { regular: PDFFont },
  _ctx: PdfBrandingContext
): void {
  const { width } = page.getSize();
  const bottom = 30;
  const text = "Généré avec SafeMotor — motorsafe.fr";
  const textWidth = fonts.regular.widthOfTextAtSize(text, 8);

  page.drawText(text, {
    x: (width - textWidth) / 2,
    y: bottom,
    size: 8,
    font: fonts.regular,
    color: rgb(0.5, 0.5, 0.5),
  });
}
