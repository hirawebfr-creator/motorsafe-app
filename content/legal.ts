/**
 * Legal Clauses & Modules
 * MVP content for signature documents
 */

// === Types ===
export type ClauseLevel = "info" | "important";

export interface LegalClause {
  id: string;
  title: string;
  text: string;
  level: ClauseLevel;
  references: LegalReference[];
}

export interface LegalReference {
  label: string;
  articleRef?: string;
  sourceUrl?: string;
}

export interface LegalModule {
  id: string;
  name: string;
  description: string;
  clauses: LegalClause[];
}

// === CLAUSES DEFINITIONS ===

const CLAUSE_BASE_ACCORD: LegalClause = {
  id: "BASE_ACCORD",
  title: "Accord pour réparation",
  text: "Le client autorise l'établissement à effectuer les travaux décrits sur le présent document. L'acceptation de ce document vaut ordre de réparation et engage les deux parties.",
  level: "important",
  references: [
    { label: "Code de la consommation", articleRef: "Art. L111-1", sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226876" },
  ],
};

const CLAUSE_BASE_ESSAI: LegalClause = {
  id: "BASE_ESSAI",
  title: "Essais routiers",
  text: "Le client autorise l'établissement à effectuer les essais routiers nécessaires au diagnostic et à la vérification des réparations, dans le respect du code de la route.",
  level: "info",
  references: [],
};

const CLAUSE_BASE_DEVIS: LegalClause = {
  id: "BASE_DEVIS",
  title: "Devis et facturation",
  text: "Le montant estimé est indicatif. En cas de dépassement supérieur à 10%, l'établissement contactera le client pour accord avant de poursuivre les travaux.",
  level: "info",
  references: [
    { label: "Code de la consommation", articleRef: "Art. L111-3", sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226872" },
  ],
};

const CLAUSE_BASE_PIECES: LegalClause = {
  id: "BASE_PIECES",
  title: "Pièces détachées",
  text: "Sauf demande contraire du client, l'établissement peut utiliser des pièces de rechange d'origine ou de qualité équivalente. Les pièces remplacées restent la propriété du client sur demande.",
  level: "info",
  references: [
    { label: "Loi Hamon", articleRef: "Art. L121-117", sourceUrl: "https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000028738652" },
  ],
};

const CLAUSE_INSURANCE_CHANGE: LegalClause = {
  id: "INSURANCE_CHANGE",
  title: "Déclaration assurance obligatoire",
  text: "Toute modification technique du véhicule (reprogrammation, conversion énergie, modification moteur) doit être déclarée à votre assureur. Le défaut de déclaration peut entraîner la nullité de votre contrat d'assurance.",
  level: "important",
  references: [
    { label: "Code des assurances", articleRef: "Art. L113-2", sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006792329" },
    { label: "Code des assurances", articleRef: "Art. L113-8", sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006792335" },
  ],
};

const CLAUSE_E85_HOMOLOGATION: LegalClause = {
  id: "E85_HOMOLOGATION",
  title: "Conversion E85 - Homologation",
  text: "L'installation d'un boîtier de conversion E85 homologué permet l'usage légal du superéthanol. Le boîtier doit être installé par un professionnel agréé et faire l'objet d'une homologation individuelle.",
  level: "important",
  references: [
    { label: "Arrêté du 30 novembre 2017", articleRef: "Boîtiers E85", sourceUrl: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000036093982" },
    { label: "Service-Public.fr", articleRef: "Conversion E85", sourceUrl: "https://www.service-public.fr/particuliers/vosdroits/F35556" },
  ],
};

const CLAUSE_E85_CARTO: LegalClause = {
  id: "E85_CARTO",
  title: "Conversion E85 - Reprogrammation cartographique",
  text: "La reprogrammation moteur pour compatibilité E85 (sans boîtier) constitue une modification technique non homologuée. Cette modification peut affecter la garantie constructeur et doit impérativement être déclarée à l'assureur.",
  level: "important",
  references: [
    { label: "Code de la route", articleRef: "Art. R321-16", sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842105" },
  ],
};

const CLAUSE_REPROG_PERF: LegalClause = {
  id: "REPROG_PERF",
  title: "Reprogrammation moteur - Performance",
  text: "La reprogrammation moteur modifie les paramètres d'origine du véhicule. Cette modification peut affecter la garantie constructeur, les émissions polluantes et la conformité au contrôle technique. Elle doit être déclarée à l'assureur.",
  level: "important",
  references: [
    { label: "Code de la route", articleRef: "Art. R318-2", sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842013" },
  ],
};

const CLAUSE_REPROG_ECU: LegalClause = {
  id: "REPROG_ECU",
  title: "Reprogrammation calculateur",
  text: "La modification du calculateur moteur (ECU) est tracée et documentée. Un hash cryptographique des paramètres est conservé pour garantir la traçabilité de l'intervention.",
  level: "info",
  references: [],
};

const CLAUSE_OTHER_MODIF: LegalClause = {
  id: "OTHER_MODIF",
  title: "Modification technique",
  text: "Cette intervention constitue une modification technique du véhicule. Selon la nature des modifications, une nouvelle réception à titre isolé (RTI) peut être nécessaire. Consultez la DREAL de votre département.",
  level: "important",
  references: [
    { label: "Service-Public.fr", articleRef: "RTI", sourceUrl: "https://www.service-public.fr/particuliers/vosdroits/F1478" },
  ],
};

const CLAUSE_GARANTIE: LegalClause = {
  id: "GARANTIE",
  title: "Garantie des travaux",
  text: "Les travaux effectués bénéficient d'une garantie selon les conditions générales de l'établissement. Cette garantie ne s'applique pas en cas de mauvaise utilisation ou de non-respect des préconisations.",
  level: "info",
  references: [
    { label: "Code de la consommation", articleRef: "Art. L217-4 et suivants", sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226849" },
  ],
};

// === MODULES DEFINITIONS ===

export const LEGAL_MODULES: Record<string, LegalModule> = {
  BASE: {
    id: "BASE",
    name: "Socle commun",
    description: "Clauses applicables à toute intervention",
    clauses: [CLAUSE_BASE_ACCORD, CLAUSE_BASE_ESSAI, CLAUSE_BASE_DEVIS, CLAUSE_BASE_PIECES, CLAUSE_GARANTIE],
  },
  E85_BOITIER: {
    id: "E85_BOITIER",
    name: "Conversion E85 (Boîtier)",
    description: "Installation boîtier éthanol homologué",
    clauses: [CLAUSE_E85_HOMOLOGATION],
  },
  E85_CARTO: {
    id: "E85_CARTO",
    name: "Conversion E85 (Reprogrammation)",
    description: "Reprogrammation cartographique E85",
    clauses: [CLAUSE_E85_CARTO],
  },
  REPROG: {
    id: "REPROG",
    name: "Reprogrammation moteur",
    description: "Modification des paramètres calculateur",
    clauses: [CLAUSE_REPROG_PERF, CLAUSE_REPROG_ECU],
  },
  OTHER_MODIF: {
    id: "OTHER_MODIF",
    name: "Modification technique",
    description: "Autres modifications du véhicule",
    clauses: [CLAUSE_OTHER_MODIF],
  },
  INSURANCE_CHANGE: {
    id: "INSURANCE_CHANGE",
    name: "Déclaration assurance",
    description: "Obligation de déclaration à l'assureur",
    clauses: [CLAUSE_INSURANCE_CHANGE],
  },
};

// === LEGACY COMPATIBILITY ===
// Keep old getLegalContent for backward compatibility during migration

type LegalBlock = {
  title: string;
  bullets: string[];
};

const LEGAL_BY_TYPE: Record<string, LegalBlock> = {
  E85: {
    title: "Conversion E85 et obligations professionnelles",
    bullets: [
      "Verifier l'adaptation mecanique avant toute reprogrammation.",
      "Informer le client des changements de consommation et d'entretien.",
      "Documenter les parametres modifies pour la traceabilite atelier.",
    ],
  },
  Reprog: {
    title: "Reprogrammation moteur et responsabilite atelier",
    bullets: [
      "Confirmer l'accord du client avant modification des cartographies.",
      "Conserver le hash et l'historique des revisions pour preuve.",
      "S'assurer que les niveaux de securite constructeur sont respectes.",
    ],
  },
  Diag: {
    title: "Diagnostic et preuve technique",
    bullets: [
      "Tracer les codes erreurs et conditions de test.",
      "Conserver les logs et captures necessaires aux assurances.",
      "Preciser les limites du diagnostic pour eviter toute ambiguite.",
    ],
  },
  Autre: {
    title: "Intervention atelier et cadre de service",
    bullets: [
      "Decrire l'operation de facon claire et horodatee.",
      "Conserver les preuves techniques et les validations client.",
      "Utiliser le dossier PDF comme preuve de bon deroulement.",
    ],
  },
};

const DEFAULT_LEGAL: LegalBlock = {
  title: "Cadre legal & responsabilite",
  bullets: [
    "Documenter chaque intervention pour la traceabilite.",
    "Conserver l'historique des revisions et le hash.",
    "Informer le client des impacts techniques.",
  ],
};

export function getLegalContent(type?: string | null): LegalBlock {
  if (!type) return DEFAULT_LEGAL;
  return LEGAL_BY_TYPE[type] ?? DEFAULT_LEGAL;
}

// ============================================
// WORKSHOP-OPS-01: Repair Order Clauses
// ============================================

export interface RepairOrderClause {
  id: string;
  title: string;
  text: string;
}

const REPAIR_ORDER_CLAUSES: RepairOrderClause[] = [
  {
    id: "RO_ACCORD",
    title: "Accord pour réparation",
    text: "Le client autorise l'établissement à effectuer les travaux décrits sur le présent document. L'acceptation vaut ordre de réparation.",
  },
  {
    id: "RO_DEVIS",
    title: "Estimation et dépassement",
    text: "Le montant estimé est indicatif. En cas de dépassement supérieur à 10%, le client sera contacté pour accord préalable.",
  },
  {
    id: "RO_ESSAI",
    title: "Essais routiers",
    text: "Le client autorise les essais routiers nécessaires au diagnostic et à la vérification des réparations.",
  },
  {
    id: "RO_PIECES",
    title: "Pièces détachées",
    text: "Sauf demande contraire, l'établissement peut utiliser des pièces de qualité équivalente. Les pièces remplacées sont disponibles sur demande.",
  },
  {
    id: "RO_DELAI",
    title: "Délai d'intervention",
    text: "Le délai estimé est donné à titre indicatif et peut être modifié en fonction des constatations techniques.",
  },
  {
    id: "RO_GARDE",
    title: "Garde du véhicule",
    text: "L'établissement assure la garde du véhicule pendant la durée des travaux dans des conditions normales de sécurité.",
  },
  {
    id: "RO_RESPONSABILITE",
    title: "Responsabilité",
    text: "L'établissement n'est pas responsable des objets laissés dans le véhicule ni des dommages préexistants non signalés.",
  },
  {
    id: "RO_PAIEMENT",
    title: "Conditions de paiement",
    text: "Le règlement est dû à la restitution du véhicule. L'établissement se réserve un droit de rétention jusqu'au paiement complet.",
  },
];

export function getRepairOrderClauses(): RepairOrderClause[] {
  return REPAIR_ORDER_CLAUSES;
}

// ============================================
// WORKSHOP-OPS-01: Loan Contract Clauses
// ============================================

const LOAN_CONTRACT_CLAUSES: RepairOrderClause[] = [
  {
    id: "LC_USAGE",
    title: "Usage du véhicule",
    text: "Le véhicule de courtoisie est mis à disposition pour un usage personnel uniquement. Tout usage professionnel est interdit.",
  },
  {
    id: "LC_CONDUCTEUR",
    title: "Conducteur autorisé",
    text: "Seul le signataire du présent contrat est autorisé à conduire le véhicule de prêt.",
  },
  {
    id: "LC_ASSURANCE",
    title: "Assurance",
    text: "Le véhicule est assuré par l'établissement. En cas de sinistre responsable, la franchise reste à la charge de l'emprunteur.",
  },
  {
    id: "LC_CARBURANT",
    title: "Carburant",
    text: "Le véhicule doit être restitué avec le même niveau de carburant qu'au départ. Tout manque sera facturé.",
  },
  {
    id: "LC_ETAT",
    title: "État du véhicule",
    text: "L'emprunteur s'engage à restituer le véhicule dans le même état qu'à la réception. Tout dommage constaté sera à sa charge.",
  },
  {
    id: "LC_ACCIDENT",
    title: "En cas d'accident",
    text: "L'emprunteur s'engage à prévenir immédiatement l'établissement et à remplir un constat amiable.",
  },
];

export function getLoanContractClauses(): RepairOrderClause[] {
  return LOAN_CONTRACT_CLAUSES;
}

// ============================================
// WORKSHOP-OPS-01: Return Report Clauses
// ============================================

const RETURN_REPORT_CLAUSES: RepairOrderClause[] = [
  {
    id: "RR_VERIFICATION",
    title: "Vérification contradictoire",
    text: "Le client reconnaît avoir vérifié le véhicule en présence du représentant de l'établissement.",
  },
  {
    id: "RR_TRAVAUX",
    title: "Travaux effectués",
    text: "Le client reconnaît avoir été informé des travaux réalisés conformément à l'ordre de réparation.",
  },
  {
    id: "RR_GARANTIE",
    title: "Garantie",
    text: "Les travaux effectués bénéficient de la garantie légale. Les conditions sont précisées sur la facture.",
  },
  {
    id: "RR_RESERVE",
    title: "Réserves",
    text: "Toute réserve doit être mentionnée par écrit lors de la restitution. Aucune réclamation ultérieure ne sera recevable.",
  },
];

export function getReturnReportClauses(): RepairOrderClause[] {
  return RETURN_REPORT_CLAUSES;
}
