/**
 * Script to create realistic test data for signature testing
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1. Find the hiraweb user
  const user = await prisma.user.findFirst({
    where: { email: { contains: "hiraweb" } },
    include: { garage: true },
  });

  if (!user || !user.garage) {
    console.error("User hiraweb not found or has no garage");
    process.exit(1);
  }

  console.log(`Found user: ${user.email}, garage: ${user.garage.name}`);
  const garageId = user.garage.id;

  // 2. Create a realistic client (using actual schema fields)
  const client = await prisma.client.create({
    data: {
      garage: { connect: { id: garageId } },
      vatProfile: "PARTICULIER",
      firstName: "Jean-Pierre",
      lastName: "DUMONT",
      email: "jp.dumont@email.fr",
      phone: "06 12 34 56 78",
      address: "42 Rue des Lilas, 69003 Lyon",
      notes: "Client fidèle depuis 2019. Préfère être contacté par SMS.",
    },
  });
  console.log(`Created client: ${client.firstName} ${client.lastName} (ID: ${client.id})`);

  // 3. Create a realistic vehicle (using actual schema fields)
  const vehicle = await prisma.vehicle.create({
    data: {
      garage: { connect: { id: garageId } },
      client: { connect: { id: client.id } },
      brand: "Peugeot",
      model: "308 GT Line",
      year: 2021,
      plate: "GH-789-KL",
      vin: "VF3LBHZTXLS654321",
      fuel: "Essence",
      engine: "1.2 PureTech 130 EAT8",
    },
  });
  console.log(`Created vehicle: ${vehicle.brand} ${vehicle.model} - ${vehicle.plate} (ID: ${vehicle.id})`);

  // 4. Create a detailed intervention (using actual schema fields)
  const intervention = await prisma.intervention.create({
    data: {
      garage: { connect: { id: garageId } },
      vehicle: { connect: { id: vehicle.id } },
      status: "OPEN",
      type: "revision",
      title: "Révision complète 50 000 km + Freinage",
      
      // Tags for multi-type
      tags: ["revision", "freinage", "geometrie"],
      
      // Odometer
      odometerKm: 47850,
      
      // Intake notes - customer complaint
      intakeNotes: `MOTIF DE LA VISITE :
- Révision des 50 000 km demandée par le client
- Bruit de frottement au freinage à l'avant
- Témoin de révision allumé au tableau de bord
- Légère vibration au volant à haute vitesse

OBSERVATIONS À LA RÉCEPTION :
- Véhicule propre, état extérieur correct
- Niveau d'huile OK
- Pneus avant : usure irrégulière visible côté intérieur`,
      
      // Intake checklist
      intakeChecklist: {
        exterior: true,
        interior: true,
        lights: true,
        engineNoise: false, // signalé bruit freinage
        leaks: false,
        smoke: false,
        warning_lights: true, // témoin révision
      },
      
      // Work performed
      workNotes: `TRAVAUX RÉALISÉS :

═══ RÉVISION 50 000 KM ═══
✓ Vidange huile moteur 0W30 TOTAL Quartz (5L)
✓ Remplacement filtre à huile MANN W7032
✓ Remplacement filtre à air MANN C25117/2
✓ Remplacement filtre habitacle MANN CUK2545
✓ Remplacement bougies d'allumage NGK LZKAR7A x4
✓ Contrôle niveaux (lave-glace, refroidissement, direction)

═══ SYSTÈME DE FREINAGE ═══
✓ Purge circuit + remplacement liquide DOT4
✓ Remplacement plaquettes frein avant BOSCH
✓ Remplacement disques frein avant TRW DF6604S x2
✓ Contrôle étriers et flexibles - RAS

═══ LIAISON AU SOL ═══
✓ Géométrie / Parallélisme train avant
✓ Contrôle rotules et biellettes - RAS
✓ Contrôle amortisseurs - pas de fuite

═══ DIVERS ═══
✓ Remplacement balai essuie-glace arrière BOSCH H301
✓ RAZ témoin révision
✓ Essai routier 15 km - Fonctionnement correct

Kilométrage sortie : 47 865 km`,
      
      // Parts used
      partsNotes: `PIÈCES UTILISÉES :

Référence           | Désignation                              | Qté | P.U. HT
--------------------|------------------------------------------|-----|--------
TOT-0W30-5L         | Huile TOTAL Quartz 0W30 - 5L             |  1  |  49,90€
MANN-W7032          | Filtre à huile                           |  1  |  12,50€
MANN-C25117-2       | Filtre à air                             |  1  |  18,90€
MANN-CUK2545        | Filtre habitacle                         |  1  |  24,50€
NGK-LZKAR7A         | Bougie allumage (x4)                     |  4  |  14,90€
VALEO-DOT4-1L       | Liquide de frein DOT4 - 1L               |  1  |   8,90€
BOSCH-0986494597    | Kit plaquettes frein avant               |  1  |  65,00€
TRW-DF6604S         | Disque frein avant                       |  2  |  58,50€
BOSCH-H301          | Balai essuie-glace arrière               |  1  |  11,90€

MAIN D'ŒUVRE :
- Révision complète 50 000 km (forfait)    : 180,00€
- Remplacement disques/plaquettes AV (2h)  :  90,00€
- Géométrie train avant (forfait)          :  79,00€
- Purge circuit freinage (0.5h)            :  30,00€`,
      
      // General notes
      notes: `DIAGNOSTIC :
━━━━━━━━━━━━
1. FREINAGE : Plaquettes avant usées à 85%, disques voilés (0.15mm)
2. MOTORISATION : Huile noire, filtres encrassés
3. TRAIN AVANT : Usure asymétrique pneus (défaut parallélisme corrigé)
4. BATTERIE : 12.4V - acceptable

RECOMMANDATIONS AU CLIENT :
━━━━━━━━━━━━━━━━━━━━━━━━━
• Pneus avant à remplacer d'ici 10 000 km
• Batterie à contrôler avant l'hiver
• Prochaine révision : 60 000 km ou 1 an
• Distribution à prévoir : 100 000 km (2031)

Client informé et satisfait du service.`,
      
      // Outtake checklist
      outtakeChecklist: {
        roadTest: true,
        lights: true,
        clean: true,
        toolsRemoved: true,
        documentsReady: true,
      },
    },
  });
  console.log(`Created intervention: ${intervention.id} - ${intervention.type}`);

  console.log(`\n========================================`);
  console.log(`RÉCAPITULATIF`);
  console.log(`========================================`);
  console.log(`Client: ${client.firstName} ${client.lastName}`);
  console.log(`Email: ${client.email}`);
  console.log(`Véhicule: ${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`);
  console.log(`Intervention ID: ${intervention.id}`);
  console.log(`Type: ${intervention.type}`);
  console.log(`========================================`);
  console.log(`\n✅ Données de test créées avec succès !`);
  console.log(`\nPour tester la signature, allez sur :`);
  console.log(`https://safemotor.fr/interventions/${intervention.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
