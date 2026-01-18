/**
 * DATA-COMPLIANCE-01: GDPR Processing Registry
 *
 * Registre des traitements de données personnelles
 * Article 30 RGPD - Registre des activités de traitement
 */

export interface DataProcessingEntry {
  id: string;
  purpose: string;
  lawfulBasis: "consent" | "contract" | "legal_obligation" | "legitimate_interest";
  lawfulBasisDetail: string;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: string;
  securityMeasures: string[];
  thirdCountryTransfers: string | null;
}

export interface DpaTemplate {
  title: string;
  version: string;
  lastUpdated: string;
  sections: { heading: string; content: string }[];
}

// ============================================================================
// GDPR PROCESSING REGISTRY (Art. 30)
// ============================================================================

export const PROCESSING_REGISTRY: DataProcessingEntry[] = [
  {
    id: "CLIENT_MANAGEMENT",
    purpose: "Gestion de la relation client (fichier client, véhicules, historique interventions)",
    lawfulBasis: "contract",
    lawfulBasisDetail: "Exécution du contrat de prestation de service (réparation/entretien automobile)",
    dataCategories: [
      "Identité (nom, prénom)",
      "Coordonnées (email, téléphone, adresse)",
      "Données véhicule (immatriculation, VIN, marque, modèle)",
    ],
    dataSubjects: ["Clients particuliers", "Clients professionnels"],
    recipients: ["Équipe du garage", "Prestataire technique (hébergement)"],
    retentionPeriod: "10 ans après dernière intervention (obligation comptable et preuve)",
    securityMeasures: [
      "Chiffrement des données sensibles au repos",
      "Authentification forte obligatoire",
      "Journalisation des accès (AuditLog)",
      "Sauvegardes chiffrées",
    ],
    thirdCountryTransfers: null,
  },
  {
    id: "INVOICING",
    purpose: "Facturation et comptabilité",
    lawfulBasis: "legal_obligation",
    lawfulBasisDetail: "Obligations fiscales et comptables (CGI, Code de commerce)",
    dataCategories: [
      "Identité client",
      "Coordonnées",
      "Numéro de TVA (si applicable)",
      "Historique des transactions",
    ],
    dataSubjects: ["Clients (facturés)"],
    recipients: ["Équipe du garage", "Expert-comptable", "Administration fiscale (sur demande)"],
    retentionPeriod: "10 ans (obligation légale fiscale)",
    securityMeasures: [
      "Numérotation séquentielle inaltérable",
      "Chaîne de preuve (EvidenceChain)",
      "Accès restreint aux rôles OWNER/MANAGER",
    ],
    thirdCountryTransfers: null,
  },
  {
    id: "DIGITAL_SIGNATURES",
    purpose: "Signature électronique des ordres de réparation et documents légaux",
    lawfulBasis: "contract",
    lawfulBasisDetail: "Preuve de l'accord du client pour les travaux (eIDAS, Code civil Art. 1367)",
    dataCategories: [
      "Nom déclaré du signataire",
      "Adresse email",
      "Adresse IP",
      "User-agent navigateur",
      "Horodatage",
    ],
    dataSubjects: ["Clients signataires"],
    recipients: ["Équipe du garage", "Hébergeur technique"],
    retentionPeriod: "10 ans (valeur probante du document signé)",
    securityMeasures: [
      "Hash SHA256 du document avant/après signature",
      "Chaîne de preuve immutable (EvidenceChain)",
      "Snapshot des clauses légales signées",
    ],
    thirdCountryTransfers: null,
  },
  {
    id: "VEHICLE_LOOKUP",
    purpose: "Recherche d'informations véhicule par immatriculation (API SIV)",
    lawfulBasis: "legitimate_interest",
    lawfulBasisDetail: "Faciliter la saisie et réduire les erreurs (intérêt légitime du garage et du client)",
    dataCategories: ["Numéro d'immatriculation", "Données techniques véhicule (cache)"],
    dataSubjects: ["Propriétaires de véhicules (clients potentiels)"],
    recipients: ["API tierce (ApiPlaqueImmatriculation)"],
    retentionPeriod: "Cache : 30 jours / Logs : 12 mois",
    securityMeasures: ["Quota par garage", "Journalisation des appels", "Données anonymisées dans les logs"],
    thirdCountryTransfers: "API hébergée en France",
  },
  {
    id: "AUTHENTICATION",
    purpose: "Authentification et gestion des sessions utilisateur",
    lawfulBasis: "contract",
    lawfulBasisDetail: "Sécurisation de l'accès au service (contrat d'utilisation)",
    dataCategories: ["Email", "Mot de passe (hashé)", "Tokens de session"],
    dataSubjects: ["Utilisateurs (équipe garage)"],
    recipients: ["Hébergeur technique"],
    retentionPeriod: "Sessions : 30 jours après expiration / Comptes : durée du contrat + 1 an",
    securityMeasures: [
      "Hashage bcrypt des mots de passe",
      "Tokens JWT signés",
      "Rate limiting des tentatives",
    ],
    thirdCountryTransfers: null,
  },
  {
    id: "NOTIFICATIONS",
    purpose: "Envoi de notifications et rappels (email, app)",
    lawfulBasis: "contract",
    lawfulBasisDetail: "Communication nécessaire à l'exécution du service",
    dataCategories: ["Email", "Contenu de notification"],
    dataSubjects: ["Clients", "Utilisateurs"],
    recipients: ["Service email (Resend)"],
    retentionPeriod: "12 mois",
    securityMeasures: ["TLS pour envoi email", "Pas de stockage du contenu sensible"],
    thirdCountryTransfers: "Resend (US) - Clauses contractuelles types",
  },
  {
    id: "ANALYTICS",
    purpose: "Suivi d'usage et amélioration du service",
    lawfulBasis: "legitimate_interest",
    lawfulBasisDetail: "Amélioration de l'expérience utilisateur",
    dataCategories: ["Pages vues", "Actions utilisateur (anonymisées)", "Erreurs techniques"],
    dataSubjects: ["Utilisateurs"],
    recipients: ["Sentry (monitoring)", "PostHog (analytics)"],
    retentionPeriod: "90 jours (Sentry) / 12 mois (PostHog)",
    securityMeasures: ["Pas de PII dans les events", "IP anonymisée"],
    thirdCountryTransfers: "Sentry/PostHog (US) - Clauses contractuelles types",
  },
];

// ============================================================================
// DPA TEMPLATE (Data Processing Agreement)
// ============================================================================

export const DPA_TEMPLATE: DpaTemplate = {
  title: "Contrat de Sous-Traitance de Données Personnelles (DPA)",
  version: "1.0",
  lastUpdated: "2025-01-15",
  sections: [
    {
      heading: "1. Objet",
      content: `Le présent contrat définit les conditions dans lesquelles le Sous-traitant 
s'engage à effectuer pour le compte du Responsable de traitement les opérations 
de traitement de données à caractère personnel décrites ci-après, dans le respect 
du Règlement (UE) 2016/679 du 27 avril 2016 (RGPD).`,
    },
    {
      heading: "2. Description du traitement",
      content: `Le Sous-traitant est autorisé à traiter pour le compte du Responsable de 
traitement les données à caractère personnel nécessaires pour fournir le 
service de gestion de garage automobile, incluant :
- Gestion des clients et véhicules
- Facturation et devis
- Signature électronique de documents
- Envoi de notifications`,
    },
    {
      heading: "3. Durée",
      content: `Le présent contrat prend effet à compter de la date de souscription au 
service et reste en vigueur tant que le Sous-traitant traite des données 
pour le compte du Responsable de traitement.`,
    },
    {
      heading: "4. Obligations du Sous-traitant",
      content: `Le Sous-traitant s'engage à :
a) Traiter les données uniquement sur instruction documentée du Responsable
b) Assurer la confidentialité des données
c) Prendre les mesures de sécurité appropriées (Art. 32 RGPD)
d) Ne pas faire appel à un autre sous-traitant sans autorisation écrite
e) Assister le Responsable pour répondre aux demandes d'exercice des droits
f) Supprimer ou restituer les données à la fin du contrat
g) Mettre à disposition les informations nécessaires aux audits`,
    },
    {
      heading: "5. Sous-traitants ultérieurs",
      content: `Liste des sous-traitants ultérieurs autorisés :
- Vercel Inc. (hébergement) - USA - Clauses contractuelles types
- Resend (email) - USA - Clauses contractuelles types
- Stripe Inc. (paiement) - USA - Clauses contractuelles types
- Sentry (monitoring) - USA - Clauses contractuelles types`,
    },
    {
      heading: "6. Transferts hors UE",
      content: `Les transferts de données vers des pays tiers sont encadrés par les 
Clauses Contractuelles Types de la Commission Européenne (Décision 2021/914).`,
    },
    {
      heading: "7. Sécurité",
      content: `Le Sous-traitant met en œuvre les mesures suivantes :
- Chiffrement des données au repos et en transit (TLS 1.3)
- Contrôle d'accès par authentification forte
- Journalisation des accès (audit trail)
- Sauvegardes chiffrées quotidiennes
- Tests de sécurité réguliers`,
    },
    {
      heading: "8. Notification des violations",
      content: `En cas de violation de données, le Sous-traitant notifie le Responsable 
dans les meilleurs délais et au plus tard 48 heures après en avoir pris 
connaissance, avec les informations requises par l'article 33 du RGPD.`,
    },
    {
      heading: "9. Exercice des droits",
      content: `Le Sous-traitant fournit les outils permettant au Responsable de répondre 
aux demandes d'exercice des droits des personnes concernées :
- Droit d'accès : Export des données (JSON)
- Droit de rectification : Interface d'édition
- Droit à l'effacement : Anonymisation des données client
- Droit à la portabilité : Export au format standard`,
    },
    {
      heading: "10. Fin du contrat",
      content: `À la fin du contrat, le Sous-traitant :
- Restitue les données sur demande (format JSON)
- Supprime les données après un délai de 30 jours
- Fournit une attestation de suppression

Les données soumises à obligation légale de conservation (factures, etc.) 
sont conservées pour la durée légale requise.`,
    },
  ],
};

// ============================================================================
// RIGHTS EXERCISE INFORMATION
// ============================================================================

export const GDPR_RIGHTS = {
  title: "Vos droits sur vos données personnelles",
  intro: `Conformément au RGPD, vous disposez des droits suivants concernant vos 
données personnelles. Pour les exercer, contactez le garage qui détient vos données.`,
  rights: [
    {
      name: "Droit d'accès",
      article: "Art. 15 RGPD",
      description: "Obtenir une copie de toutes les données vous concernant",
      howTo: "Demandez un export de vos données au garage",
    },
    {
      name: "Droit de rectification",
      article: "Art. 16 RGPD",
      description: "Corriger des données inexactes ou incomplètes",
      howTo: "Contactez le garage pour mettre à jour vos informations",
    },
    {
      name: "Droit à l'effacement",
      article: "Art. 17 RGPD",
      description: "Demander la suppression de vos données",
      howTo: "Demandez l'anonymisation de votre fiche client",
      limitations: "Ne s'applique pas aux données de facturation (obligation légale 10 ans)",
    },
    {
      name: "Droit à la portabilité",
      article: "Art. 20 RGPD",
      description: "Récupérer vos données dans un format structuré",
      howTo: "Demandez un export JSON de vos données",
    },
    {
      name: "Droit d'opposition",
      article: "Art. 21 RGPD",
      description: "S'opposer au traitement pour motifs légitimes",
      howTo: "Contactez le garage pour faire valoir ce droit",
    },
    {
      name: "Droit de réclamation",
      article: "Art. 77 RGPD",
      description: "Déposer une plainte auprès de la CNIL",
      howTo: "www.cnil.fr",
    },
  ],
};

// ============================================================================
// CONSENT CONFIGURATION
// ============================================================================

export interface ConsentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  defaultValue: boolean;
}

export const CONSENT_TYPES: ConsentType[] = [
  {
    id: "ESSENTIAL",
    name: "Cookies essentiels",
    description: "Nécessaires au fonctionnement du site (session, sécurité)",
    required: true,
    defaultValue: true,
  },
  {
    id: "ANALYTICS",
    name: "Cookies analytiques",
    description: "Nous aident à améliorer le service (usage anonymisé)",
    required: false,
    defaultValue: false,
  },
  {
    id: "MARKETING_EMAIL",
    name: "Communications marketing",
    description: "Recevoir des offres et actualités par email",
    required: false,
    defaultValue: false,
  },
  {
    id: "SMS_NOTIFICATIONS",
    name: "Notifications SMS",
    description: "Recevoir des rappels par SMS (RDV, véhicule prêt)",
    required: false,
    defaultValue: false,
  },
];
