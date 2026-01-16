import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nettoie les \r\n littéraux des variables d'environnement
function cleanEnv(val: string | undefined): string | undefined {
  return val?.replace(/\\r\\n$/, "").replace(/\r\n$/, "").trim();
}

// Prix Stripe configurés
const STARTER_PRICES = [
  cleanEnv(process.env.STRIPE_PRICE_STARTER_MONTHLY),
  cleanEnv(process.env.STRIPE_PRICE_STARTER_YEARLY),
].filter(Boolean);

const PRO_PRICES = [
  cleanEnv(process.env.STRIPE_PRICE_PRO_MONTHLY),
  cleanEnv(process.env.STRIPE_PRICE_PRO_YEARLY),
].filter(Boolean);

function toStatus(status: string) {
  // Stripe statuses: incomplete, incomplete_expired, trialing, active, past_due, canceled, unpaid
  const normalized = status.toUpperCase();
  switch (normalized) {
    case "INCOMPLETE":
    case "INCOMPLETE_EXPIRED":
    case "TRIALING":
    case "ACTIVE":
    case "PAST_DUE":
    case "CANCELED":
    case "UNPAID":
      return normalized as any;
    default:
      return "INCOMPLETE" as any;
  }
}

// Détermine le plan selon le price ID de la subscription
function planFromPriceId(priceId: string | null): "FREE" | "STARTER" | "PRO" {
  if (!priceId) return "FREE";
  if (PRO_PRICES.includes(priceId)) return "PRO";
  if (STARTER_PRICES.includes(priceId)) return "STARTER";
  // Par défaut si le prix n'est pas reconnu mais existe, on assume PRO
  return "PRO";
}

// Détermine si le status permet l'accès
function isActiveStatus(status: string): boolean {
  const s = status.toUpperCase();
  return s === "ACTIVE" || s === "TRIALING" || s === "PAST_DUE";
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: { code: "CONFIG", message: "STRIPE_WEBHOOK_SECRET manquant" } }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Signature manquante" } }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_SIGNATURE", message: "Signature invalide" } },
      { status: 400 }
    );
  }

  // Idempotence: record event first.
  try {
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        apiVersion: event.api_version ?? null,
        created: event.created,
        livemode: event.livemode,
      },
    });
  } catch (e) {
    // Unique constraint => already processed/received
    return NextResponse.json({ ok: true, received: true });
  }

  try {
    const upsertGarageByCustomer = async (customerId: string) => {
      return prisma.garage.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      });
    };

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;

      if (customerId) {
        const garage = await upsertGarageByCustomer(customerId);
        if (garage && subscriptionId) {
          // Fetch subscription for canonical status and period.
          const sub: any = await stripe.subscriptions.retrieve(subscriptionId);
          const status = toStatus(sub.status);
          const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
          const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
          
          // Récupère le price ID du premier item de la subscription
          const priceId = sub.items?.data?.[0]?.price?.id ?? null;
          const plan = isActiveStatus(status) ? planFromPriceId(priceId) : "FREE";

          await prisma.garage.update({
            where: { id: garage.id },
            data: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: status,
              currentPeriodEnd,
              trialEnd,
              plan,
            },
            select: { id: true },
          });

          await prisma.stripeEvent.update({
            where: { id: event.id },
            data: { garageId: garage.id, processedAt: new Date() },
          });
        }
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      const subscriptionId = sub.id as string;
      const status = toStatus(sub.status);
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
      
      // Récupère le price ID du premier item de la subscription
      const priceId = sub.items?.data?.[0]?.price?.id ?? null;
      const plan = isActiveStatus(status) ? planFromPriceId(priceId) : "FREE";

      const garage = await prisma.garage.findFirst({
        where: { stripeCustomerId: customerId },
        select: { 
          id: true, 
          referralStatus: true, 
          referredByGarageId: true,
          subscriptionStatus: true,
          pendingReferralCouponId: true,
          pendingReferralMonthsApplied: true,
          referralRewardMonths: true,
        },
      });
      
      if (garage) {
        // Check if this is a transition to active status (for referral reward)
        const wasInactive = !isActiveStatus(garage.subscriptionStatus);
        const isNowActive = isActiveStatus(status);
        const shouldReward = wasInactive && isNowActive && 
          garage.referredByGarageId && 
          (garage.referralStatus === "PENDING" || garage.referralStatus === "APPROVED");

        // Check if we should consume pending referral coupon (mois offerts)
        const shouldConsumeCoupon = isNowActive && 
          garage.pendingReferralCouponId && 
          garage.pendingReferralMonthsApplied;

        // Calculate new referralRewardMonths after consuming coupon
        const newReferralRewardMonths = shouldConsumeCoupon
          ? Math.max(0, (garage.referralRewardMonths ?? 0) - (garage.pendingReferralMonthsApplied ?? 0))
          : undefined;

        await prisma.garage.update({
          where: { id: garage.id },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: status,
            currentPeriodEnd,
            trialEnd,
            plan,
            // Update referral status if becoming active
            ...(shouldReward ? { referralStatus: "ACTIVE_SUB" } : {}),
            // Consume pending referral coupon if subscription is now active
            ...(shouldConsumeCoupon ? {
              referralRewardMonths: newReferralRewardMonths,
              pendingReferralCouponId: null,
              pendingReferralMonthsApplied: null,
            } : {}),
          },
          select: { id: true },
        });

        // Log referral coupon consumption event
        if (shouldConsumeCoupon) {
          await prisma.referralEvent.create({
            data: {
              referrerGarageId: garage.id, // The garage consuming its own reward
              refereeGarageId: garage.id,
              eventType: "REWARD_CONSUMED",
              metaJson: JSON.stringify({ 
                monthsConsumed: garage.pendingReferralMonthsApplied,
                couponId: garage.pendingReferralCouponId,
              }),
            },
          });
        }

        // Grant referral reward to the referrer
        if (shouldReward && garage.referredByGarageId) {
          await prisma.garage.update({
            where: { id: garage.referredByGarageId },
            data: {
              referralRewardMonths: { increment: 1 },
            },
          });

          // Log the reward event
          await prisma.referralEvent.create({
            data: {
              referrerGarageId: garage.referredByGarageId,
              refereeGarageId: garage.id,
              eventType: "REWARD_GRANTED",
              metaJson: JSON.stringify({ rewardMonths: 1 }),
            },
          });
        }

        await prisma.stripeEvent.update({
          where: { id: event.id },
          data: { garageId: garage.id, processedAt: new Date() },
        });
      }
    }

    // Optional: invoice events can refine status.
    if (event.type === "invoice.payment_failed" || event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      const customerId = invoice.customer as string;
      const garage = await upsertGarageByCustomer(customerId);
      if (garage) {
        await prisma.stripeEvent.update({
          where: { id: event.id },
          data: { garageId: garage.id, processedAt: new Date() },
        });
      }
    }

    // Always 200 to stop retries once stored.
    return NextResponse.json({ ok: true, received: true });
  } catch (err: any) {
    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date(), lastError: err?.message ? String(err.message) : "Webhook error" },
    });
    return NextResponse.json({ ok: false, error: { code: "WEBHOOK_ERROR", message: "Erreur webhook" } }, { status: 500 });
  }
}
