import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { getOrSet } from "@/lib/cache";
import { getEntitlementsForResponse } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache TTL: 30 seconds (billing status rarely changes)
const CACHE_TTL_MS = 30 * 1000;

type GarageBillingData = {
  plan: string;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  referralRewardMonths: number;
  pendingReferralMonthsApplied: number | null;
};

async function fetchGarageBilling(garageId: number): Promise<GarageBillingData | null> {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      trialEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      referralRewardMonths: true,
      pendingReferralMonthsApplied: true,
    },
  });
  return garage as GarageBillingData | null;
}

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    if (user.role === "ADMIN") {
      return NextResponse.json(
        success({
          plan: "ADMIN",
          status: "ACTIVE",
          currentPeriodEnd: null,
          hasPaymentMethod: true,
          canManageBilling: false,
        })
      );
    }

    const garageId = user.garageId ?? -1;

    // Use cache to reduce DB load (billing status changes rarely)
    const garage = await getOrSet(
      `billing:status:${garageId}`,
      CACHE_TTL_MS,
      () => fetchGarageBilling(garageId)
    );

    if (!garage) {
      throw new RouteError(404, "NOT_FOUND", "Garage introuvable");
    }

    // Calculer les jours restants de la période d'essai
    let trialDaysLeft: number | null = null;
    if (garage.trialEnd && garage.subscriptionStatus === "TRIALING") {
      const now = new Date();
      const trialEnd = new Date(garage.trialEnd);
      const diffMs = trialEnd.getTime() - now.getTime();
      trialDaysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Get entitlements (features, quotas, limits)
    const entitlements = await getEntitlementsForResponse(garageId);

    return NextResponse.json(
      success({
        plan: garage.plan,
        status: garage.subscriptionStatus,
        currentPeriodEnd: garage.currentPeriodEnd?.toISOString() ?? null,
        trialEnd: garage.trialEnd?.toISOString() ?? null,
        trialDaysLeft,
        hasPaymentMethod: !!garage.stripeCustomerId,
        hasSubscription: !!garage.stripeSubscriptionId,
        canManageBilling: !!garage.stripeCustomerId,
        referralRewardMonths: garage.referralRewardMonths ?? 0,
        pendingReferralMonthsApplied: garage.pendingReferralMonthsApplied ?? null,
        // Entitlements
        ...entitlements,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
