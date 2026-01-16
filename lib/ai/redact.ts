/**
 * AI Redaction - Remove sensitive data before sending to LLM
 * 
 * CRITICAL: All data sent to external AI providers MUST go through this module.
 * No PII, no cross-tenant data leaks.
 */

// ============================================
// Redaction Patterns
// ============================================

/**
 * French license plate patterns:
 * - New format: AA-123-BB or AA123BB
 * - Old format: 1234 AB 75 or 1234AB75
 */
const PLATE_PATTERNS = [
  /\b[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}\b/gi,  // New format
  /\b\d{1,4}[-\s]?[A-Z]{1,3}[-\s]?\d{1,3}\b/gi,  // Old format
];

/**
 * VIN patterns (17 alphanumeric characters, no I, O, Q)
 */
const VIN_PATTERN = /\b[A-HJ-NPR-Z0-9]{17}\b/gi;

/**
 * Email pattern
 */
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;

/**
 * French phone patterns:
 * - 06 12 34 56 78
 * - 0612345678
 * - +33 6 12 34 56 78
 */
const PHONE_PATTERNS = [
  /\b(?:\+33|0033|0)\s?[1-9](?:[\s.-]?\d{2}){4}\b/gi,
  /\b\d{10}\b/g,  // Fallback for unspaced numbers
];

/**
 * Address patterns (simplified - street numbers and common street terms)
 */
const ADDRESS_PATTERNS = [
  /\b\d{1,5}\s+(?:rue|avenue|boulevard|impasse|place|allée|chemin|route)\s+[A-Za-zÀ-ÿ\s-]+/gi,
  /\b(?:BP|CS|TSA)\s*\d+\b/gi,  // PO boxes
];

/**
 * IBAN pattern
 */
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}\s?(?:[A-Z0-9]{4}\s?){2,7}[A-Z0-9]{1,4}\b/gi;

/**
 * Masked values for redaction
 */
const MASK_PLATE = "[PLATE]";
const MASK_VIN = "[VIN]";
const MASK_EMAIL = "[EMAIL]";
const MASK_PHONE = "[PHONE]";
const MASK_ADDRESS = "[ADDRESS]";
const MASK_IBAN = "[IBAN]";

// ============================================
// Redaction Functions
// ============================================

export interface RedactionResult {
  text: string;
  redactedCount: number;
  types: string[];
}

/**
 * Redact all sensitive information from text
 * Returns cleaned text + count of redacted items
 */
export function redactSensitiveData(input: string | null | undefined): RedactionResult {
  if (!input) {
    return { text: "", redactedCount: 0, types: [] };
  }

  let text = input;
  let redactedCount = 0;
  const types = new Set<string>();

  // IBAN (do first as it can overlap with other patterns)
  const ibanMatches = text.match(IBAN_PATTERN) ?? [];
  if (ibanMatches.length > 0) {
    text = text.replace(IBAN_PATTERN, MASK_IBAN);
    redactedCount += ibanMatches.length;
    types.add("iban");
  }

  // Email
  const emailMatches = text.match(EMAIL_PATTERN) ?? [];
  if (emailMatches.length > 0) {
    text = text.replace(EMAIL_PATTERN, MASK_EMAIL);
    redactedCount += emailMatches.length;
    types.add("email");
  }

  // Phone
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    if (matches.length > 0) {
      // Filter out false positives (year numbers, etc.)
      const realMatches = matches.filter((m) => {
        const clean = m.replace(/[\s.-]/g, "");
        return clean.length >= 10 && !clean.match(/^(19|20)\d{2}/);  // Not a year
      });
      if (realMatches.length > 0) {
        for (const match of realMatches) {
          text = text.replace(match, MASK_PHONE);
        }
        redactedCount += realMatches.length;
        types.add("phone");
      }
    }
  }

  // VIN
  const vinMatches = text.match(VIN_PATTERN) ?? [];
  if (vinMatches.length > 0) {
    text = text.replace(VIN_PATTERN, MASK_VIN);
    redactedCount += vinMatches.length;
    types.add("vin");
  }

  // License plates
  for (const pattern of PLATE_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    if (matches.length > 0) {
      text = text.replace(pattern, MASK_PLATE);
      redactedCount += matches.length;
      types.add("plate");
    }
  }

  // Addresses
  for (const pattern of ADDRESS_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    if (matches.length > 0) {
      text = text.replace(pattern, MASK_ADDRESS);
      redactedCount += matches.length;
      types.add("address");
    }
  }

  return {
    text,
    redactedCount,
    types: Array.from(types),
  };
}

/**
 * Mask a plate for logging/display (show first 2 chars only)
 */
export function maskPlate(plate: string | null | undefined): string {
  if (!plate) return "[NO_PLATE]";
  const clean = plate.replace(/[\s-]/g, "").toUpperCase();
  if (clean.length < 3) return "[PLATE]";
  return clean.substring(0, 2) + "***";
}

/**
 * Mask a VIN for logging/display (show last 4 chars only)
 */
export function maskVin(vin: string | null | undefined): string {
  if (!vin) return "[NO_VIN]";
  if (vin.length < 5) return "[VIN]";
  return "***" + vin.substring(vin.length - 4);
}

/**
 * Create safe context for AI prompt from intervention data
 * Only includes non-identifying information
 */
export function createSafeContext(data: {
  type?: string;
  tags?: string[];
  symptoms?: string | null;
  workNotes?: string | null;
  partsNotes?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
}): {
  safeContext: string;
  redactionReport: { field: string; count: number }[];
} {
  const redactionReport: { field: string; count: number }[] = [];

  // Redact symptoms
  const symptomsResult = redactSensitiveData(data.symptoms);
  if (symptomsResult.redactedCount > 0) {
    redactionReport.push({ field: "symptoms", count: symptomsResult.redactedCount });
  }

  // Redact work notes
  const workResult = redactSensitiveData(data.workNotes);
  if (workResult.redactedCount > 0) {
    redactionReport.push({ field: "workNotes", count: workResult.redactedCount });
  }

  // Redact parts notes
  const partsResult = redactSensitiveData(data.partsNotes);
  if (partsResult.redactedCount > 0) {
    redactionReport.push({ field: "partsNotes", count: partsResult.redactedCount });
  }

  // Build safe context string
  const lines: string[] = [];
  
  if (data.type) {
    lines.push(`Type d'intervention: ${data.type}`);
  }
  
  if (data.tags && data.tags.length > 0) {
    lines.push(`Tags: ${data.tags.join(", ")}`);
  }
  
  if (data.vehicleBrand || data.vehicleModel) {
    const vehicle = [data.vehicleBrand, data.vehicleModel, data.vehicleYear]
      .filter(Boolean)
      .join(" ");
    lines.push(`Véhicule: ${vehicle}`);
  }
  
  if (symptomsResult.text) {
    lines.push(`Symptômes client: ${symptomsResult.text}`);
  }
  
  if (workResult.text) {
    lines.push(`Notes travaux: ${workResult.text}`);
  }
  
  if (partsResult.text) {
    lines.push(`Pièces: ${partsResult.text}`);
  }

  return {
    safeContext: lines.join("\n"),
    redactionReport,
  };
}
