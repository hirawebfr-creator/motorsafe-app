/**
 * Create test data for garage ID 1 (TEST 2)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const garageId = 1; // TEST 2 garage
  
  console.log("Creating test data for garage ID 1...");

  // Create 5 clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        garageId,
        vatProfile: "PARTICULIER",
        firstName: "Jean-Pierre",
        lastName: "DUMONT",
        email: "jp.dumont@email.fr",
        phone: "06 12 34 56 78",
        address: "42 Rue des Lilas, 69003 Lyon",
      },
    }),
    prisma.client.create({
      data: {
        garageId,
        vatProfile: "PARTICULIER",
        firstName: "Marie",
        lastName: "MARTIN",
        email: "marie.martin@email.fr",
        phone: "06 23 45 67 89",
        address: "15 Avenue Victor Hugo, 75016 Paris",
      },
    }),
    prisma.client.create({
      data: {
        garageId,
        vatProfile: "PARTICULIER",
        firstName: "Pierre",
        lastName: "DUBOIS",
        email: "p.dubois@gmail.com",
        phone: "06 34 56 78 90",
        address: "8 Rue du Commerce, 33000 Bordeaux",
      },
    }),
    prisma.client.create({
      data: {
        garageId,
        vatProfile: "PROFESSIONNEL",
        firstName: "Sophie",
        lastName: "LAURENT",
        email: "s.laurent@entreprise.fr",
        phone: "06 45 67 89 01",
        address: "120 Bd Haussmann, 75008 Paris",
      },
    }),
    prisma.client.create({
      data: {
        garageId,
        vatProfile: "PARTICULIER",
        firstName: "Lucas",
        lastName: "BERNARD",
        email: "lucas.b@hotmail.fr",
        phone: "06 56 78 90 12",
        address: "25 Rue de la République, 13001 Marseille",
      },
    }),
  ]);

  console.log(`Created ${clients.length} clients`);

  // Create vehicles for each client
  const vehicleData = [
    { brand: "Peugeot", model: "308 GT Line", year: 2021, plate: "GH-789-KL", fuel: "Essence" },
    { brand: "Renault", model: "Clio V", year: 2022, plate: "AB-123-CD", fuel: "Essence" },
    { brand: "Citroën", model: "C3 Aircross", year: 2020, plate: "EF-456-GH", fuel: "Diesel" },
    { brand: "Volkswagen", model: "Golf 8", year: 2023, plate: "IJ-789-KL", fuel: "Hybride" },
    { brand: "BMW", model: "Série 3 320d", year: 2021, plate: "MN-012-OP", fuel: "Diesel" },
    { brand: "Tesla", model: "Model 3", year: 2023, plate: "QR-345-ST", fuel: "Électrique" },
    { brand: "Toyota", model: "Yaris Cross", year: 2022, plate: "UV-678-WX", fuel: "Hybride" },
  ];

  const vehicles = [];
  for (let i = 0; i < vehicleData.length; i++) {
    const clientIndex = i % clients.length;
    const v = await prisma.vehicle.create({
      data: {
        garageId,
        clientId: clients[clientIndex].id,
        ...vehicleData[i],
      },
    });
    vehicles.push(v);
  }

  console.log(`Created ${vehicles.length} vehicles`);

  // Create interventions
  const interventionTypes = ["revision", "reparation", "diagnostic", "pneumatiques", "carrosserie"];
  const statuses = ["OPEN", "IN_PROGRESS", "PENDING_PARTS", "COMPLETED"];

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
  }

  console.log(`Created ${interventions.length} interventions`);

  // Verify
  const counts = {
    clients: await prisma.client.count({ where: { garageId, deletedAt: null } }),
    vehicles: await prisma.vehicle.count({ where: { garageId, deletedAt: null } }),
    interventions: await prisma.intervention.count({ where: { garageId, deletedAt: null } }),
  };

  console.log("\n=== Final counts ===");
  console.log(counts);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
