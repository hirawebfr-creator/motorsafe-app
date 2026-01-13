const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Reset admin password
    const newHash = await bcrypt.hash('Admin123!', 10);
    
    await prisma.user.update({
      where: { email: 'hiraweb.fr@gmail.com' },
      data: { passwordHash: newHash },
    });
    console.log('Admin password reset to: Admin123!');
    
    await prisma.user.update({
      where: { email: 'test@test.com' },
      data: { passwordHash: await bcrypt.hash('Test123!', 10) },
    });
    console.log('Test user password reset to: Test123!');
    
    const garages = await prisma.garage.findMany({
      select: { id: true, name: true, status: true, plan: true },
    });
    console.log('\nGarages:', garages.length);
    garages.forEach(g => console.log(g.id, '-', g.name, '-', g.status, '-', g.plan));
  } finally {
    await prisma.$disconnect();
  }
}

main();
