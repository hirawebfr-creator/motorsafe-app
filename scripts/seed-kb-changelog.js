/**
 * Seed script for KB categories, articles, and changelog entries
 * Run with: node scripts/seed-kb-changelog.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding KB categories and articles...");

  // KB Categories
  const categories = [
    { name: "Premiers pas", slug: "premiers-pas", description: "Guides pour bien démarrer avec MotorSafe", sortOrder: 1 },
    { name: "Interventions", slug: "interventions", description: "Créer et gérer vos interventions", sortOrder: 2 },
    { name: "Clients & Véhicules", slug: "clients-vehicules", description: "Gestion de votre base clients et véhicules", sortOrder: 3 },
    { name: "Documents", slug: "documents", description: "Devis, factures et exports", sortOrder: 4 },
    { name: "Facturation", slug: "facturation", description: "Abonnement, paiements et factures", sortOrder: 5 },
    { name: "Sécurité", slug: "securite", description: "Protection des données et confidentialité", sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.kbCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`  ✓ ${categories.length} KB categories created/updated`);

  // Get category IDs
  const catMap = {};
  const dbCats = await prisma.kbCategory.findMany();
  for (const c of dbCats) {
    catMap[c.slug] = c.id;
  }

  // KB Articles
  const articles = [
    {
      title: "Créer votre premier garage",
      slug: "creer-premier-garage",
      categoryId: catMap["premiers-pas"],
      bodyMarkdown: `# Créer votre premier garage

Bienvenue sur MotorSafe ! Ce guide vous accompagne dans la création de votre espace garage.

## 1. Inscription

1. Rendez-vous sur la page d'inscription Pro
2. Remplissez les informations de votre garage
3. Vérifiez votre email

## 2. Configuration initiale

Après inscription, configurez :
- Le logo de votre garage
- Vos informations de contact
- Vos horaires d'ouverture

## Besoin d'aide ?

Contactez notre support via le bouton en bas à droite.`,
      tags: ["démarrage", "inscription", "configuration"],
      isPublished: true,
    },
    {
      title: "Créer une intervention",
      slug: "creer-intervention",
      categoryId: catMap["interventions"],
      bodyMarkdown: `# Créer une intervention

## Étapes

1. Cliquez sur "Nouvelle intervention"
2. Sélectionnez le client et le véhicule
3. Choisissez le type d'intervention
4. Ajoutez les lignes de détail
5. Enregistrez

## Types d'intervention

- **E85** : Conversion bioéthanol
- **Reprogrammation** : Optimisation moteur
- **Diagnostic** : Analyse et rapport

## Signatures

Les signatures client sont collectées directement sur tablette ou via lien sécurisé.`,
      tags: ["intervention", "création", "workflow"],
      isPublished: true,
    },
    {
      title: "Gestion des clients",
      slug: "gestion-clients",
      categoryId: catMap["clients-vehicules"],
      bodyMarkdown: `# Gestion des clients

## Ajouter un client

1. Menu Clients > Nouveau client
2. Renseignez les coordonnées
3. Enregistrez

## Recherche

Utilisez la barre de recherche pour trouver un client par :
- Nom
- Email
- Téléphone

## RGPD

Les données clients sont chiffrées et peuvent être exportées ou supprimées sur demande.`,
      tags: ["clients", "RGPD", "données"],
      isPublished: true,
    },
    {
      title: "Générer un devis ou une facture",
      slug: "generer-devis-facture",
      categoryId: catMap["documents"],
      bodyMarkdown: `# Générer des documents

## Devis

1. Depuis une intervention, cliquez "Générer un devis"
2. Vérifiez les lignes
3. Envoyez au client par email

## Factures

1. Une fois l'intervention terminée, générez la facture
2. Le client peut payer en ligne via Stripe
3. Le statut se met à jour automatiquement

## Export

Exportez vos documents au format PDF pour vos archives.`,
      tags: ["devis", "facture", "PDF"],
      isPublished: true,
    },
  ];

  for (const art of articles) {
    if (!art.categoryId) continue;
    await prisma.kbArticle.upsert({
      where: { slug: art.slug },
      update: { 
        title: art.title, 
        bodyMarkdown: art.bodyMarkdown, 
        tags: art.tags, 
        isPublished: art.isPublished,
        categoryId: art.categoryId,
      },
      create: art,
    });
  }
  console.log(`  ✓ ${articles.length} KB articles created/updated`);

  // Changelog entries
  console.log("\n🌱 Seeding changelog entries...");

  // Get admin user for createdBy
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminId = adminUser?.id || null;

  const changelog = [
    {
      title: "Nouvelle interface de tableau de bord",
      bodyMarkdown: "Le tableau de bord a été entièrement repensé avec une interface plus moderne et intuitive.",
      type: "FEATURE",
      version: "2.1.0",
      isPublished: true,
      publishedAt: new Date("2026-01-15"),
    },
    {
      title: "Amélioration des performances",
      bodyMarkdown: "Optimisation du chargement des pages et réduction de la consommation mémoire.",
      type: "FIX",
      version: "2.0.5",
      isPublished: true,
      publishedAt: new Date("2026-01-10"),
    },
    {
      title: "Recherche SIV améliorée",
      bodyMarkdown: "La recherche SIV affiche désormais la photo du véhicule et plus d'informations techniques.",
      type: "FEATURE",
      version: "2.0.4",
      isPublished: true,
      publishedAt: new Date("2026-01-05"),
    },
    {
      title: "Correction signature mobile",
      bodyMarkdown: "Résolution d'un problème de signature sur certains appareils iOS.",
      type: "FIX",
      version: "2.0.3",
      isPublished: true,
      publishedAt: new Date("2025-12-28"),
    },
    {
      title: "Mise à jour politique de confidentialité",
      bodyMarkdown: "Mise à jour des mentions légales conformément aux nouvelles réglementations.",
      type: "LEGAL",
      version: "2.0.2",
      isPublished: true,
      publishedAt: new Date("2025-12-20"),
    },
  ];

  for (const entry of changelog) {
    const existing = await prisma.changelogEntry.findFirst({ 
      where: { title: entry.title } 
    });
    if (!existing) {
      await prisma.changelogEntry.create({
        data: {
          ...entry,
          createdByUserId: adminId,
        },
      });
    }
  }
  console.log(`  ✓ ${changelog.length} changelog entries created`);

  console.log("\n✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
