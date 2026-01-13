import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const garageId = getTenantId(user);

    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: {
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        trialEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

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
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
