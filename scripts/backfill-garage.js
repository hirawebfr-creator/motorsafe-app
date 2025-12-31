const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const name = process.env.DEFAULT_GARAGE_NAME || "Garage principal";
  const email = process.env.DEFAULT_GARAGE_EMAIL || "garage@example.com";
  const phone = process.env.DEFAULT_GARAGE_PHONE || null;

  let garage = await prisma.garage.findUnique({ where: { email } });
  if (!garage) {
    garage = await prisma.garage.create({
      data: {
        name,
        email,
        phone,
        status: "ACTIVE",
      },
    });
  }

  const [clients, vehicles, interventions, users] = await prisma.$transaction([
    prisma.client.updateMany({ where: { garageId: null }, data: { garageId: garage.id } }),
    prisma.vehicle.updateMany({ where: { garageId: null }, data: { garageId: garage.id } }),
    prisma.intervention.updateMany({ where: { garageId: null }, data: { garageId: garage.id } }),
    prisma.user.updateMany({
      where: { role: "GARAGE", garageId: null },
      data: { garageId: garage.id },
    }),
  ]);

  console.log("Garage par defaut:", garage.id, garage.name);
  console.log("Clients mis a jour:", clients.count);
  console.log("Vehicules mis a jour:", vehicles.count);
  console.log("Interventions mises a jour:", interventions.count);
  console.log("Utilisateurs mis a jour:", users.count);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
