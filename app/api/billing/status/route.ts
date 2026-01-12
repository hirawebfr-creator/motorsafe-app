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
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!garage) {
      throw new RouteError(404, "NOT_FOUND", "Garage introuvable");
    }

    return NextResponse.json(
      success({
        plan: garage.plan,
        status: garage.subscriptionStatus,
        currentPeriodEnd: garage.currentPeriodEnd?.toISOString() ?? null,
        hasPaymentMethod: !!garage.stripeCustomerId,
        hasSubscription: !!garage.stripeSubscriptionId,
        canManageBilling: !!garage.stripeCustomerId,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
