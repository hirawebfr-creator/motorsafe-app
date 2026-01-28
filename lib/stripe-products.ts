/**
 * Stripe Products & Pricing Configuration
 * 
 * Central configuration for all Stripe product IDs and pricing.
 * All product IDs are from the Stripe dashboard.
 */

// ============================================================================
// Types
// ============================================================================

export type PlanType = "PRO" | "EXPERT" | "PREMIUM";
export type BillingPeriod = "monthly" | "yearly";
export type PackType = "SIV" | "STORAGE";

export interface PlanConfig {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyProductId: string;
  yearlyProductId: string;
  features: string[];
  quotas: {
    sivPerMonth: number;
    storageGB: number;
    aiRequests: number;
    users: number;
    vehicleLookup: number;
  };
  popular?: boolean;
}

export interface PackConfig {
  id: string;
  name: string;
  productId: string;
  type: PackType;
  amount: number; // Credits or GB
  price: number;
  pricePerUnit: number;
  popular?: boolean;
}

// ============================================================================
// Subscription Plans
// ============================================================================

export const SUBSCRIPTION_PLANS: Record<PlanType, PlanConfig> = {
  PRO: {
    name: "Pro",
    description: "Pour les garages en croissance",
    monthlyPrice: 49,
    yearlyPrice: 470, // ~2 mois offerts
    monthlyProductId: "prod_TruJJJCoAvIc82",
    yearlyProductId: "prod_TruKcqjstHymAY",
    features: [
      "50 recherches SIV/mois incluses",
      "5 Go de stockage",
      "Clients & véhicules illimités",
      "Devis & factures",
      "Signatures électroniques",
      "2 utilisateurs",
      "Support email",
    ],
    quotas: {
      sivPerMonth: 50,
      storageGB: 5,
      aiRequests: 100,
      users: 2,
      vehicleLookup: 50,
    },
  },
  EXPERT: {
    name: "Expert",
    description: "Pour les garages établis",
    monthlyPrice: 99,
    yearlyPrice: 950,
    monthlyProductId: "prod_TruJZ5LoZGjado",
    yearlyProductId: "prod_TruLsKpIQhYKHV",
    features: [
      "150 recherches SIV/mois incluses",
      "20 Go de stockage",
      "Tout du plan Pro",
      "IA Copilot SafeMotor",
      "Comparateur E85/Stage",
      "5 utilisateurs",
      "Export dossiers experts",
      "Support prioritaire",
    ],
    quotas: {
      sivPerMonth: 150,
      storageGB: 20,
      aiRequests: 500,
      users: 5,
      vehicleLookup: 150,
    },
    popular: true,
  },
  PREMIUM: {
    name: "Premium",
    description: "Pour les grands garages",
    monthlyPrice: 199,
    yearlyPrice: 1900,
    monthlyProductId: "prod_TruKKSD4Aw2KpV",
    yearlyProductId: "prod_TruLbdVE2jexQ6",
    features: [
      "500 recherches SIV/mois incluses",
      "100 Go de stockage",
      "Tout du plan Expert",
      "Utilisateurs illimités",
      "API accès",
      "Badge partenaire SafeMotor",
      "Branding personnalisé",
      "Account manager dédié",
    ],
    quotas: {
      sivPerMonth: 500,
      storageGB: 100,
      aiRequests: 2000,
      users: -1, // Unlimited
      vehicleLookup: 500,
    },
  },
};

// ============================================================================
// SIV Credit Packs
// ============================================================================

export const SIV_PACKS: PackConfig[] = [
  {
    id: "siv_50",
    name: "Pack 50 SIV",
    productId: "prod_TruMRkG1Cc5A9E",
    type: "SIV",
    amount: 50,
    price: 25,
    pricePerUnit: 0.50,
  },
  {
    id: "siv_100",
    name: "Pack 100 SIV",
    productId: "prod_TruNg7A9RaQNCR",
    type: "SIV",
    amount: 100,
    price: 40,
    pricePerUnit: 0.40,
    popular: true,
  },
  {
    id: "siv_500",
    name: "Pack 500 SIV",
    productId: "prod_TruO0EXBXmcKBu",
    type: "SIV",
    amount: 500,
    price: 150,
    pricePerUnit: 0.30,
  },
];

// ============================================================================
// Storage Packs
// ============================================================================

export const STORAGE_PACKS: PackConfig[] = [
  {
    id: "storage_10",
    name: "10 Go supplémentaires",
    productId: "prod_TruO9eOyCWc0ff",
    type: "STORAGE",
    amount: 10,
    price: 5,
    pricePerUnit: 0.50,
  },
  {
    id: "storage_50",
    name: "50 Go supplémentaires",
    productId: "prod_TruOOFi9GOsLiH",
    type: "STORAGE",
    amount: 50,
    price: 20,
    pricePerUnit: 0.40,
    popular: true,
  },
  {
    id: "storage_200",
    name: "200 Go supplémentaires",
    productId: "prod_TruPfHQpzacWdH",
    type: "STORAGE",
    amount: 200,
    price: 60,
    pricePerUnit: 0.30,
  },
];

// ============================================================================
// Helpers
// ============================================================================

export function getPlanByProductId(productId: string): { plan: PlanType; period: BillingPeriod } | null {
  for (const [planKey, config] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (config.monthlyProductId === productId) {
      return { plan: planKey as PlanType, period: "monthly" };
    }
    if (config.yearlyProductId === productId) {
      return { plan: planKey as PlanType, period: "yearly" };
    }
  }
  return null;
}

export function getPackByProductId(productId: string): PackConfig | null {
  const sivPack = SIV_PACKS.find(p => p.productId === productId);
  if (sivPack) return sivPack;
  
  const storagePack = STORAGE_PACKS.find(p => p.productId === productId);
  if (storagePack) return storagePack;
  
  return null;
}

export function getAllProductIds(): string[] {
  const planIds = Object.values(SUBSCRIPTION_PLANS).flatMap(p => [p.monthlyProductId, p.yearlyProductId]);
  const sivIds = SIV_PACKS.map(p => p.productId);
  const storageIds = STORAGE_PACKS.map(p => p.productId);
  return [...planIds, ...sivIds, ...storageIds];
}
