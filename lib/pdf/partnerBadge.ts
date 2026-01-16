/**
 * Partner Badge Helper for PDFs
 * Computes effective badge status and provides rendering utilities
 */

import { join } from "path";
import { existsSync, readFileSync } from "fs";

export interface PartnerBadgeGarage {
  partnerBadgeEnabled?: boolean;
  partnerBadgeAdminOverride?: string;
}

/**
 * Compute effective partner badge status
 */
export function isPartnerBadgeActive(garage: PartnerBadgeGarage | null | undefined): boolean {
  if (!garage) return false;
  
  const override = garage.partnerBadgeAdminOverride || "NONE";
  if (override === "FORCE_ON") return true;
  if (override === "FORCE_OFF") return false;
  return garage.partnerBadgeEnabled ?? false;
}

/**
 * Load partner badge SVG buffer
 * Returns null if not found
 */
export function loadPartnerBadgeSvg(): Buffer | null {
  try {
    const badgePath = join(process.cwd(), "public", "brand", "partner-badge.svg");
    if (existsSync(badgePath)) {
      return readFileSync(badgePath);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Render partner badge on PDF document
 * Places badge at specified position (default: top right)
 * @param doc - PDFKit document
 * @param garage - Garage with partner badge fields
 * @param x - X position (default: right margin - badge width)
 * @param y - Y position
 * @param width - Badge width (default: 60)
 */
export function renderPartnerBadge(
  doc: PDFKit.PDFDocument,
  garage: PartnerBadgeGarage | null | undefined,
  options?: {
    x?: number;
    y?: number;
    width?: number;
  }
): boolean {
  if (!isPartnerBadgeActive(garage)) {
    return false;
  }

  const badgeBuffer = loadPartnerBadgeSvg();
  if (!badgeBuffer) {
    return false;
  }

  try {
    const width = options?.width ?? 60;
    const x = options?.x ?? (doc.page.width - doc.page.margins.right - width);
    const y = options?.y ?? doc.page.margins.top;

    // PDFKit can render SVG as image
    doc.image(badgeBuffer, x, y, { width });
    return true;
  } catch (err) {
    console.warn("Failed to render partner badge:", err);
    return false;
  }
}
