import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function planFromStatus(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE" || s === "TRIALING" || s === "PAST_DUE") return "PRO" as const;
  return "FREE" as const;
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

          await prisma.garage.update({
            where: { id: garage.id },
            data: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: status,
              currentPeriodEnd,
              plan: planFromStatus(status),
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

      const garage = await upsertGarageByCustomer(customerId);
      if (garage) {
        await prisma.garage.update({
          where: { id: garage.id },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: status,
            currentPeriodEnd,
            plan: planFromStatus(status),
          },
          select: { id: true },
        });

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
