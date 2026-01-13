const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Vérifier l'état actuel
  const existing = await prisma.garage.findFirst({
    where: { email: "freetest@test.com" },
    include: { clients: true, vehicles: true, interventions: true },
  });

  if (existing) {
    console.log("📊 État actuel du garage FREE:");
    console.log("   Garage ID:", existing.id, "Plan:", existing.plan);
    console.log("   Clients:", existing.clients.length);
    console.log("   Véhicules:", existing.vehicles.length);
    console.log("   Interventions:", existing.interventions.length);

    // Nettoyer les données
    console.log("\n🧹 Nettoyage des données...");
    await prisma.intervention.deleteMany({ where: { garageId: existing.id } });
    await prisma.vehicle.deleteMany({ where: { garageId: existing.id } });
    await prisma.client.deleteMany({ where: { garageId: existing.id } });
    console.log("   ✅ Données nettoyées");
  } else {
    // Créer un garage FREE
    const garage = await prisma.garage.create({
      data: {
        name: "Garage Test FREE",
        email: "freetest@test.com",
        status: "ACTIVE",
        plan: "FREE",
      },
    });
    console.log("✅ Garage créé:", garage.id, garage.name, "Plan:", garage.plan);

    // Créer un user pour ce garage
    const hash = await bcrypt.hash("Free123!", 10);
    await prisma.user.create({
      data: {
        garageId: garage.id,
        email: "freetest@test.com",
        passwordHash: hash,
        role: "GARAGE",
      },
    });
    console.log("✅ User créé: freetest@test.com / Free123!");
  }

  console.log("\n📋 Compte de test FREE prêt:");
  console.log("   Email: freetest@test.com");
  console.log("   Mot de passe: Free123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
