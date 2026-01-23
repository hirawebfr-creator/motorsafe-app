/**
 * Create interventions only
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const garageId = 1;
  
  // Get existing vehicles
  const vehicles = await prisma.vehicle.findMany({
    where: { garageId, deletedAt: null },
  });

  if (vehicles.length === 0) {
    console.error("No vehicles found");
    process.exit(1);
  }

  console.log(`Found ${vehicles.length} vehicles`);

  // Create interventions
  const interventionTypes = ["revision", "reparation", "diagnostic", "pneumatiques", "carrosserie"];
  const statuses = ["OPEN", "DRAFT", "DONE", "CANCELED"];

  const interventions = [];
  for (let i = 0; i < 12; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const type = interventionTypes[i % interventionTypes.length];
    const status = statuses[i % statuses.length];
    
    const intervention = await prisma.intervention.create({
      data: {
        garageId,
        vehicleId: vehicle.id,
        type,
        status,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${vehicle.brand} ${vehicle.model}`,
        notes: `Intervention sur ${vehicle.plate}`,
        odometerKm: 50000 + Math.floor(Math.random() * 50000),
        performedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    interventions.push(intervention);
    console.log(`Created: ${intervention.title}`);
  }

  console.log(`\nCreated ${interventions.length} interventions`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
