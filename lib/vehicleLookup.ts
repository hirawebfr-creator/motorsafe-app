/**
 * Vehicle Lookup Service (France)
 * Uses apiplaqueimmatriculation.com to fetch vehicle data by plate
 * 
 * Server-only - never import in client code
 */

import "server-only";
import { trackError } from "@/lib/observability";

// ============================================
// Types
// ============================================

export interface VehiclePrefill {
  // Identification
  brand: string;
  model: string;
  variant?: string;
  version?: string;
  vin?: string;
  typeMine?: string;
  cnit?: string;
  serialNumber?: string;
  genre?: string;
  genreCode?: string;
  finition?: string;

  // Dates
  firstRegistrationDate?: string;
  firstRegistrationDateFr?: string;
  year?: number;

  // Motorisation
  fuel?: string;
  fuelRaw?: string;
  engine?: string;
  engineCode?: string;
  ccm?: number;
  cylinders?: number;
  powerFiscal?: number;
  powerCh?: number;
  powerKw?: number;
  gearbox?: string;
  gearboxCode?: string;
  transmission?: string;
  nbRapports?: string;
  couple?: string;
  acceleration?: string;
  vitesseMax?: string;

  // Carrosserie
  bodyType?: string;
  color?: string;
  doors?: number;
  seats?: number;

  // Poids & Dimensions
  weightKg?: number;
  ptacKg?: number;
  ptraKg?: number;
  chargeUtile?: number;
  empattement?: string;
  longueur?: string;
  largeur?: string;
  hauteur?: string;
  coffre?: string;
  reservoir?: string;

  // Environnement
  co2?: number;
  normeEuro?: string;
  critair?: string;
  consommationMixte?: string;
  consommationUrbaine?: string;
  consommationExtraUrbaine?: string;

  // Provenance & Historique
  provenance?: string;
  isImported?: boolean;
  paysOrigine?: string;
  premierMain?: boolean;

  // Contrôle Technique
  dateDerniereCT?: string;
  resultatCT?: string;
  kmCT?: string;

  // Valeur
  prixNeuf?: string;
  coteArgus?: string;

  // Assurance (SRA)
  sraId?: string;
  sraGroup?: string;
  sraCommercial?: string;

  // Technique avancée
  kType?: string;
  platformCode?: string;

  // TecDoc
  tecdocManuid?: string;
  tecdocModelid?: string;
  tecdocCarid?: string;

  // Equipements
  equipements?: string;
  options?: string;
  garantieConstructeur?: string;

  // Collection
  isCollector?: boolean;
  date30?: string;

  // Medias
  logoUrl?: string;
  photoUrl?: string;
}

export interface LookupResult {
  success: true;
  data: VehiclePrefill;
}

export interface LookupError {
  success: false;
  error: {
    code: "PLATE_NOT_FOUND" | "API_ERROR" | "TOKEN_MISSING" | "INVALID_PLATE" | "TIMEOUT" | "PROVIDER_NO_CREDITS";
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
    // Identification
    immat?: string;
    pays?: string;
    marque?: string;
    modele?: string;
    variante?: string;
    version?: string;
    vin?: string;
    type_mine?: string;
    cnit?: string;
    numero_serie?: string;
    genreVCG?: string;
    genreVCGNGC?: string;
    finition?: string;
    // Dates
    date1erCir_us?: string;
    date1erCir_fr?: string;
    date30?: string;
    collection?: string;
    // Motorisation
    energie?: string;
    energieNGC?: string;
    code_moteur?: string;
    ccm?: string;
    cylindres?: string;
    nb_cylindres?: string;
    puisFisc?: string;
    puisFiscReelCH?: string;
    puisFiscReelKW?: string;
    boite_vitesse?: string;
    code_boite_vitesse?: string;
    transmission?: string;
    nb_rapports?: string;
    couple?: string;
    acceleration?: string;
    vitesse_max?: string;
    // Carrosserie
    carrosserie?: string;
    carrosserieCG?: string;
    couleur?: string;
    nb_portes?: string;
    nr_passagers?: string;
    // Poids & Dimensions
    poids?: string;
    ptac?: string;
    ptra?: string;
    charge_utile?: string;
    empattement?: string;
    longueur?: string;
    largeur?: string;
    hauteur?: string;
    coffre?: string;
    reservoir?: string;
    // Environnement
    co2?: string;
    norme_euro?: string;
    critair?: string;
    consommation_mixte?: string;
    consommation_urbaine?: string;
    consommation_extra_urbaine?: string;
    // Provenance & Historique
    provenance?: string;
    import?: string;
    pays_origine?: string;
    premiere_main?: string;
    // Contrôle Technique
    date_derniere_ct?: string;
    resultat_ct?: string;
    km_ct?: string;
    // Valeur
    prix_neuf?: string;
    cote_argus?: string;
    // Assurance
    sra_id?: string;
    sra_group?: string;
    sra_commercial?: string;
    // Technique avancée
    k_type?: string;
    codes_platforme?: string;
    // TecDoc
    tecdoc_manuid?: string;
    tecdoc_modelid?: string;
    tecdoc_carid?: string;
    // Equipements
    equipements?: string;
    options?: string;
    garantie_constructeur?: string;
    // Medias
    logo_marque?: string;
    photo_modele?: string;
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

  // Parse gearbox to human readable
  const gearboxMap: Record<string, string> = {
    A: "Automatique",
    M: "Manuelle",
    S: "Séquentielle",
    V: "CVT",
    X: "Robotisée",
  };

  return {
    // Identification
    brand: data.marque || "",
    model: data.modele || "",
    variant: data.variante || undefined,
    version: data.version || data.sra_commercial || undefined,
    vin: data.vin || undefined,
    typeMine: data.type_mine || undefined,
    cnit: data.cnit || undefined,
    serialNumber: data.numero_serie || undefined,
    genre: data.genreVCGNGC || undefined,
    genreCode: data.genreVCG || undefined,
    finition: data.finition || undefined,

    // Dates
    firstRegistrationDate: data.date1erCir_us || undefined,
    firstRegistrationDateFr: data.date1erCir_fr || undefined,
    year,

    // Motorisation
    fuel: data.energieNGC || data.energie || undefined,
    fuelRaw: data.energieNGC || data.energie || undefined,
    engine,
    engineCode: data.code_moteur || undefined,
    ccm: parseNumeric(data.ccm),
    cylinders: parseNumeric(data.cylindres) || parseNumeric(data.nb_cylindres),
    powerFiscal: parseNumeric(data.puisFisc),
    powerCh: parseNumeric(data.puisFiscReelCH),
    powerKw: parseNumeric(data.puisFiscReelKW),
    gearbox: data.boite_vitesse ? (gearboxMap[data.boite_vitesse] || data.boite_vitesse) : undefined,
    gearboxCode: data.code_boite_vitesse || undefined,
    transmission: data.transmission || undefined,
    nbRapports: data.nb_rapports || undefined,
    couple: data.couple || undefined,
    acceleration: data.acceleration || undefined,
    vitesseMax: data.vitesse_max || undefined,

    // Carrosserie
    bodyType: data.carrosserie || data.carrosserieCG || undefined,
    color: data.couleur || undefined,
    doors: parseNumeric(data.nb_portes),
    seats: parseNumeric(data.nr_passagers),

    // Poids & Dimensions
    weightKg: parseNumeric(data.poids),
    ptacKg: parseNumeric(data.ptac),
    ptraKg: parseNumeric(data.ptra),
    chargeUtile: parseNumeric(data.charge_utile),
    empattement: data.empattement || undefined,
    longueur: data.longueur || undefined,
    largeur: data.largeur || undefined,
    hauteur: data.hauteur || undefined,
    coffre: data.coffre || undefined,
    reservoir: data.reservoir || undefined,

    // Environnement
    co2: parseNumeric(data.co2),
    normeEuro: data.norme_euro || undefined,
    critair: data.critair || undefined,
    consommationMixte: data.consommation_mixte || undefined,
    consommationUrbaine: data.consommation_urbaine || undefined,
    consommationExtraUrbaine: data.consommation_extra_urbaine || undefined,

    // Provenance & Historique
    provenance: data.provenance || undefined,
    isImported: data.import === "oui" || data.import === "1" || (data.provenance?.toLowerCase().includes("import") ?? false),
    paysOrigine: data.pays_origine || undefined,
    premierMain: data.premiere_main === "oui" || data.premiere_main === "1",

    // Contrôle Technique
    dateDerniereCT: data.date_derniere_ct || undefined,
    resultatCT: data.resultat_ct || undefined,
    kmCT: data.km_ct || undefined,

    // Valeur
    prixNeuf: data.prix_neuf || undefined,
    coteArgus: data.cote_argus || undefined,

    // Assurance
    sraId: data.sra_id || undefined,
    sraGroup: data.sra_group || undefined,
    sraCommercial: data.sra_commercial || undefined,

    // Technique avancée
    kType: data.k_type || undefined,
    platformCode: data.codes_platforme || undefined,

    // TecDoc
    tecdocManuid: data.tecdoc_manuid || undefined,
    tecdocModelid: data.tecdoc_modelid || undefined,
    tecdocCarid: data.tecdoc_carid || undefined,

    // Equipements
    equipements: data.equipements || undefined,
    options: data.options || undefined,
    garantieConstructeur: data.garantie_constructeur || undefined,

    // Collection
    isCollector: data.collection === "oui",
    date30: data.date30 || undefined,

    // Medias
    logoUrl: data.logo_marque || undefined,
    photoUrl: data.photo_modele || undefined,
  };
}

// ============================================
// Main Lookup Function
// ============================================

const LOOKUP_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Check if mock mode is enabled for vehicle lookup
 */
function isLookupMockMode(): boolean {
  return process.env.VEHICLE_LOOKUP_PROVIDER === "mock" || process.env.NODE_ENV === "test";
}

/**
 * Generate mock vehicle data for testing
 */
function getMockVehicleData(plateNormalized: string): VehiclePrefill {
  return {
    brand: "Peugeot",
    model: "208",
    variant: "Active",
    version: "1.2 PureTech 100",
    vin: `VF3MOCK${plateNormalized.replace(/[^A-Z0-9]/g, "").slice(0, 10)}`,
    typeMine: "M10PEGVP",
    cnit: "M10PEGVP000T123",
    firstRegistrationDate: "2020-06-15",
    year: 2020,
    fuel: "Essence",
    engine: "1.2 PureTech",
    engineCode: "HN01",
    ccm: 1199,
    cylinders: 3,
    powerFiscal: 5,
    powerCh: 100,
    powerKw: 74,
    gearbox: "Manuelle 6",
    bodyType: "Berline 5 portes",
    color: "Blanc",
    doors: 5,
    seats: 5,
    weightKg: 1050,
    ptacKg: 1600,
    co2: 93,
    sraId: "PE208E0",
    sraGroup: "10",
    sraCommercial: "208 1.2 PURETECH 100",
  };
}

/**
 * Lookup vehicle by French plate via apiplaqueimmatriculation.com
 * Server-only function
 */
export async function lookupPlateFR(plateNormalized: string): Promise<LookupResponse> {
  // Mock mode for testing
  if (isLookupMockMode()) {
    console.log(`[VehicleLookup:Mock] Returning mock data for plate ${plateNormalized}`);
    
    if (!isValidFrenchPlate(plateNormalized)) {
      return {
        success: false,
        error: {
          code: "INVALID_PLATE",
          message: "Format de plaque invalide.",
        },
      };
    }
    
    return {
      success: true,
      data: getMockVehicleData(plateNormalized),
    };
  }

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
      const erreurLower = json.data.erreur.toLowerCase();
      console.warn(`[VehicleLookup] API error for plate ${plateNormalized}: ${json.data.erreur}`);
      
      // Check for credits/quota exhausted from provider
      if (erreurLower.includes("credit") || erreurLower.includes("quota") || erreurLower.includes("limit")) {
        return {
          success: false,
          error: {
            code: "PROVIDER_NO_CREDITS",
            message: "Crédits du fournisseur épuisés. Saisissez les informations manuellement.",
          },
        };
      }
      
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
    // Track lookup errors (no plate/PII logged)
    trackError(err instanceof Error ? err : new Error("VehicleLookup fetch error"), {
      area: 'lookup',
      severity: 'warning',
      operation: 'plate_lookup',
    });
    return {
      success: false,
      error: {
        code: "API_ERROR",
        message: "Erreur de connexion à l'API. Réessayez.",
      },
    };
  }
}

// ============================================
// Quota Management
// ============================================

// Default quota per garage per month (can be overridden per plan later)
const DEFAULT_MONTHLY_QUOTA = 200;

/**
 * Get current month key in YYYY-MM format
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get the monthly lookup quota for a garage
 * Can be extended later to vary by subscription plan
 */
export function getMonthlyQuota(_garageId: number): number {
  // TODO: Could vary by plan (FREE=50, PRO=200, ENTERPRISE=unlimited)
  return DEFAULT_MONTHLY_QUOTA;
}

export interface QuotaCheckResult {
  allowed: boolean;
  currentCount: number;
  monthlyLimit: number;
  remaining: number;
}
