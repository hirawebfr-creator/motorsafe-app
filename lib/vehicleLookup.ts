/**
 * Vehicle Lookup Service (France)
 * Uses apiplaqueimmatriculation.com to fetch vehicle data by plate
 * 
 * Server-only - never import in client code
 */

import "server-only";

// ============================================
// Types
// ============================================

export interface VehiclePrefill {
  brand: string;
  model: string;
  variant?: string;
  vin?: string;
  fuel?: string;
  year?: number;
  engine?: string;
  powerFiscal?: number;
  powerKw?: number;
  ccm?: number;
  cylinders?: number;
  gearbox?: string;
  color?: string;
  weightKg?: number;
  co2?: number;
  firstRegistrationDate?: string;
  logoUrl?: string;
}

export interface LookupResult {
  success: true;
  data: VehiclePrefill;
}

export interface LookupError {
  success: false;
  error: {
    code: "PLATE_NOT_FOUND" | "API_ERROR" | "TOKEN_MISSING" | "INVALID_PLATE" | "TIMEOUT";
    message: string;
  };
}

export type LookupResponse = LookupResult | LookupError;

interface ApiPlaqueResponse {
  "api-version"?: string;
  message?: string;
  code_erreur?: number;
  data?: {
    erreur?: string;
    marque?: string;
    modele?: string;
    variante?: string;
    version?: string;
    vin?: string;
    energieNGC?: string;
    date1erCir_us?: string;
    puisFiscReelCH?: string;  // "131 CH"
    puisFiscReelKW?: string;  // "96 KW"
    ccm?: string;             // "1870 CM3"
    cylindres?: string;       // "4"
    code_moteur?: string;
    boite_vitesse?: string;
    couleur?: string;
    poids?: string;           // "1807 KG"
    co2?: string;
    logo_marque?: string;
    [key: string]: unknown;
  };
}

// ============================================
// Helpers
// ============================================

/**
 * Normalize French plate: remove spaces/dashes, uppercase
 * Supports both old (1234 AB 75) and new (AB-123-CD) formats
 */
export function normalizePlate(plate: string): string {
  return plate
    .toUpperCase()
    .replace(/[\s\-\.]/g, "")
    .trim();
}

/**
 * Basic validation for French plates
 */
export function isValidFrenchPlate(plateNormalized: string): boolean {
  // New format: AA123BB (7 chars) - 2 letters, 3 digits, 2 letters
  const newFormat = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
  // Old format: 1234AB75 (6-10 chars) - digits, letters, digits (département)
  const oldFormat = /^\d{1,4}[A-Z]{1,3}\d{2,3}$/;
  
  return newFormat.test(plateNormalized) || oldFormat.test(plateNormalized);
}

/**
 * Map API response to internal VehiclePrefill format
 */
export function mapApiResponseToInternal(data: ApiPlaqueResponse["data"]): VehiclePrefill {
  if (!data) return { brand: "", model: "" };

  // Parse year from date1erCir_us (format: YYYY-MM-DD)
  let year: number | undefined;
  if (data.date1erCir_us) {
    const parsed = parseInt(data.date1erCir_us.substring(0, 4), 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
      year = parsed;
    }
  }

  // Parse numeric values from strings like "1870 CM3", "131 CH", "96 KW"
  const parseNumeric = (val: string | undefined): number | undefined => {
    if (!val) return undefined;
    const match = val.match(/^[\d.]+/);
    return match ? parseFloat(match[0]) : undefined;
  };

  // Build engine string from version or code_moteur + ccm
  let engine: string | undefined;
  if (data.version) {
    engine = data.version;
  } else if (data.code_moteur) {
    engine = data.code_moteur;
    if (data.ccm) {
      engine += ` (${data.ccm})`;
    }
  } else if (data.ccm) {
    engine = data.ccm;
  }

  return {
    brand: data.marque || "",
    model: data.modele || "",
    variant: data.variante || undefined,
    vin: data.vin || undefined,
    fuel: data.energieNGC || undefined,
    year,
    engine,
    powerFiscal: parseNumeric(data.puisFiscReelCH),
    powerKw: parseNumeric(data.puisFiscReelKW),
    ccm: parseNumeric(data.ccm),
    cylinders: parseNumeric(data.cylindres),
    gearbox: data.boite_vitesse || undefined,
    color: data.couleur || undefined,
    weightKg: parseNumeric(data.poids),
    co2: parseNumeric(data.co2),
    firstRegistrationDate: data.date1erCir_us || undefined,
    logoUrl: data.logo_marque || undefined,
  };
}

// ============================================
// Main Lookup Function
// ============================================

const LOOKUP_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Lookup vehicle by French plate via apiplaqueimmatriculation.com
 * Server-only function
 */
export async function lookupPlateFR(plateNormalized: string): Promise<LookupResponse> {
  const token = process.env.APIPLAQUE_TOKEN;
  
  if (!token) {
    console.error("[VehicleLookup] APIPLAQUE_TOKEN is not configured");
    return {
      success: false,
      error: {
        code: "TOKEN_MISSING",
        message: "Configuration API manquante. Contactez l'administrateur.",
      },
    };
  }

  if (!isValidFrenchPlate(plateNormalized)) {
    return {
      success: false,
      error: {
        code: "INVALID_PLATE",
        message: "Format de plaque invalide.",
      },
    };
  }

  // Format plate for API (with dashes for new format)
  let formattedPlate = plateNormalized;
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(plateNormalized)) {
    // New format: AA123BB -> AA-123-BB
    formattedPlate = `${plateNormalized.slice(0, 2)}-${plateNormalized.slice(2, 5)}-${plateNormalized.slice(5)}`;
  }

  const url = new URL("https://api.apiplaqueimmatriculation.com/plaque");
  url.searchParams.set("immatriculation", formattedPlate);
  url.searchParams.set("token", token);
  url.searchParams.set("pays", "FR");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[VehicleLookup] API returned ${response.status}`);
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `Erreur API (${response.status}). Réessayez plus tard.`,
        },
      };
    }

    const json: ApiPlaqueResponse = await response.json();

    // Check for API-level errors (erreur field is empty string if OK)
    if (json.data?.erreur && json.data.erreur !== "") {
      console.warn(`[VehicleLookup] API error for plate ${plateNormalized}: ${json.data.erreur}`);
      return {
        success: false,
        error: {
          code: "PLATE_NOT_FOUND",
          message: "Plaque introuvable ou données non disponibles.",
        },
      };
    }

    if (!json.data || !json.data.marque) {
      return {
        success: false,
        error: {
          code: "PLATE_NOT_FOUND",
          message: "Aucune donnée trouvée pour cette plaque.",
        },
      };
    }

    const prefill = mapApiResponseToInternal(json.data);
    return { success: true, data: prefill };
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[VehicleLookup] Request timeout");
      return {
        success: false,
        error: {
          code: "TIMEOUT",
          message: "Délai d'attente dépassé. Réessayez.",
        },
      };
    }

    console.error("[VehicleLookup] Fetch error:", err);
    return {
      success: false,
      error: {
        code: "API_ERROR",
        message: "Erreur de connexion à l'API. Réessayez.",
      },
    };
  }
}
