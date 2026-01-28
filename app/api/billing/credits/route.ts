/**
 * API Route: Get Credits & Quotas
 * 
 * Returns the current credit usage and remaining credits for a garage.
 */

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { SUBSCRIPTION_PLANS, type PlanType } from "@/lib/stripe-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const garageId = user.garageId;
    if (!garageId) throw new RouteError(400, "TENANT_REQUIRED", "Garage invalide.");

    // Get garage with credits info
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: { 
        id: true,
        plan: true,
        extraSivCredits: true,
        extraStorageGB: true,
        storageUsedBytes: true,
        subscriptionStatus: true,
      },
    });
    
    if (!garage) throw new RouteError(404, "NOT_FOUND", "Garage introuvable");

    // Get current month SIV usage
    const monthKey = getCurrentMonthKey();
    const sivUsage = await prisma.vehicleLookupUsage.findUnique({
      where: { garageId_monthKey: { garageId, monthKey } },
      select: { count: true },
    });

    // Get plan quotas (map old plan names to new ones)
    const planMapping: Record<string, PlanType> = {
      "FREE": "PRO", // Trial = PRO features
      "STARTER": "PRO",
      "PRO": "EXPERT", // Old PRO = new EXPERT
    };
    
    const effectivePlan = planMapping[garage.plan] || "PRO";
    const planConfig = SUBSCRIPTION_PLANS[effectivePlan] || SUBSCRIPTION_PLANS.PRO;

    // Calculate SIV credits
    const sivIncludedInPlan = planConfig.quotas.sivPerMonth;
    const sivUsedThisMonth = sivUsage?.count || 0;
    const sivFromPlan = Math.max(0, sivIncludedInPlan - sivUsedThisMonth);
    const sivFromPacks = garage.extraSivCredits;
    const sivTotal = sivFromPlan + sivFromPacks;

    // Calculate storage
    const storageIncludedGB = planConfig.quotas.storageGB;
    const storageExtraGB = garage.extraStorageGB;
    const storageTotalGB = storageIncludedGB + storageExtraGB;
    const storageUsedGB = Number(garage.storageUsedBytes) / (1024 * 1024 * 1024);
    const storageRemainingGB = Math.max(0, storageTotalGB - storageUsedGB);

    return NextResponse.json({ 
      ok: true,
      plan: garage.plan,
      effectivePlan,
      subscriptionStatus: garage.subscriptionStatus,
      
      siv: {
        includedInPlan: sivIncludedInPlan,
        usedThisMonth: sivUsedThisMonth,
        remainingFromPlan: sivFromPlan,
        extraCredits: sivFromPacks,
        totalRemaining: sivTotal,
        monthKey,
      },
      
      storage: {
        includedGB: storageIncludedGB,
        extraGB: storageExtraGB,
        totalGB: storageTotalGB,
        usedGB: Math.round(storageUsedGB * 100) / 100,
        remainingGB: Math.round(storageRemainingGB * 100) / 100,
        usedPercent: storageTotalGB > 0 ? Math.round((storageUsedGB / storageTotalGB) * 100) : 0,
      },
      
      ai: {
        includedPerMonth: planConfig.quotas.aiRequests,
        // TODO: Track AI usage per month
        usedThisMonth: 0,
        remainingThisMonth: planConfig.quotas.aiRequests,
      },
      
      users: {
        limit: planConfig.quotas.users,
        unlimited: planConfig.quotas.users === -1,
      },
    });
  } catch (err) {
    console.error("Erreur API GET /api/billing/credits:", err);
    return toErrorResponse(err);
  }
}
