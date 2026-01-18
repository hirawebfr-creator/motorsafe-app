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
      isDemo: true,
    },
    create: {
      name: "Demo Garage",
      slug: demoSlug,
      email: "demo@garage.local",
      phone: "+33 6 00 00 00 00",
      address: "1 Rue de la Démo, 75000 Paris",
      status: "ACTIVE",
      plan: "FREE",
      isDemo: true,
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
      createdAt: new Date(),
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
      createdAt: new Date(),
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
      createdAt: new Date(),
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
      createdAt: new Date(),
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
      createdAt: new Date(),
    },
  });

  // ============================================
  // LEGAL REFERENCES (MVP seed)
  // ============================================
  console.log("Seeding legal references...");

  const legalReferences = [
    {
      code: "CONSO_L111-1",
      title: "Obligation d'information précontractuelle",
      summary: "Le professionnel doit communiquer au consommateur les caractéristiques essentielles du bien ou du service.",
      articleRef: "Art. L111-1",
      sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226876",
      severity: "INFO",
      tags: "BASE",
      types: ["E85", "Reprog", "Diag", "Autre"],
    },
    {
      code: "CONSO_L111-3",
      title: "Devis préalable",
      summary: "Le devis est obligatoire pour les prestations de service dépassant un certain montant. Il doit être détaillé et signé.",
      articleRef: "Art. L111-3",
      sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226872",
      severity: "INFO",
      tags: "BASE",
      types: ["E85", "Reprog", "Diag", "Autre"],
    },
    {
      code: "ASSUR_L113-2",
      title: "Déclaration des modifications à l'assureur",
      summary: "L'assuré doit déclarer les circonstances nouvelles qui ont pour conséquence d'aggraver les risques ou d'en créer de nouveaux.",
      articleRef: "Art. L113-2",
      sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006792329",
      severity: "CRITICAL",
      tags: "INSURANCE",
      types: ["E85", "Reprog"],
    },
    {
      code: "ASSUR_L113-8",
      title: "Nullité pour fausse déclaration",
      summary: "Le contrat d'assurance est nul en cas de réticence ou de fausse déclaration intentionnelle.",
      articleRef: "Art. L113-8",
      sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006792335",
      severity: "CRITICAL",
      tags: "INSURANCE",
      types: ["E85", "Reprog"],
    },
    {
      code: "E85_ARRETE_2017",
      title: "Arrêté boîtiers E85 homologués",
      summary: "Définit les conditions d'homologation des boîtiers de conversion E85 et leur installation par des professionnels agréés.",
      articleRef: "Arrêté du 30/11/2017",
      sourceUrl: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000036093982",
      severity: "WARNING",
      tags: "E85",
      types: ["E85"],
    },
    {
      code: "ROUTE_R321-16",
      title: "Réception des véhicules",
      summary: "Les véhicules doivent avoir fait l'objet d'une réception avant mise en circulation. Les modifications importantes nécessitent une nouvelle réception.",
      articleRef: "Art. R321-16",
      sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842105",
      severity: "WARNING",
      tags: "MODIF",
      types: ["E85", "Reprog"],
    },
    {
      code: "ROUTE_R318-2",
      title: "Émissions polluantes",
      summary: "Les véhicules en circulation doivent respecter les normes d'émissions en vigueur lors de leur première mise en circulation.",
      articleRef: "Art. R318-2",
      sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842013",
      severity: "WARNING",
      tags: "REPROG",
      types: ["Reprog"],
    },
    {
      code: "CONSO_L217-4",
      title: "Garantie légale de conformité",
      summary: "Le vendeur livre un bien conforme au contrat. La garantie s'applique pendant 2 ans à compter de la délivrance.",
      articleRef: "Art. L217-4",
      sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226849",
      severity: "INFO",
      tags: "GARANTIE",
      types: ["E85", "Reprog", "Diag", "Autre"],
    },
  ];

  for (const ref of legalReferences) {
    const existing = await prisma.legalReference.findFirst({
      where: { code: ref.code },
    });

    if (existing) {
      await prisma.legalReference.update({
        where: { id: existing.id },
        data: {
          title: ref.title,
          summary: ref.summary,
          articleRef: ref.articleRef,
          sourceUrl: ref.sourceUrl,
          severity: ref.severity,
          tags: ref.tags,
          isActive: true,
        },
      });
      console.log(`  Updated: ${ref.code}`);
    } else {
      const created = await prisma.legalReference.create({
        data: {
          title: ref.title,
          summary: ref.summary,
          articleRef: ref.articleRef,
          sourceUrl: ref.sourceUrl,
          code: ref.code,
          severity: ref.severity,
          tags: ref.tags,
          isActive: true,
        },
      });

      // Create assignments
      for (const type of ref.types) {
        await prisma.legalReferenceAssignment.create({
          data: {
            referenceId: created.id,
            interventionType: type,
          },
        });
      }
      console.log(`  Created: ${ref.code}`);
    }
  }

  console.log("Seed complete:");
  console.log("- Garage:", garage.id);
  console.log("- Owner:", owner.email);
  console.log("- Admin:", adminEmail);
  console.log("- Legal references:", legalReferences.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
