const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Reset stripeCustomerId for garage 2 (customer was deleted in Stripe)
    await prisma.garage.update({
      where: { id: 2 },
      data: { stripeCustomerId: null },
    });
    console.log('Reset stripeCustomerId for garage 2');
  } finally {
    await prisma.$disconnect();
  }
}

main();
