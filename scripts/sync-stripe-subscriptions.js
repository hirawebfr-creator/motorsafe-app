/**
 * Script pour synchroniser manuellement les abonnements Stripe
 * 
 * Usage:
 *   DATABASE_URL=... STRIPE_SECRET_KEY=... node scripts/sync-stripe-subscriptions.js
 */

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function toStatus(status) {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case 'INCOMPLETE':
    case 'INCOMPLETE_EXPIRED':
    case 'TRIALING':
    case 'ACTIVE':
    case 'PAST_DUE':
    case 'CANCELED':
    case 'UNPAID':
      return normalized;
    default:
      return 'INCOMPLETE';
  }
}

function planFromPriceId(priceId) {
  // Prix configurés
  const PRO_PRICES = [
    process.env.STRIPE_PRICE_PRO_MONTHLY,
    process.env.STRIPE_PRICE_PRO_YEARLY,
    'price_1SpCN1Rzdstl54XXa0mouvZT', // PRO_MONTHLY
    'price_1SpDsoRzdstl54XXjZuLQ4I7', // PRO_YEARLY
  ];
  const STARTER_PRICES = [
    process.env.STRIPE_PRICE_STARTER_MONTHLY,
    process.env.STRIPE_PRICE_STARTER_YEARLY,
    'price_1SpCM2Rzdstl54XXuLMkjb6T', // STARTER_MONTHLY
    'price_1SpDsoRzdstl54XXsf36gUiX', // STARTER_YEARLY
  ];
  
  if (!priceId) return 'FREE';
  if (PRO_PRICES.includes(priceId)) return 'PRO';
  if (STARTER_PRICES.includes(priceId)) return 'STARTER';
  return 'PRO'; // Default to PRO if unknown paid price
}

async function main() {
  console.log('🔄 Synchronisation des abonnements Stripe...\n');

  // Récupérer tous les garages avec un stripeCustomerId
  const garages = await prisma.garage.findMany({
    where: { stripeCustomerId: { not: null } },
    select: { id: true, name: true, stripeCustomerId: true },
  });

  console.log(`📋 ${garages.length} garages avec customer Stripe trouvés\n`);

  for (const garage of garages) {
    console.log(`\n--- Garage ${garage.id}: ${garage.name} ---`);
    console.log(`Customer: ${garage.stripeCustomerId}`);

    try {
      // Récupérer les abonnements du customer
      const subscriptions = await stripe.subscriptions.list({
        customer: garage.stripeCustomerId,
        limit: 1,
        status: 'all',
      });

      if (subscriptions.data.length === 0) {
        console.log('  ⚪ Aucun abonnement');
        continue;
      }

      const sub = subscriptions.data[0];
      const status = toStatus(sub.status);
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const plan = ['active', 'trialing', 'past_due'].includes(sub.status.toLowerCase())
        ? planFromPriceId(priceId)
        : 'FREE';

      console.log(`  Subscription: ${sub.id}`);
      console.log(`  Status: ${sub.status} -> ${status}`);
      console.log(`  Price ID: ${priceId}`);
      console.log(`  Plan: ${plan}`);
      console.log(`  Period End: ${currentPeriodEnd}`);
      console.log(`  Trial End: ${trialEnd}`);

      // Mettre à jour la DB
      await prisma.garage.update({
        where: { id: garage.id },
        data: {
          stripeSubscriptionId: sub.id,
          subscriptionStatus: status,
          currentPeriodEnd,
          trialEnd,
          plan,
        },
      });

      console.log(`  ✅ Garage mis à jour`);
    } catch (err) {
      console.error(`  ❌ Erreur:`, err.message);
    }
  }

  console.log('\n✅ Synchronisation terminée');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
