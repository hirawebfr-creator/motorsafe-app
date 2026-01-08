/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const demoSlug = "demo-garage";
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@demo.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Password123!";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const garage = await prisma.garage.upsert({
    where: { email: "demo@garage.local" },
    update: {
      name: "Demo Garage",
      slug: demoSlug,
      status: "ACTIVE",
      plan: "FREE",
    },
    create: {
      name: "Demo Garage",
      slug: demoSlug,
      email: "demo@garage.local",
      phone: "+33 6 00 00 00 00",
      address: "1 Rue de la Démo, 75000 Paris",
      status: "ACTIVE",
      plan: "FREE",
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: "ADMIN",
      garageId: null,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      garageId: null,
    },
  });

  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@demo.local";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "Password123!";
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 10);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      passwordHash: ownerPasswordHash,
      role: "OWNER",
      garageId: garage.id,
    },
    create: {
      email: ownerEmail,
      passwordHash: ownerPasswordHash,
      role: "OWNER",
      garageId: garage.id,
    },
  });

  // Clients VAT profiles (requested by quote/invoice module)
  const c1 = await prisma.client.create({
    data: {
      garageId: garage.id,
      firstName: "Alice",
      lastName: "Martin",
      email: "alice@example.com",
      phone: "+33 6 11 22 33 44",
      notes: "Cliente de démonstration",
      vatProfile: "PARTICULIER",
      countryCode: "FR",
    },
  });

  await prisma.client.create({
    data: {
      garageId: garage.id,
      firstName: "Bruno",
      lastName: "SAS",
      email: "bruno-pro@example.com",
      phone: "+33 6 22 33 44 55",
      vatProfile: "PRO_UE_VAT",
      vatNumber: "EU123456789",
      countryCode: "DE",
    },
  });

  await prisma.client.create({
    data: {
      garageId: garage.id,
      firstName: "Chloe",
      lastName: "Export",
      email: "chloe-export@example.com",
      phone: "+33 6 33 44 55 66",
      vatProfile: "EXPORT",
      countryCode: "US",
    },
  });

  const v1 = await prisma.vehicle.create({
    data: {
      garageId: garage.id,
      clientId: c1.id,
      brand: "Renault",
      model: "Clio",
      plate: "AA-123-AA",
      vin: "VF1AAAAAAAAAAAAAA",
      fuel: "Essence",
      year: 2018,
    },
  });

  await prisma.intervention.create({
    data: {
      garageId: garage.id,
      vehicleId: v1.id,
      type: "Diag",
      title: "Diagnostic",
      notes: "Intervention seed",
      status: "OPEN",
      createdBy: owner.email,
    },
  });

  console.log("Seed complete:");
  console.log("- Garage:", garage.id);
  console.log("- Owner:", owner.email);
  console.log("- Admin:", adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
