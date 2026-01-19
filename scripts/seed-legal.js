/**
 * seed-legal.js
 * Seeds default legal documents, company profile, subprocessors, and intervention types
 * Run: node scripts/seed-legal.js
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Hash function for document versioning
function sha256(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

// Company Profile
const COMPANY_PROFILE = {
  companyName: "SafeMotor",
  legalForm: "Entrepreneur Individuel (EI)",
  address: "France",
  postalCode: "00000",
  city: "France",
  country: "France",
  siret: "90394144100029",
  rcs: null,
  vatNumber: null,
  shareCapital: null,
  email: "contact@safemotor.fr",
  phone: null,
  whatsapp: null,
  publicationDirector: "Responsable SafeMotor",
  hostingProvider: "Vercel Inc.",
  hostingAddress: "340 S Lemon Ave #4133, Walnut, CA 91789, USA",
  hostingUrl: "https://vercel.com",
};

// Subprocessors for GDPR DPA
const SUBPROCESSORS = [
  {
    name: "Vercel Inc.",
    purpose: "Hébergement de l'application web",
    region: "USA (EU-US Data Privacy Framework)",
    linkUrl: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Prisma / Supabase",
    purpose: "Base de données PostgreSQL managée",
    region: "UE (Frankfurt)",
    linkUrl: "https://supabase.com/privacy",
  },
  {
    name: "Stripe Inc.",
    purpose: "Traitement des paiements et abonnements",
    region: "USA (SCCs + DPF)",
    linkUrl: "https://stripe.com/privacy",
  },
  {
    name: "Resend",
    purpose: "Envoi d'emails transactionnels",
    region: "USA (SCCs)",
    linkUrl: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "Sentry",
    purpose: "Monitoring des erreurs et performances",
    region: "USA (SCCs + DPF)",
    linkUrl: "https://sentry.io/privacy/",
  },
];

// Intervention Types
const INTERVENTION_TYPES = [
  { key: "E85_REPROG", label: "Conversion E85 par reprogrammation moteur" },
  { key: "E85_BOX", label: "Conversion E85 par boîtier additionnel" },
  { key: "ECU_REMAP", label: "Reprogrammation ECU / Stage" },
  { key: "DIAG", label: "Diagnostic électronique" },
  { key: "MECH", label: "Réparation mécanique générale" },
  { key: "OTHER", label: "Autre intervention" },
];

// Legal Documents with content
const LEGAL_DOCS = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    scope: "PUBLIC",
    content: `# Mentions légales

## Éditeur du site

**SafeMotor**  
Entrepreneur Individuel (EI)  
SIRET : 903 941 441 00029  
Date de création : 05/10/2021

Email : contact@safemotor.fr

## Directeur de la publication

Le directeur de la publication est le responsable légal de SafeMotor.

## Hébergement

Le site est hébergé par :  
**Vercel Inc.**  
340 S Lemon Ave #4133  
Walnut, CA 91789, USA  
Email : privacy@vercel.com

## Propriété intellectuelle

L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.

## Données personnelles

Pour toute information concernant le traitement de vos données personnelles, veuillez consulter notre [Politique de confidentialité](/politique-confidentialite).

## Cookies

Ce site utilise des cookies strictement nécessaires au fonctionnement du service. Aucun cookie de tracking publicitaire n'est utilisé.
`,
  },
  {
    slug: "cgu",
    title: "Conditions Générales d'Utilisation",
    scope: "PUBLIC",
    content: `# Conditions Générales d'Utilisation

*Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR")}*

## 1. Objet

Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation de la plateforme SafeMotor (ci-après « le Service »).

## 2. Acceptation des CGU

L'accès et l'utilisation du Service impliquent l'acceptation sans réserve des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.

## 3. Description du Service

SafeMotor est une plateforme SaaS destinée aux professionnels de l'automobile permettant :
- La gestion des clients et véhicules
- La création et signature électronique de devis et ordres de réparation
- La facturation et le suivi des interventions
- L'archivage sécurisé des documents

## 4. Accès au Service

### 4.1 Création de compte
L'accès au Service nécessite la création d'un compte utilisateur. Vous vous engagez à fournir des informations exactes et à les maintenir à jour.

### 4.2 Sécurité du compte
Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées depuis votre compte.

## 5. Obligations de l'utilisateur

En utilisant le Service, vous vous engagez à :
- Respecter la législation en vigueur
- Ne pas utiliser le Service à des fins illicites
- Ne pas tenter de compromettre la sécurité du Service
- Respecter les droits de propriété intellectuelle

## 6. Propriété intellectuelle

Tous les éléments du Service (logos, textes, logiciels, etc.) sont protégés par le droit de la propriété intellectuelle et restent la propriété exclusive de SafeMotor.

## 7. Limitation de responsabilité

SafeMotor met tout en œuvre pour assurer la disponibilité et la fiabilité du Service, mais ne peut garantir un fonctionnement sans interruption. SafeMotor ne saurait être tenu responsable des dommages indirects résultant de l'utilisation du Service.

## 8. Modification des CGU

SafeMotor se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou notification dans l'application.

## 9. Droit applicable

Les présentes CGU sont soumises au droit français. Tout litige sera de la compétence exclusive des tribunaux français.

## 10. Contact

Pour toute question relative aux présentes CGU :  
Email : contact@safemotor.fr
`,
  },
  {
    slug: "cgv",
    title: "Conditions Générales de Vente",
    scope: "PUBLIC",
    content: `# Conditions Générales de Vente

*Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR")}*

## 1. Préambule

Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre SafeMotor (SIRET : 903 941 441 00029) et ses clients professionnels pour les services d'abonnement à la plateforme.

## 2. Services proposés

SafeMotor propose des abonnements mensuels ou annuels donnant accès à :

### Plan STARTER (Gratuit)
- 1 utilisateur
- 30 clients maximum
- 10 véhicules maximum
- Signature électronique incluse

### Plan PRO
- Utilisateurs illimités
- Clients et véhicules illimités
- Clauses personnalisables
- Personnalisation de la marque
- Support prioritaire

## 3. Prix et paiement

### 3.1 Tarification
Les prix sont affichés en euros HT. La TVA applicable est celle en vigueur au jour de la facturation.

### 3.2 Modalités de paiement
Le paiement s'effectue par carte bancaire via notre prestataire sécurisé Stripe. Les abonnements sont facturés à l'avance (mensuellement ou annuellement).

### 3.3 Facturation
Une facture est émise automatiquement à chaque renouvellement et accessible depuis votre espace client.

## 4. Durée et résiliation

### 4.1 Durée
L'abonnement est conclu pour la durée choisie (mensuelle ou annuelle) et se renouvelle par tacite reconduction.

### 4.2 Résiliation
Vous pouvez résilier votre abonnement à tout moment depuis votre espace client. La résiliation prend effet à la fin de la période en cours.

## 5. Droit de rétractation

Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux services pleinement exécutés avant la fin du délai de rétractation.

## 6. Garanties et responsabilités

SafeMotor s'engage à fournir un service conforme à sa description. En cas de dysfonctionnement, notre équipe technique intervient dans les meilleurs délais.

## 7. Protection des données

Le traitement des données personnelles est effectué conformément à notre [Politique de confidentialité](/politique-confidentialite) et au RGPD.

## 8. Litiges

En cas de litige, une solution amiable sera recherchée avant tout recours judiciaire. À défaut, les tribunaux français seront compétents.

## 9. Contact

Service commercial : contact@safemotor.fr
`,
  },
  {
    slug: "politique-confidentialite",
    title: "Politique de confidentialité",
    scope: "PUBLIC",
    content: `# Politique de confidentialité

*Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR")}*

## 1. Responsable du traitement

**SafeMotor**  
Entrepreneur Individuel  
SIRET : 903 941 441 00029  
Email : contact@safemotor.fr

## 2. Données collectées

### 2.1 Données d'identification
- Nom, prénom, email
- Numéro de téléphone (optionnel)
- Adresse professionnelle

### 2.2 Données de véhicules
- Immatriculation
- Marque, modèle, année
- Numéro VIN

### 2.3 Données techniques
- Adresse IP (hashée pour la signature)
- Logs de connexion
- Données de navigation

## 3. Finalités et bases légales

| Finalité | Base légale | Durée de conservation |
|----------|-------------|----------------------|
| Gestion du compte client | Exécution du contrat | Durée du compte + 3 ans |
| Facturation | Obligation légale | 10 ans |
| Signatures électroniques | Exécution du contrat + obligation légale | 10 ans |
| Amélioration du service | Intérêt légitime | 12 mois |
| Sécurité et prévention fraude | Intérêt légitime | 12 mois |

## 4. Destinataires des données

Vos données peuvent être transmises à :
- Nos sous-traitants techniques (voir liste ci-dessous)
- Les autorités en cas d'obligation légale

### Sous-traitants autorisés
La liste complète de nos sous-traitants est disponible en bas de cette page.

## 5. Vos droits (RGPD)

Conformément au RGPD, vous disposez des droits suivants :

- **Accès** : Obtenir une copie de vos données
- **Rectification** : Corriger des données inexactes
- **Effacement** : Supprimer vos données (sauf obligation légale)
- **Limitation** : Restreindre le traitement
- **Portabilité** : Recevoir vos données dans un format lisible
- **Opposition** : Vous opposer au traitement

Pour exercer ces droits : contact@safemotor.fr

## 6. Transferts hors UE

Certains de nos sous-traitants sont situés aux États-Unis. Ces transferts sont encadrés par :
- Le EU-US Data Privacy Framework
- Les Clauses Contractuelles Types (SCCs)

## 7. Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :
- Chiffrement en transit (TLS 1.3)
- Chiffrement au repos (AES-256-GCM)
- Contrôle d'accès strict
- Journalisation des accès

## 8. Cookies

Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement du service (authentification, préférences). Aucun cookie publicitaire n'est utilisé.

## 9. Réclamation

Vous pouvez introduire une réclamation auprès de la CNIL :  
https://www.cnil.fr/fr/plaintes

## 10. Contact DPO

Pour toute question relative à la protection de vos données :  
Email : contact@safemotor.fr  
Objet : [RGPD] Votre demande
`,
  },
  {
    slug: "dpa",
    title: "Accord de Traitement des Données (DPA)",
    scope: "APP",
    content: `# Accord de Traitement des Données (DPA)

*Data Processing Agreement conforme au RGPD - Article 28*

*Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR")}*

## 1. Parties

- **Responsable du traitement** : Le client professionnel utilisant SafeMotor (« le Garage »)
- **Sous-traitant** : SafeMotor, Entrepreneur Individuel, SIRET 903 941 441 00029 (« SafeMotor »)

## 2. Objet

Le présent accord définit les conditions dans lesquelles SafeMotor, en qualité de sous-traitant, traite les données personnelles pour le compte du Garage dans le cadre de la fourniture des services SafeMotor.

## 3. Nature et finalité du traitement

SafeMotor traite les données personnelles uniquement pour :
- La gestion des clients du Garage
- La création et l'archivage de documents (devis, ordres de réparation, factures)
- La signature électronique sécurisée
- Le support technique

## 4. Types de données traitées

- Données d'identification des clients (nom, prénom, email, téléphone)
- Données de véhicules (immatriculation, VIN, marque, modèle)
- Données de signature (IP hashée, timestamp, empreinte du document)

## 5. Durée du traitement

Le traitement est effectué pendant toute la durée de l'abonnement et les données sont conservées selon les durées légales après résiliation (10 ans pour les documents comptables et signatures).

## 6. Obligations de SafeMotor

SafeMotor s'engage à :

### 6.1 Instructions
Traiter les données uniquement sur instruction documentée du Garage.

### 6.2 Confidentialité
S'assurer que les personnes autorisées à traiter les données sont soumises à une obligation de confidentialité.

### 6.3 Sécurité
Mettre en œuvre les mesures techniques et organisationnelles appropriées :
- Chiffrement AES-256-GCM au repos
- TLS 1.3 en transit
- Contrôle d'accès basé sur les rôles
- Journalisation des accès

### 6.4 Sous-traitance ultérieure
Ne pas recruter un autre sous-traitant sans l'autorisation préalable écrite du Garage. La liste des sous-traitants autorisés est disponible sur la page Politique de confidentialité.

### 6.5 Droits des personnes
Aider le Garage à répondre aux demandes d'exercice des droits des personnes concernées.

### 6.6 Notification de violation
Notifier le Garage dans les 72 heures suivant la découverte d'une violation de données.

### 6.7 Audit
Mettre à disposition les informations nécessaires pour démontrer le respect des obligations et permettre la réalisation d'audits.

## 7. Obligations du Garage

Le Garage s'engage à :
- Fournir des instructions licites
- Informer ses clients du traitement de leurs données
- Disposer des bases légales nécessaires

## 8. Sous-traitants ultérieurs

La liste des sous-traitants autorisés est maintenue sur notre page Politique de confidentialité. SafeMotor informera le Garage de tout changement prévu.

## 9. Transferts hors UE

Les transferts vers des pays tiers sont encadrés par :
- Le EU-US Data Privacy Framework (pour les sous-traitants certifiés)
- Les Clauses Contractuelles Types adoptées par la Commission européenne

## 10. Sort des données en fin de contrat

À l'issue du contrat, SafeMotor :
- Supprime les données opérationnelles dans un délai de 90 jours
- Conserve les données soumises à obligation légale (comptabilité, preuves de signature)
- Fournit une exportation des données sur demande

## 11. Responsabilité

La responsabilité de SafeMotor est limitée au montant des abonnements payés sur les 12 derniers mois.

## 12. Contact

DPO SafeMotor : contact@safemotor.fr

---

*Cet accord fait partie intégrante des Conditions Générales de Vente.*
`,
  },
];

// Default Clause Sets for intervention types
const DEFAULT_CLAUSES = {
  E85_REPROG: `## Clauses spécifiques - Conversion E85 par reprogrammation

### 1. Nature de l'intervention
Le client reconnaît avoir été informé que l'intervention consiste en une modification du calculateur moteur (ECU) pour permettre l'utilisation de carburant E85.

### 2. Compatibilité véhicule
Le garage a vérifié la compatibilité théorique du véhicule avec la conversion E85. Cependant, le client reconnaît que des incompatibilités spécifiques peuvent exister.

### 3. Garantie constructeur
Le client est informé que cette modification peut affecter la garantie constructeur du véhicule.

### 4. Responsabilité
Le garage ne pourra être tenu responsable des dommages indirects liés à l'utilisation du véhicule après modification.

### 5. Homologation
Cette conversion n'est pas soumise à homologation en France. Le véhicule reste conforme au Code de la route.
`,
  E85_BOX: `## Clauses spécifiques - Conversion E85 par boîtier

### 1. Nature de l'intervention
Installation d'un boîtier additionnel homologué pour la conversion au carburant E85.

### 2. Homologation
Le boîtier installé est conforme à l'arrêté du 30 novembre 2017. Un certificat de conformité sera fourni.

### 3. Carte grise
Le client devra effectuer la modification de sa carte grise dans un délai d'un mois (mention FE).

### 4. Garantie boîtier
Le boîtier bénéficie d'une garantie fabricant de [X] ans.

### 5. Responsabilité
L'installation est réalisée selon les préconisations du fabricant du boîtier.
`,
  ECU_REMAP: `## Clauses spécifiques - Reprogrammation ECU

### 1. Nature de l'intervention
Modification du calculateur moteur pour optimiser les performances (puissance, couple, consommation).

### 2. Avertissement
Le client reconnaît que cette modification :
- Peut affecter la garantie constructeur
- Peut modifier le comportement du véhicule
- N'est pas réversible sans sauvegarde préalable

### 3. Sauvegarde origine
Une sauvegarde de la cartographie d'origine est conservée par le garage pendant 2 ans.

### 4. Essai routier
Un essai routier sera effectué après l'intervention pour vérifier le bon fonctionnement.
`,
  DIAG: `## Clauses spécifiques - Diagnostic électronique

### 1. Objet
Lecture des codes défaut et analyse du système électronique du véhicule.

### 2. Limites
Le diagnostic fournit des indications mais ne garantit pas l'identification de toutes les pannes.

### 3. Devis complémentaire
Si des réparations sont nécessaires, un devis séparé sera établi.
`,
  MECH: `## Clauses spécifiques - Réparation mécanique

### 1. Pièces détachées
Sauf accord contraire, les pièces remplacées sont des pièces de qualité équivalente à l'origine.

### 2. Garantie pièces
Les pièces neuves bénéficient de la garantie fabricant.

### 3. Restitution des pièces
Sur demande, les pièces remplacées peuvent être restituées au client.

### 4. Délai
Le délai d'intervention indiqué est estimatif et peut varier selon les approvisionnements.
`,
  OTHER: `## Clauses générales

### 1. Description de l'intervention
L'intervention est décrite dans le corps du devis ou de l'ordre de réparation.

### 2. Garantie
L'intervention bénéficie de la garantie légale de conformité.

### 3. Responsabilité
Le garage s'engage à réaliser l'intervention dans les règles de l'art.
`,
};

async function main() {
  console.log("🚀 Seeding legal documents...\n");

  // 1. Create Company Profile
  console.log("📋 Creating company profile...");
  await prisma.companyProfile.upsert({
    where: { id: "singleton" },
    update: COMPANY_PROFILE,
    create: { id: "singleton", ...COMPANY_PROFILE },
  });
  console.log("   ✓ Company profile created\n");

  // 2. Create Subprocessors
  console.log("🔗 Creating subprocessors...");
  for (const sp of SUBPROCESSORS) {
    // Check if exists by name
    const existing = await prisma.subprocessor.findFirst({
      where: { name: sp.name },
    });
    
    if (existing) {
      await prisma.subprocessor.update({
        where: { id: existing.id },
        data: sp,
      });
      console.log(`   ⏭️  ${sp.name} (updated)`);
    } else {
      await prisma.subprocessor.create({
        data: sp,
      });
      console.log(`   ✓ ${sp.name}`);
    }
  }
  console.log("");

  // 3. Create Legal Documents
  console.log("📝 Creating legal documents...");
  for (const doc of LEGAL_DOCS) {
    const existingDoc = await prisma.legalDoc.findUnique({
      where: { slug: doc.slug },
    });

    let legalDoc;
    if (existingDoc) {
      legalDoc = existingDoc;
      console.log(`   ⏭️  ${doc.title} (already exists)`);
    } else {
      legalDoc = await prisma.legalDoc.create({
        data: {
          slug: doc.slug,
          title: doc.title,
          scope: doc.scope,
        },
      });
      console.log(`   ✓ ${doc.title}`);
    }

    // Create version if none exists
    const existingVersion = await prisma.legalDocVersion.findFirst({
      where: { legalDocId: legalDoc.id },
    });

    if (!existingVersion) {
      const contentHash = sha256(doc.content);
      await prisma.legalDocVersion.create({
        data: {
          legalDocId: legalDoc.id,
          versionNumber: 1,
          effectiveAt: new Date(),
          bodyMarkdown: doc.content,
          sha256: contentHash,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
      console.log(`      ✓ Version 1 published`);
    }
  }
  console.log("");

  // 4. Create Intervention Types
  console.log("🔧 Creating intervention types...");
  for (const type of INTERVENTION_TYPES) {
    const existingType = await prisma.interventionTypeRef.findUnique({
      where: { key: type.key },
    });

    let interventionType;
    if (existingType) {
      interventionType = existingType;
      console.log(`   ⏭️  ${type.label} (already exists)`);
    } else {
      interventionType = await prisma.interventionTypeRef.create({
        data: type,
      });
      console.log(`   ✓ ${type.label}`);
    }

    // Create default clause set if none exists
    const existingClause = await prisma.clauseSet.findFirst({
      where: {
        interventionTypeId: interventionType.id,
        garageId: null, // Official template
        isDefault: true,
      },
    });

    if (!existingClause && DEFAULT_CLAUSES[type.key]) {
      const clauseSet = await prisma.clauseSet.create({
        data: {
          interventionTypeId: interventionType.id,
          garageId: null,
          name: `Clauses ${type.label}`,
          isDefault: true,
        },
      });

      const clauseContent = DEFAULT_CLAUSES[type.key];
      const clauseHash = sha256(clauseContent);
      await prisma.clauseSetVersion.create({
        data: {
          clauseSetId: clauseSet.id,
          versionNumber: 1,
          effectiveAt: new Date(),
          bodyMarkdown: clauseContent,
          sha256: clauseHash,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
      console.log(`      ✓ Default clauses created`);
    }
  }
  console.log("");

  console.log("✅ Legal seed complete!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    prisma.$disconnect();
    process.exit(1);
  });
