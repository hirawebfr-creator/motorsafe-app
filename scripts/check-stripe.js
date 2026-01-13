const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Stripe Events (last 10) ===');
    const events = await prisma.stripeEvent.findMany({
      orderBy: { created: 'desc' },
      take: 10,
    });
    events.forEach(e => console.log(e.id, e.type, 'garageId:', e.garageId, 'processed:', e.processedAt, 'error:', e.lastError));
    
    console.log('\n=== Garages ===');
    const garages = await prisma.garage.findMany({
      select: { id: true, name: true, plan: true, subscriptionStatus: true, stripeCustomerId: true, stripeSubscriptionId: true },
    });
    garages.forEach(g => console.log(g));
  } finally {
    await prisma.$disconnect();
  }
}

main();
