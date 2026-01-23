const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const clients = await p.client.count({ where: { deletedAt: null } });
  const vehicles = await p.vehicle.count({ where: { deletedAt: null } });
  const interventions = await p.intervention.count({ where: { deletedAt: null } });
  
  console.log('=== Database Status ===');
  console.log('Clients:', clients);
  console.log('Vehicles:', vehicles);
  console.log('Interventions:', interventions);
  
  if (clients > 0) {
    const sample = await p.client.findFirst({ where: { deletedAt: null } });
    console.log('\nSample client:', JSON.stringify(sample, null, 2));
  }
  
  await p.$disconnect();
}

main();
