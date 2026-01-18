import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { getStripe } from "@/lib/stripe";
import { requirePermission, Permission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Map des clés de prix vers les variables d'environnement
// Nettoie les \r\n littéraux parfois ajoutés par Vercel CLI
function cleanEnv(val: string | undefined): string | undefined {
  return val?.replace(/\\r\\n$/, "").replace(/\r\n$/, "").trim();
}

const PRICE_KEYS: Record<string, string | undefined> = {
  STARTER_MONTHLY: cleanEnv(process.env.STRIPE_PRICE_STARTER_MONTHLY),
  STARTER_YEARLY: cleanEnv(process.env.STRIPE_PRICE_STARTER_YEARLY),
  PRO_MONTHLY: cleanEnv(process.env.STRIPE_PRICE_PRO_MONTHLY),
  PRO_YEARLY: cleanEnv(process.env.STRIPE_PRICE_PRO_YEARLY),
};

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // MULTI-USER-ROLES-01: Only OWNER/MANAGER can manage billing
    await requirePermission(user, Permission.BILLING_MANAGE);

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

    const appUrl = cleanEnv(process.env.APP_URL);
    if (!appUrl) throw new RouteError(500, "CONFIG", "APP_URL manquant");

    const stripe = getStripe();

    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: { 
        id: true, 
        name: true, 
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        referralRewardMonths: true,
        pendingReferralCouponId: true,
      },
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

    // Prepare discounts for referral reward (free months)
    const discounts: Array<{ coupon: string }> = [];
    let referralCouponId: string | null = null;
    let referralMonthsApplied: number | null = null;

    // Only apply referral discount if:
    // 1. Garage has reward months available
    // 2. No active subscription yet
    // 3. No pending coupon already in flight
    if (
      garage.referralRewardMonths > 0 &&
      !garage.stripeSubscriptionId &&
      !garage.pendingReferralCouponId
    ) {
      // Create a 100% off coupon for X months
      const coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: "repeating",
        duration_in_months: garage.referralRewardMonths,
        name: `Parrainage SafeMotor (${garage.referralRewardMonths} mois offerts)`,
        metadata: { 
          garageId: String(garage.id),
          type: "referral_reward",
        },
      });

      discounts.push({ coupon: coupon.id });
      referralCouponId = coupon.id;
      referralMonthsApplied = garage.referralRewardMonths;

      // Store pending state (will be confirmed by webhook)
      await prisma.garage.update({
        where: { id: garage.id },
        data: {
          pendingReferralCouponId: referralCouponId,
          pendingReferralMonthsApplied: referralMonthsApplied,
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: discounts.length === 0, // Disable promo codes if we already have a discount
      ...(discounts.length > 0 ? { discounts } : {}),
      subscription_data: {
        trial_period_days: 14,
        metadata: { garageId: String(garage.id) },
      },
      success_url: `${appUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
      metadata: { garageId: String(garage.id) },
    });

    if (!session.url) throw new RouteError(500, "STRIPE", "Checkout session sans URL");

    return NextResponse.json(success({ 
      url: session.url,
      referralMonthsApplied: referralMonthsApplied,
    }));
  } catch (err) {
    console.error("Erreur API POST /api/billing/checkout:", err);
    return toErrorResponse(err);
  }
}
