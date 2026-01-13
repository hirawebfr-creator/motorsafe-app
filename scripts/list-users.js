const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, garageId: true },
      take: 10,
    });
    
    console.log('Users in DB:', users.length);
    users.forEach(u => console.log(u.id, '-', u.email, '-', u.role, '- garageId:', u.garageId));

    const garages = await prisma.garage.findMany({
      select: { id: true, name: true, status: true, plan: true, stripeCustomerId: true, stripeSubscriptionId: true, subscriptionStatus: true },
    });
    console.log('\nGarages:', garages.length);
    garages.forEach(g => console.log(g));
  } finally {
    await prisma.$disconnect();
  }
}

main();
