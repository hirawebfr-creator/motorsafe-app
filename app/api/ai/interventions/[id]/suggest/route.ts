/**
 * AI Suggest Endpoint for Intervention Assistance
 * 
 * POST /api/ai/interventions/[id]/suggest
 * 
 * Security:
 * - Auth required
 * - Garage scope enforced (no cross-tenant)
 * - Feature gate: AI_ASSIST
 * - Monthly quota enforced
 * - All PII redacted before LLM call
 * - Prompts NOT logged
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { success } from "@/lib/api";
import { RouteError, toErrorResponse, unauthorized, forbidden, notFound, badRequest } from "@/lib/routeErrors";
import { requireFeature, FeatureKey, requireQuota, checkQuota } from "@/lib/entitlements";
import { generateCompletion, getAIStatus, AIMode } from "@/lib/ai/provider";
import { createSafeContext, maskPlate } from "@/lib/ai/redact";

// ============================================
// Types
// ============================================

interface RequestBody {
  mode: AIMode;
}

const VALID_MODES: AIMode[] = ["CHECKLIST", "SUMMARY", "RISKS"];

// ============================================
// Quota Management
// ============================================

/**
 * Log AI usage for quota tracking
 */
async function logAiUsage(params: {
  garageId: number;
  interventionId: string;
  mode: AIMode;
  provider: string | null;
  tokensUsed: number;
  success: boolean;
}): Promise<void> {
  await prisma.aiUsageLog.create({
    data: {
      garageId: params.garageId,
      interventionId: params.interventionId,
      mode: params.mode,
      provider: params.provider ?? "unknown",
      tokensUsed: params.tokensUsed,
      success: params.success,
    },
  });
}

// ============================================
// Main Handler
// ============================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: interventionId } = await params;
    
    // 1. Auth check
    const user = await getSessionUser(req);
    if (!user) {
      throw unauthorized();
    }
    
    if (!isApprovedGarage(user)) {
      throw forbidden("Garage non approuvé");
    }
    
    const garageId = user.garageId;
    if (!garageId && user.role !== "ADMIN") {
      throw forbidden("Garage non associé");
    }
    
    // 2. Parse request body
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw badRequest("INVALID_BODY", "Corps de requête invalide");
    }
    
    const { mode } = body as RequestBody;
    if (!mode || !VALID_MODES.includes(mode)) {
      throw badRequest("INVALID_MODE", `Mode invalide. Valeurs acceptées: ${VALID_MODES.join(", ")}`);
    }
    
    // 3. Check AI is enabled
    const aiStatus = getAIStatus();
    if (!aiStatus.enabled) {
      throw new RouteError(503, "AI_DISABLED", "L'assistance IA n'est pas configurée sur ce serveur");
    }
    
    // 4. Fetch intervention with garage scope filter (SECURITY: prevents loading data before auth)
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId: garageId ?? -1, deletedAt: null },
      select: {
        id: true,
        garageId: true,
        type: true,
        tags: true,
        intakeNotes: true,
        workNotes: true,
        partsNotes: true,
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            year: true,
          },
        },
      },
    });
    
    if (!intervention) {
      throw notFound("Intervention introuvable");
    }
    
    const effectiveGarageId = intervention.garageId!;
    
    // 5. Feature gate: AI_ASSIST
    if (user.role !== "ADMIN") {
      await requireFeature(effectiveGarageId, FeatureKey.AI_ASSIST);
    }
    
    // 7. Check quota using centralized function
    await requireQuota(effectiveGarageId, "aiRequestsPerMonth");
    
    // 8. Build safe context (redact all PII)
    const { safeContext, redactionReport } = createSafeContext({
      type: intervention.type,
      tags: intervention.tags,
      symptoms: intervention.intakeNotes,
      workNotes: intervention.workNotes,
      partsNotes: intervention.partsNotes,
      vehicleBrand: intervention.vehicle?.brand,
      vehicleModel: intervention.vehicle?.model,
      vehicleYear: intervention.vehicle?.year,
    });
    
    // Log redaction summary (not the actual data)
    if (redactionReport.length > 0) {
      console.log(`[AI] Redacted data for intervention ${maskPlate(intervention.vehicle?.plate)}: ${JSON.stringify(redactionReport)}`);
    }
    
    // 9. Generate AI completion
    const result = await generateCompletion({
      mode,
      context: safeContext,
      language: "fr",
    });
    
    // 10. Log usage for quota tracking
    await logAiUsage({
      garageId: effectiveGarageId,
      interventionId: intervention.id,
      mode,
      provider: result.provider ?? null,
      tokensUsed: result.tokensUsed ?? 0,
      success: result.success,
    });
    
    // 11. Return result
    if (!result.success) {
      throw new RouteError(502, "AI_ERROR", result.error ?? "Erreur IA");
    }
    
    // Get updated quota info after logging usage
    const quotaInfo = await checkQuota(effectiveGarageId, "aiRequestsPerMonth");
    
    return NextResponse.json(
      success({
        mode,
        content: result.content,
        disclaimer: result.disclaimer,
        quotaRemaining: quotaInfo.remaining,
        quotaLimit: quotaInfo.limit,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
