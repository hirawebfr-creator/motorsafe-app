/**
 * CSV Parsing & Validation for Import
 * IMPORT-ONBOARDING-01
 * 
 * - Auto-detect delimiter (;, ,, tab)
 * - UTF-8 encoding
 * - Max 1MB file size
 * - Validate client/vehicle rows
 * - No PII in logs (security)
 */

import { normalizePlate, isValidFrenchPlate } from "@/lib/vehicleLookup";

// ============================================
// CONSTANTS
// ============================================

export const MAX_CSV_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
export const MAX_ERROR_SAMPLES = 50;

// ============================================
// TYPES
// ============================================

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  delimiter: string;
}

export interface ColumnMapping {
  // Target field -> Source column name
  [targetField: string]: string | null;
}

export interface ClientRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface VehicleRow {
  clientEmail?: string; // For linking to existing client
  clientId?: string;    // Or direct ID
  brand: string;
  model: string;
  plate: string;
  vin?: string;
  fuel?: string;
  year?: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string; // Truncated for security
}

export interface ValidationResult<T> {
  valid: T[];
  errors: ValidationError[];
  skipped: number;
}

// ============================================
// DELIMITER DETECTION
// ============================================

const DELIMITERS = [";", ",", "\t"] as const;

/**
 * Detect the most likely delimiter by counting occurrences in first lines
 */
export function detectDelimiter(content: string): string {
  const lines = content.split("\n").slice(0, 5); // Check first 5 lines
  
  const counts: Record<string, number[]> = {
    ";": [],
    ",": [],
    "\t": [],
  };
  
  for (const line of lines) {
    for (const delim of DELIMITERS) {
      counts[delim].push((line.match(new RegExp(escapeRegex(delim), "g")) || []).length);
    }
  }
  
  // Pick delimiter with most consistent non-zero count
  let bestDelim = ";";
  let bestScore = 0;
  
  for (const delim of DELIMITERS) {
    const arr = counts[delim];
    if (arr.length === 0) continue;
    
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / arr.length;
    
    // Score: high average, low variance (consistent columns)
    const score = avg / (1 + variance);
    if (score > bestScore && avg > 0) {
      bestScore = score;
      bestDelim = delim;
    }
  }
  
  return bestDelim;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================
// CSV PARSING
// ============================================

/**
 * Parse CSV content with quoted field support
 */
export function parseCSV(content: string, delimiter?: string): ParsedCSV {
  const delim = delimiter || detectDelimiter(content);
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  
  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: delim };
  }
  
  const headers = parseCSVLine(lines[0], delim).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delim);
    const row: Record<string, string> = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j]?.trim() || "";
    }
    
    rows.push(row);
  }
  
  return { headers, rows, delimiter: delim };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  
  result.push(current);
  return result;
}

// ============================================
// COLUMN MAPPING
// ============================================

export const CLIENT_COLUMNS = {
  required: ["firstName", "lastName"] as const,
  optional: ["email", "phone", "address", "notes"] as const,
};

export const VEHICLE_COLUMNS = {
  required: ["brand", "model", "plate"] as const,
  optional: ["clientEmail", "clientId", "vin", "fuel", "year"] as const,
};

/**
 * Auto-map CSV headers to target fields (fuzzy matching)
 */
export function autoMapColumns(
  headers: string[],
  kind: "clients" | "vehicules"
): ColumnMapping {
  const mapping: ColumnMapping = {};
  const targetFields =
    kind === "clients"
      ? [...CLIENT_COLUMNS.required, ...CLIENT_COLUMNS.optional]
      : [...VEHICLE_COLUMNS.required, ...VEHICLE_COLUMNS.optional];
  
  const normalizedHeaders = headers.map((h) => normalizeHeader(h));
  
  for (const field of targetFields) {
    const patterns = getFieldPatterns(field);
    
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalized = normalizedHeaders[i];
      if (patterns.some((p) => normalized.includes(p))) {
        mapping[field] = headers[i];
        break;
      }
    }
    
    if (!mapping[field]) {
      mapping[field] = null;
    }
  }
  
  return mapping;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, "");
}

function getFieldPatterns(field: string): string[] {
  const patterns: Record<string, string[]> = {
    // Client fields
    firstName: ["prenom", "firstname", "first"],
    lastName: ["nom", "lastname", "last", "name"],
    email: ["email", "mail", "courriel"],
    phone: ["telephone", "tel", "phone", "mobile", "portable"],
    address: ["adresse", "address", "rue", "street"],
    notes: ["notes", "commentaire", "comment", "remarque", "observation"],
    
    // Vehicle fields
    brand: ["marque", "brand", "constructeur", "make"],
    model: ["modele", "model", "version"],
    plate: ["immatriculation", "plaque", "plate", "immat"],
    vin: ["vin", "numerochassis", "chassis", "serie"],
    fuel: ["carburant", "fuel", "energie", "motorisation"],
    year: ["annee", "year", "millesime", "date1ercirculation", "mise"],
    clientEmail: ["emailclient", "clientemail", "proprietaire"],
    clientId: ["clientid", "idclient", "client"],
  };
  
  return patterns[field] || [field.toLowerCase()];
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate client rows from mapped CSV data
 */
export function validateClientRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ValidationResult<ClientRow> {
  const valid: ClientRow[] = [];
  const errors: ValidationError[] = [];
  let skipped = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +2 for header row and 1-indexed
    const row = rows[i];
    const rowErrors: ValidationError[] = [];
    
    // Get mapped values
    const firstName = getVal(row, mapping, "firstName");
    const lastName = getVal(row, mapping, "lastName");
    const email = getVal(row, mapping, "email");
    const phone = getVal(row, mapping, "phone");
    const address = getVal(row, mapping, "address");
    const notes = getVal(row, mapping, "notes");
    
    // Check required fields
    if (!firstName) {
      rowErrors.push({
        row: rowNum,
        field: "firstName",
        message: "Prénom obligatoire",
      });
    }
    
    if (!lastName) {
      rowErrors.push({
        row: rowNum,
        field: "lastName",
        message: "Nom obligatoire",
      });
    }
    
    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      rowErrors.push({
        row: rowNum,
        field: "email",
        message: "Format email invalide",
        value: truncate(email),
      });
    }
    
    // Validate phone if provided
    const normalizedPhone = phone ? normalizePhone(phone) : undefined;
    if (phone && normalizedPhone && !isValidPhone(normalizedPhone)) {
      rowErrors.push({
        row: rowNum,
        field: "phone",
        message: "Format téléphone invalide",
        value: truncate(phone),
      });
    }
    
    if (rowErrors.length > 0) {
      // Skip if row is completely empty
      if (!firstName && !lastName && !email && !phone) {
        skipped++;
      } else {
        errors.push(...rowErrors.slice(0, 3)); // Max 3 errors per row
      }
    } else {
      valid.push({
        firstName: firstName!.trim(),
        lastName: lastName!.trim(),
        email: email?.trim() || undefined,
        phone: normalizedPhone || undefined,
        address: address?.trim() || undefined,
        notes: notes?.trim() || undefined,
      });
    }
  }
  
  return { valid, errors: errors.slice(0, MAX_ERROR_SAMPLES), skipped };
}

/**
 * Validate vehicle rows from mapped CSV data
 */
export function validateVehicleRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ValidationResult<VehicleRow> {
  const valid: VehicleRow[] = [];
  const errors: ValidationError[] = [];
  let skipped = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i];
    const rowErrors: ValidationError[] = [];
    
    const brand = getVal(row, mapping, "brand");
    const model = getVal(row, mapping, "model");
    const plate = getVal(row, mapping, "plate");
    const vin = getVal(row, mapping, "vin");
    const fuel = getVal(row, mapping, "fuel");
    const yearStr = getVal(row, mapping, "year");
    const clientEmail = getVal(row, mapping, "clientEmail");
    const clientId = getVal(row, mapping, "clientId");
    
    // Required fields
    if (!brand) {
      rowErrors.push({ row: rowNum, field: "brand", message: "Marque obligatoire" });
    }
    
    if (!model) {
      rowErrors.push({ row: rowNum, field: "model", message: "Modèle obligatoire" });
    }
    
    if (!plate) {
      rowErrors.push({ row: rowNum, field: "plate", message: "Immatriculation obligatoire" });
    }
    
    // Validate plate format
    if (plate) {
      const normalizedPlate = normalizePlate(plate);
      if (!isValidFrenchPlate(normalizedPlate)) {
        rowErrors.push({
          row: rowNum,
          field: "plate",
          message: "Format d'immatriculation invalide",
          value: truncate(plate),
        });
      }
    }
    
    // Validate VIN if provided (17 chars, alphanumeric except I, O, Q)
    if (vin && !isValidVIN(vin)) {
      rowErrors.push({
        row: rowNum,
        field: "vin",
        message: "Format VIN invalide (17 caractères)",
        value: truncate(vin),
      });
    }
    
    // Parse year
    let year: number | undefined;
    if (yearStr) {
      // Try to extract 4-digit year from various formats
      const yearMatch = yearStr.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[0], 10);
      } else {
        rowErrors.push({
          row: rowNum,
          field: "year",
          message: "Format année invalide",
          value: truncate(yearStr),
        });
      }
    }
    
    // Validate fuel type
    const normalizedFuel = fuel ? normalizeFuel(fuel) : undefined;
    
    if (rowErrors.length > 0) {
      if (!brand && !model && !plate) {
        skipped++;
      } else {
        errors.push(...rowErrors.slice(0, 3));
      }
    } else {
      valid.push({
        brand: brand!.trim(),
        model: model!.trim(),
        plate: normalizePlate(plate!),
        vin: vin?.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "") || undefined,
        fuel: normalizedFuel,
        year,
        clientEmail: clientEmail?.trim().toLowerCase() || undefined,
        clientId: clientId?.trim() || undefined,
      });
    }
  }
  
  return { valid, errors: errors.slice(0, MAX_ERROR_SAMPLES), skipped };
}

// ============================================
// HELPERS
// ============================================

function getVal(
  row: Record<string, string>,
  mapping: ColumnMapping,
  field: string
): string | undefined {
  const col = mapping[field];
  if (!col) return undefined;
  const val = row[col];
  return val && val.trim().length > 0 ? val : undefined;
}

function truncate(val: string, maxLen = 20): string {
  if (val.length <= maxLen) return val;
  return val.substring(0, maxLen) + "...";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function normalizePhone(phone: string): string {
  // Remove all non-digit chars except leading +
  const cleaned = phone.replace(/(?!^\+)[^\d]/g, "");
  // French mobile: convert 0033 to +33
  if (cleaned.startsWith("0033")) {
    return "+33" + cleaned.slice(4);
  }
  // Add +33 prefix if starts with 0 and is 10 digits
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "+33" + cleaned.slice(1);
  }
  return cleaned.startsWith("+") ? cleaned : "+" + cleaned;
}

function isValidPhone(normalizedPhone: string): boolean {
  // Should be +XX... format with 10-15 digits total
  if (!normalizedPhone.startsWith("+")) return false;
  const digits = normalizedPhone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

function isValidVIN(vin: string): boolean {
  // VIN: 17 chars, alphanumeric, no I, O, Q
  const cleaned = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  return cleaned.length === 17;
}

const FUEL_MAPPING: Record<string, string> = {
  essence: "ESSENCE",
  petrol: "ESSENCE",
  gasoline: "ESSENCE",
  sp95: "ESSENCE",
  sp98: "ESSENCE",
  diesel: "DIESEL",
  gazole: "DIESEL",
  gasoil: "DIESEL",
  electrique: "ELECTRIQUE",
  electric: "ELECTRIQUE",
  ev: "ELECTRIQUE",
  hybride: "HYBRIDE",
  hybrid: "HYBRIDE",
  gpl: "GPL",
  lpg: "GPL",
  gnv: "GNV",
  cng: "GNV",
  hydrogene: "HYDROGENE",
  hydrogen: "HYDROGENE",
};

function normalizeFuel(fuel: string): string | undefined {
  const normalized = fuel.toLowerCase().replace(/[^a-z0-9]/g, "");
  return FUEL_MAPPING[normalized] || fuel.toUpperCase();
}

// ============================================
// DEDUPLICATION LOGIC
// ============================================

export interface DeduplicationResult<T> {
  toCreate: T[];
  toUpdate: { existing: { id: string }; updates: Partial<T> }[];
  duplicates: { row: T; reason: string }[];
}

/**
 * Build client deduplication key: email OR (lastName + phone)
 */
export function clientDedupeKey(client: ClientRow): string | null {
  if (client.email) {
    return `email:${client.email.toLowerCase()}`;
  }
  if (client.lastName && client.phone) {
    return `name_phone:${client.lastName.toLowerCase()}:${client.phone}`;
  }
  return null;
}

/**
 * Build vehicle deduplication key: plate OR VIN
 */
export function vehicleDedupeKey(vehicle: VehicleRow): string | null {
  // Primary: plate (normalized)
  if (vehicle.plate) {
    return `plate:${vehicle.plate}`;
  }
  // Secondary: VIN
  if (vehicle.vin) {
    return `vin:${vehicle.vin}`;
  }
  return null;
}
