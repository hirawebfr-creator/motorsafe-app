/**
 * KNOWLEDGE-BASE-01: Seed KB data with categories and articles
 * Run with: npx ts-node scripts/seed-kb.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Signature", slug: "signature", description: "Signature électronique et documents", sortOrder: 1 },
  { name: "Paiement", slug: "paiement", description: "Paiement et facturation Stripe", sortOrder: 2 },
  { name: "Documents", slug: "documents", description: "PDF, exports et archivage", sortOrder: 3 },
  { name: "Litige / Assurance", slug: "litige-assurance", description: "Gestion des litiges et dossiers assurance", sortOrder: 4 },
  { name: "Compte / Accès", slug: "compte-acces", description: "Gestion du compte, équipe et accès", sortOrder: 5 },
];

const ARTICLES = [
  // Signature
  {
    categorySlug: "signature",
    title: "Le client ne reçoit pas l'email de signature",
    slug: "email-signature-non-recu",
    tags: ["email", "signature", "spam"],
    bodyMarkdown: `# Le client ne reçoit pas l'email de signature

## Causes possibles

1. **L'email est dans les spams** — Demandez au client de vérifier son dossier spam/courrier indésirable
2. **Adresse email incorrecte** — Vérifiez l'adresse email saisie dans la fiche client
3. **Boîte mail pleine** — Le client doit libérer de l'espace

## Solutions

### 1. Renvoyer l'email de signature

Dans la fiche intervention, cliquez sur le bouton **"Renvoyer signature"** pour envoyer à nouveau l'email.

### 2. Utiliser le QR Code

Si l'email ne fonctionne pas, utilisez le **QR Code** :
- Affichez le QR Code depuis l'intervention
- Le client scanne avec son téléphone
- Il peut signer directement sans email

### 3. Vérifier l'adresse email

Modifiez l'adresse email du client si nécessaire et renvoyez l'email.

## Conseils

- Demandez toujours au client de vérifier ses spams
- Ajoutez **noreply@safemotor.fr** aux contacts autorisés`,
  },
  {
    categorySlug: "signature",
    title: "Comment faire signer sur téléphone avec le QR Code",
    slug: "signature-qr-code",
    tags: ["signature", "qr", "mobile"],
    bodyMarkdown: `# Signature sur téléphone via QR Code

## Quand utiliser le QR Code ?

Le QR Code est idéal quand :
- Le client est présent au garage
- L'email de signature ne fonctionne pas
- Vous voulez une signature immédiate

## Étapes

### 1. Générer le QR Code

Dans l'intervention, cliquez sur **"Demander signature"** puis **"Afficher QR Code"**.

### 2. Présenter au client

Montrez le QR Code au client sur votre écran ou imprimez-le.

### 3. Le client scanne

Le client scanne le QR Code avec l'appareil photo de son téléphone. Cela ouvre automatiquement la page de signature.

### 4. Signature

Le client :
- Lit le document
- Signe avec son doigt
- Valide

## Avantages

- **Instantané** : pas besoin d'attendre l'email
- **Universel** : fonctionne sur tous les smartphones
- **Traçable** : preuve de signature complète`,
  },
  // Paiement
  {
    categorySlug: "paiement",
    title: "Paiement facture via lien Stripe",
    slug: "paiement-lien-stripe",
    tags: ["paiement", "stripe", "facture"],
    bodyMarkdown: `# Paiement par lien Stripe

## Fonctionnement

SafeMotor génère un lien de paiement sécurisé via Stripe pour chaque facture.

## Envoyer le lien de paiement

1. Ouvrez la facture
2. Cliquez sur **"Envoyer lien de paiement"**
3. Le client reçoit un email avec le lien sécurisé
4. Il paie par carte bancaire

## Moyens de paiement acceptés

- Cartes bancaires (Visa, Mastercard, etc.)
- Apple Pay / Google Pay
- Virements SEPA (selon configuration)

## Suivi des paiements

Le statut de la facture se met à jour automatiquement :
- **En attente** : pas encore payée
- **Payée** : paiement confirmé

## Questions fréquentes

### Le paiement a échoué
- Vérifiez que le client a suffisamment de fonds
- Demandez-lui d'essayer une autre carte

### Je veux un paiement en plusieurs fois
Cette fonctionnalité n'est pas encore disponible. Créez plusieurs factures si nécessaire.`,
  },
  // Documents
  {
    categorySlug: "documents",
    title: "Exporter un dossier complet (assurance-ready)",
    slug: "export-dossier-assurance",
    tags: ["export", "assurance", "pdf", "zip"],
    bodyMarkdown: `# Export dossier assurance-ready

## Contenu du dossier

Le ZIP d'export contient :
- **Fiche intervention PDF** complète
- **Photos / pièces jointes**
- **PV de restitution** (si signé)
- **OR signé** (si disponible)
- **Chronologie des événements**

## Comment exporter

1. Ouvrez l'intervention
2. Cliquez sur **"Exporter dossier"**
3. Sélectionnez **"Dossier assurance (ZIP)"**
4. Téléchargez le fichier

## Cas litige

Pour les dossiers litige :
1. Ouvrez le litige depuis l'intervention
2. Cliquez sur **"Exporter dossier litige"**
3. Le ZIP inclut les preuves chronologiques

## Format

- Fichiers PDF horodatés
- Métadonnées de traçabilité
- Chaîne de preuves complète`,
  },
  {
    categorySlug: "documents",
    title: "Créer un OR (Ordre de Réparation) / PV de restitution",
    slug: "creer-or-pv-restitution",
    tags: ["or", "pv", "restitution", "ordre"],
    bodyMarkdown: `# Créer un OR ou PV de restitution

## Ordre de Réparation (OR)

L'OR détaille les travaux à effectuer avant le début de l'intervention.

### Création

1. Depuis l'intervention, cliquez sur **"OR"**
2. Vérifiez les lignes de travaux
3. Cliquez **"Générer OR"**
4. Faites signer le client

### Contenu

- Description des travaux prévus
- Montant estimé (si devis accepté)
- Conditions de réparation
- Signature client

## PV de Restitution

Le PV documente l'état du véhicule à la restitution.

### Création

1. Intervention terminée → **"PV Restitution"**
2. Notez l'état du véhicule
3. Ajoutez des photos si nécessaire
4. Faites signer le client

### Pourquoi c'est important ?

- **Protection juridique** : preuve de l'état à la sortie
- **Litige** : référence en cas de contestation
- **Qualité** : satisfaction client documentée`,
  },
  // Litige / Assurance
  {
    categorySlug: "litige-assurance",
    title: "Conservation des données (10 ans / 10 ans / 12 mois)",
    slug: "conservation-donnees-rgpd",
    tags: ["rgpd", "conservation", "donnees", "legal"],
    bodyMarkdown: `# Conservation des données

## Durées légales

SafeMotor respecte les durées de conservation légales :

| Type de données | Durée | Raison |
|-----------------|-------|--------|
| Documents signés | **10 ans** | Code civil (preuve) |
| Factures/devis | **10 ans** | Code de commerce |
| Données opérationnelles | **12 mois** | RGPD (minimisation) |

## Paramétrage

Vous pouvez ajuster ces durées dans **Paramètres > Rétention des données**.

## Purge automatique

- Les données sont purgées automatiquement après expiration
- Un job CRON s'exécute quotidiennement
- Les admins sont notifiés avant purge

## Droits RGPD

Les clients peuvent demander :
- **Export** de leurs données
- **Anonymisation** (si hors période légale)

Ces fonctions sont accessibles depuis la fiche client.`,
  },
  // Compte / Accès
  {
    categorySlug: "compte-acces",
    title: "Ajouter le logo de votre garage",
    slug: "ajouter-logo-garage",
    tags: ["logo", "branding", "personnalisation"],
    bodyMarkdown: `# Ajouter le logo du garage

## Pourquoi ?

Votre logo apparaît sur :
- Les devis et factures PDF
- Les emails envoyés aux clients
- La page de signature

## Comment ajouter

1. Allez dans **Mon garage**
2. Section **Branding**
3. Cliquez sur **"Changer le logo"**
4. Sélectionnez votre fichier

## Formats acceptés

- **PNG** (recommandé, fond transparent)
- **JPG/JPEG**
- Taille max : 2 Mo
- Dimensions idéales : 400x200 px

## Conseils

- Utilisez un logo avec fond transparent (PNG)
- Préférez un format horizontal
- Vérifiez le rendu sur un PDF test`,
  },
  {
    categorySlug: "compte-acces",
    title: "Gérer les rôles et accès de l'équipe",
    slug: "gerer-roles-equipe",
    tags: ["equipe", "roles", "permissions", "utilisateurs"],
    bodyMarkdown: `# Gestion des rôles équipe

## Rôles disponibles

| Rôle | Accès |
|------|-------|
| **Propriétaire** | Tout accès, facturation, paramètres |
| **Chef d'atelier** | Interventions, équipe, statistiques |
| **Mécanicien** | Interventions, véhicules |
| **Réception** | Clients, planning, devis |
| **Lecture seule** | Consultation uniquement |

## Ajouter un membre

1. **Équipe** > **Inviter**
2. Saisissez l'email
3. Choisissez le rôle
4. Le membre reçoit une invitation

## Modifier un rôle

1. **Équipe** > Cliquez sur le membre
2. Changez le rôle
3. Enregistrez

## Retirer un accès

1. **Équipe** > Cliquez sur le membre
2. **Désactiver l'accès**

L'utilisateur ne pourra plus se connecter mais l'historique est conservé.`,
  },
  {
    categorySlug: "compte-acces",
    title: "Importer des clients ou véhicules par CSV",
    slug: "import-csv",
    tags: ["import", "csv", "migration", "donnees"],
    bodyMarkdown: `# Import CSV

## Fichiers acceptés

- **Clients** : nom, email, téléphone, adresse
- **Véhicules** : immatriculation, marque, modèle, VIN

## Format du fichier

Le fichier doit être en **CSV** (séparateur virgule ou point-virgule).

### Exemple clients
\`\`\`
nom,email,telephone
Jean Dupont,jean@example.com,0612345678
Marie Martin,marie@example.com,0698765432
\`\`\`

### Exemple véhicules
\`\`\`
immatriculation,marque,modele,annee
AA-123-BB,Renault,Clio,2020
CC-456-DD,Peugeot,208,2019
\`\`\`

## Étapes

1. Allez dans **Clients** ou **Véhicules**
2. Cliquez **Importer CSV**
3. Sélectionnez le fichier
4. Vérifiez l'aperçu
5. Confirmez l'import

## Rollback

En cas d'erreur, vous pouvez annuler l'import depuis l'historique des imports.`,
  },
  {
    categorySlug: "signature",
    title: "Créer un ticket support",
    slug: "creer-ticket-support",
    tags: ["support", "ticket", "aide"],
    bodyMarkdown: `# Contacter le support SafeMotor

## Depuis l'application

1. Cliquez sur **Support** dans le menu
2. Cliquez **Nouveau ticket**
3. Choisissez la catégorie
4. Décrivez votre problème
5. Envoyez

## Informations utiles à inclure

- **Description précise** du problème
- **Étapes pour reproduire** (si bug)
- **Captures d'écran** (si possible)
- **ID de l'intervention/client** concerné

## Délais de réponse

| Priorité | Délai |
|----------|-------|
| Urgente | 2h |
| Haute | 8h |
| Normale | 24h |
| Basse | 72h |

## Autres canaux

- **WhatsApp** : 06 26 04 57 31
- **Email** : contact@safemotor.fr

Notre équipe répond du lundi au vendredi, 9h-18h.`,
  },
];

async function seedKb() {
  console.log("🌱 Seeding KB categories...");

  // Create categories
  for (const cat of CATEGORIES) {
    await prisma.kbCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
    console.log(`  ✓ Category: ${cat.name}`);
  }

  console.log("\n🌱 Seeding KB articles...");

  // Get category IDs
  const categories = await prisma.kbCategory.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  // Create articles
  for (const art of ARTICLES) {
    const categoryId = categoryMap.get(art.categorySlug);
    if (!categoryId) {
      console.log(`  ✗ Category not found: ${art.categorySlug}`);
      continue;
    }

    await prisma.kbArticle.upsert({
      where: { slug: art.slug },
      update: {
        title: art.title,
        bodyMarkdown: art.bodyMarkdown,
        tags: art.tags,
        categoryId,
      },
      create: {
        title: art.title,
        slug: art.slug,
        bodyMarkdown: art.bodyMarkdown,
        tags: art.tags,
        categoryId,
        isPublished: true,
      },
    });
    console.log(`  ✓ Article: ${art.title}`);
  }

  console.log("\n✅ KB seed complete!");
}

seedKb()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
