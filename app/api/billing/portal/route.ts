import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    if (user.role === "ADMIN") {
      throw new RouteError(400, "BAD_REQUEST", "Un compte tenant est requis.");
    }

    const garageId = user.garageId;
    if (!garageId) throw new RouteError(400, "TENANT_REQUIRED", "Garage invalide.");

    const appUrl = process.env.APP_URL;
    if (!appUrl) throw new RouteError(500, "CONFIG", "APP_URL manquant");

    const stripe = getStripe();

    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: { stripeCustomerId: true },
    });
    if (!garage) throw new RouteError(404, "NOT_FOUND", "Garage introuvable");

    if (!garage.stripeCustomerId) {
      throw new RouteError(400, "BAD_REQUEST", "Aucun customer Stripe pour ce compte.");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: garage.stripeCustomerId,
      return_url: `${appUrl}/app/billing`,
    });

    return NextResponse.json(success({ url: session.url }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
