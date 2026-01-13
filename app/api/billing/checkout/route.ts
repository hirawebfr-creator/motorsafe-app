import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Map des clés de prix vers les variables d'environnement
// .trim() pour supprimer les \r\n éventuels ajoutés par Vercel CLI
const PRICE_KEYS: Record<string, string | undefined> = {
  STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim(),
  STARTER_YEARLY: process.env.STRIPE_PRICE_STARTER_YEARLY?.trim(),
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY?.trim(),
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY?.trim(),
};

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    if (user.role === "ADMIN") {
      throw new RouteError(400, "BAD_REQUEST", "Un compte tenant est requis.");
    }

    const garageId = user.garageId;
    if (!garageId) throw new RouteError(400, "TENANT_REQUIRED", "Garage invalide.");

    // Récupérer le priceKey du body (défaut: PRO_MONTHLY pour compatibilité)
    const body = await req.json().catch(() => ({}));
    const priceKey = body.priceKey || "PRO_MONTHLY";
    
    const priceId = PRICE_KEYS[priceKey];
    if (!priceId) throw new RouteError(400, "INVALID_PRICE", `Prix invalide: ${priceKey}`);

    const appUrl = process.env.APP_URL;
    if (!appUrl) throw new RouteError(500, "CONFIG", "APP_URL manquant");

    const stripe = getStripe();

    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: { id: true, name: true, stripeCustomerId: true },
    });
    if (!garage) throw new RouteError(404, "NOT_FOUND", "Garage introuvable");

    let customerId = garage.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: garage.name,
        metadata: { garageId: String(garage.id) },
      });
      customerId = customer.id;

      await prisma.garage.update({
        where: { id: garage.id },
        data: { stripeCustomerId: customerId },
        select: { id: true },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
        metadata: { garageId: String(garage.id) },
      },
      success_url: `${appUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
      metadata: { garageId: String(garage.id) },
    });

    if (!session.url) throw new RouteError(500, "STRIPE", "Checkout session sans URL");

    return NextResponse.json(success({ url: session.url }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
