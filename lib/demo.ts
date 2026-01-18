/**
 * DEMO-SCENARIO-01: Demo Mode Guards and Utilities
 * 
 * Provides guards and utilities for demo mode:
 * - isDemoGarage(garage): Check if garage is a demo garage
 * - requireDemoGarage(garage): Throw if not a demo garage
 * - isDemoModeEnabled(user): Check if user has demo mode enabled
 * - enableDemoMode(userId): Enable demo mode for a user
 * - disableDemoMode(userId): Disable demo mode for a user
 */

import { prisma } from "@/lib/prisma";
import { RouteError } from "@/lib/routeErrors";
import type { SessionUser } from "@/lib/auth";

// ============================================
// DEMO STEPS CONFIGURATION
// ============================================

export interface DemoStep {
  id: number;
  title: string;
  path: string;
  script: string;
  cta?: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: "Dashboard",
    path: "/dashboard",
    script: `"On voit l'atelier en un coup d'œil : interventions en cours, 
véhicules récents, alertes. Le gérant sait où il en est à chaque instant."`,
    cta: "Montrer les KPIs et la liste des interventions récentes",
  },
  {
    id: 2,
    title: "Créer une intervention",
    path: "/interventions",
    script: `"En 30 secondes, je crée une fiche intervention : client, véhicule, 
type de travaux. Tout est tracé dès le départ."`,
    cta: "Cliquer sur 'Nouvelle intervention' et montrer le formulaire",
  },
  {
    id: 3,
    title: "Ordre de réparation",
    path: "/interventions",
    script: `"Ici on génère l'OR automatiquement avec toutes les clauses légales. 
Le client signe sur son téléphone — fini le papier perdu."`,
    cta: "Ouvrir une intervention et montrer le bouton 'Générer OR'",
  },
  {
    id: 4,
    title: "Signature mobile",
    path: "/interventions",
    script: `"Le client scanne le QR code avec son téléphone. 
Il signe avec son doigt, c'est horodaté et géolocalisé. 
Impossible de contester après."`,
    cta: "Montrer le QR code et simuler une signature",
  },
  {
    id: 5,
    title: "Dossier incident",
    path: "/interventions",
    script: `"En cas de litige, on a tout : photos avant/après, 
chronologie, preuves horodatées. Le client voit qu'on a un dossier béton, 
il abandonne sa contestation."`,
    cta: "Montrer l'onglet 'Incident' avec les preuves",
  },
  {
    id: 6,
    title: "Export assurance",
    path: "/interventions",
    script: `"En un clic, on exporte un ZIP prêt pour l'assurance : 
tous les documents signés, hash SHA-256, audit trail. 
L'expert ou l'avocat a tout ce qu'il faut."`,
    cta: "Cliquer sur 'Export ZIP'",
  },
  {
    id: 7,
    title: "Tarifs & Essai",
    path: "/billing",
    script: `"49€/mois pour Starter, 129€ pour Pro avec multi-utilisateurs. 
14 jours d'essai gratuit, sans engagement, sans CB. 
On commence maintenant ?"`,
    cta: "Montrer les plans et proposer l'inscription",
  },
];

// ============================================
// TYPE GUARDS
// ============================================

interface GarageWithDemo {
  isDemo?: boolean;
  demoSeedVersion?: number;
}

/**
 * Check if a garage is a demo garage
 */
export function isDemoGarage(garage: GarageWithDemo | null | undefined): boolean {
  return garage?.isDemo === true;
}

/**
 * Throw if the garage is not a demo garage
 */
export function requireDemoGarage(garage: GarageWithDemo | null | undefined): void {
  if (!isDemoGarage(garage)) {
    throw new RouteError(
      403,
      "DEMO_ONLY",
      "Cette action est réservée au garage de démonstration."
    );
  }
}

/**
 * Check if a user has demo mode enabled
 */
export function isDemoModeEnabled(user: { demoModeEnabledAt?: Date | null } | null): boolean {
  return user?.demoModeEnabledAt != null;
}

// ============================================
// DEMO MODE ACTIONS
// ============================================

/**
 * Enable demo mode for a user
 */
export async function enableDemoMode(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { demoModeEnabledAt: new Date() },
  });
}

/**
 * Disable demo mode for a user
 */
export async function disableDemoMode(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { demoModeEnabledAt: null },
  });
}

/**
 * Get or create demo state for a garage
 */
export async function getDemoState(garageId: number): Promise<{
  currentStep: number;
  completedAt: Date | null;
}> {
  const state = await prisma.demoState.findUnique({
    where: { garageId },
  });

  if (!state) {
    return { currentStep: 0, completedAt: null };
  }

  return {
    currentStep: state.currentStep,
    completedAt: state.completedAt,
  };
}

/**
 * Update demo step for a garage
 */
export async function updateDemoStep(garageId: number, step: number): Promise<void> {
  const completedAt = step >= DEMO_STEPS.length ? new Date() : null;

  await prisma.demoState.upsert({
    where: { garageId },
    update: {
      currentStep: step,
      completedAt,
    },
    create: {
      garageId,
      currentStep: step,
      completedAt,
    },
  });
}

/**
 * Reset demo state for a garage
 */
export async function resetDemoState(garageId: number): Promise<void> {
  await prisma.demoState.upsert({
    where: { garageId },
    update: {
      currentStep: 0,
      completedAt: null,
    },
    create: {
      garageId,
      currentStep: 0,
      completedAt: null,
    },
  });
}

// ============================================
// DEMO GARAGE LOOKUP
// ============================================

/**
 * Get the demo garage (there should be only one)
 */
export async function getDemoGarage(): Promise<{
  id: number;
  name: string;
  slug: string | null;
  isDemo: boolean;
  demoSeedVersion: number;
} | null> {
  return prisma.garage.findFirst({
    where: { isDemo: true },
    select: {
      id: true,
      name: true,
      slug: true,
      isDemo: true,
      demoSeedVersion: true,
    },
  });
}

/**
 * Check if user can access demo mode (must be ADMIN or OWNER of demo garage)
 */
export function canAccessDemoMode(
  user: SessionUser | null,
  garage: GarageWithDemo | null
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "OWNER" && isDemoGarage(garage)) return true;
  return false;
}

/**
 * Require user to have demo access
 */
export function requireDemoAccess(
  user: SessionUser | null,
  garage: GarageWithDemo | null
): void {
  if (!canAccessDemoMode(user, garage)) {
    throw new RouteError(
      403,
      "DEMO_ACCESS_DENIED",
      "Vous n'avez pas accès au mode démo."
    );
  }
}
