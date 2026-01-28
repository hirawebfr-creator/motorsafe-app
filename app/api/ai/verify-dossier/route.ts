/**
 * AI Dossier Verification API
 * 
 * Vérifie la complétude d'un dossier d'intervention avant signature.
 * Alerte sur les risques potentiels et les éléments manquants.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerificationIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  action?: string;
}

/**
 * POST /api/ai/verify-dossier
 * Vérifie la complétude d'un dossier d'intervention
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.garageId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { interventionId } = body as { interventionId: string };

    if (!interventionId) {
      return NextResponse.json({ error: "ID intervention requis" }, { status: 400 });
    }

    // Get intervention with all related data
    const intervention = await prisma.intervention.findFirst({
      where: {
        id: interventionId,
        garageId: user.garageId,
      },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
        documents: true,
      },
    });

    if (!intervention) {
      return NextResponse.json({ error: "Intervention non trouvée" }, { status: 404 });
    }

    // Get signature requests
    const signatures = await prisma.signatureRequest.findMany({
      where: {
        garageId: user.garageId,
        documentId: interventionId,
      },
    });

    // Get evidence items
    const evidenceItems = await prisma.evidenceItem.findMany({
      where: {
        interventionId,
        garageId: user.garageId,
      },
    });

    // Perform verification
    const issues: VerificationIssue[] = [];
    let score = 100;

    // ===== 1. Client Info Verification =====
    const client = intervention.vehicle.client;
    
    if (!client.email && !client.phone) {
      issues.push({
        severity: "error",
        category: "Client",
        message: "Aucun moyen de contact (email ou téléphone)",
        action: "Ajoutez un email ou téléphone au client",
      });
      score -= 15;
    }

    if (!client.address) {
      issues.push({
        severity: "warning",
        category: "Client",
        message: "Adresse client non renseignée",
        action: "Complétez l'adresse pour les documents légaux",
      });
      score -= 5;
    }

    // ===== 2. Vehicle Info Verification =====
    const vehicle = intervention.vehicle;

    if (!vehicle.vin) {
      issues.push({
        severity: "warning",
        category: "Véhicule",
        message: "Numéro VIN non renseigné",
        action: "Ajoutez le VIN pour la traçabilité complète",
      });
      score -= 5;
    }

    if (!vehicle.fuel) {
      issues.push({
        severity: "info",
        category: "Véhicule",
        message: "Type de carburant non renseigné",
        action: "Précisez le carburant pour les recommandations E85",
      });
      score -= 2;
    }

    // ===== 3. Intervention Details =====
    if (!intervention.type || intervention.type === "Autre") {
      issues.push({
        severity: "warning",
        category: "Intervention",
        message: "Type d'intervention non précisé",
        action: "Sélectionnez un type d'intervention précis",
      });
      score -= 5;
    }

    if (!intervention.notes && !intervention.workNotes) {
      issues.push({
        severity: "warning",
        category: "Intervention",
        message: "Aucune note ou description des travaux",
        action: "Décrivez les travaux effectués pour la traçabilité",
      });
      score -= 10;
    }

    if (!intervention.odometerKm) {
      issues.push({
        severity: "warning",
        category: "Intervention",
        message: "Kilométrage non renseigné",
        action: "Notez le kilométrage pour l'historique véhicule",
      });
      score -= 5;
    }

    // ===== 4. Evidence & Photos =====
    const intakePhotos = evidenceItems.filter((e) => e.category?.startsWith("INTAKE"));
    const deliveryPhotos = evidenceItems.filter((e) => e.category?.startsWith("DELIVERY"));

    if (intakePhotos.length < 4) {
      issues.push({
        severity: "warning",
        category: "Preuves",
        message: `Seulement ${intakePhotos.length} photos d'entrée (minimum recommandé: 4)`,
        action: "Ajoutez des photos avant intervention (4 angles + tableau de bord)",
      });
      score -= 10;
    }

    if (intervention.status === "DONE" && deliveryPhotos.length < 2) {
      issues.push({
        severity: "warning",
        category: "Preuves",
        message: "Photos de sortie manquantes pour intervention terminée",
        action: "Ajoutez des photos après intervention",
      });
      score -= 10;
    }

    // ===== 5. Signatures =====
    const intakeSignature = signatures.find((s) => s.documentType === "INTERVENTION_ORDER");
    const deliverySignature = signatures.find((s) => s.documentType === "INTERVENTION_DELIVERY");

    if (!intakeSignature || intakeSignature.status !== "SIGNED") {
      issues.push({
        severity: "error",
        category: "Signatures",
        message: "Signature d'entrée client non obtenue",
        action: "Faites signer l'ordre de réparation par le client",
      });
      score -= 20;
    }

    if (intervention.status === "DONE" && (!deliverySignature || deliverySignature.status !== "SIGNED")) {
      issues.push({
        severity: "error",
        category: "Signatures",
        message: "Signature de sortie client non obtenue",
        action: "Faites signer le PV de restitution avant départ du véhicule",
      });
      score -= 20;
    }

    // ===== 6. Checklists =====
    if (!intervention.intakeChecklist) {
      issues.push({
        severity: "warning",
        category: "Checklist",
        message: "Checklist d'entrée non complétée",
        action: "Complétez l'état des voyants et niveaux à l'entrée",
      });
      score -= 5;
    }

    if (intervention.status === "DONE" && !intervention.outtakeChecklist) {
      issues.push({
        severity: "warning",
        category: "Checklist",
        message: "Checklist de sortie non complétée",
        action: "Complétez les tests de sortie (freins, direction, éclairage)",
      });
      score -= 5;
    }

    // ===== 7. Legal Risks =====
    const isHighRisk = intervention.type?.toLowerCase().includes("reprog") ||
                       intervention.type?.toLowerCase().includes("stage") ||
                       intervention.type?.toLowerCase().includes("e85");

    if (isHighRisk) {
      if (!intakeSignature || intakeSignature.status !== "SIGNED") {
        issues.push({
          severity: "error",
          category: "Risque légal",
          message: "Intervention à risque sans signature préalable",
          action: "OBLIGATOIRE: Obtenez la signature AVANT toute modification",
        });
        score -= 15;
      }

      const hasDisclaimers = intervention.notes?.toLowerCase().includes("garantie") ||
                            intervention.workNotes?.toLowerCase().includes("garantie");
      if (!hasDisclaimers) {
        issues.push({
          severity: "warning",
          category: "Risque légal",
          message: "Mentions sur la garantie constructeur non visibles",
          action: "Mentionnez l'impact sur la garantie dans les notes",
        });
        score -= 5;
      }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine overall status
    const hasErrors = issues.some((i) => i.severity === "error");
    const hasWarnings = issues.some((i) => i.severity === "warning");
    
    let status: "complete" | "incomplete" | "at_risk";
    let summary: string;

    if (hasErrors) {
      status = "at_risk";
      summary = "⚠️ Dossier incomplet - éléments critiques manquants";
    } else if (hasWarnings) {
      status = "incomplete";
      summary = "📋 Dossier partiellement complet - améliorations recommandées";
    } else {
      status = "complete";
      summary = "✅ Dossier complet et prêt pour archivage";
    }

    return NextResponse.json({
      ok: true,
      status,
      score,
      summary,
      issues,
      stats: {
        photosEntree: intakePhotos.length,
        photosSortie: deliveryPhotos.length,
        signaturesOk: signatures.filter((s) => s.status === "SIGNED").length,
        documentsJoints: intervention.documents.length,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/ai/verify-dossier error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
