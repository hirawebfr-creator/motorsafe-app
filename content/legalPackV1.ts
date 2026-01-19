/**
 * Legal Pack V1 - Documents complets pour SafeMotor
 * 
 * DOC-A: Ordre de réparation / Devis (SOCLE) — Toujours
 * DOC-B: Annexe Diagnostic — Si DIAG
 * DOC-C: Annexe Entretien / Réparation mécanique — Si REPAIR/MECH
 * DOC-D: Annexe Reprogrammation ECU — Si ECU_REMAP ou E85_REPROG
 * DOC-E: Annexe Boîtier E85 — Si E85_BOX
 * DOC-F: PV de restitution — Toujours (fin)
 * DOC-G: Notice Signature électronique — Informatif
 * DOC-H: Notice RGPD — Informatif
 */

// ============================================================================
// TYPES
// ============================================================================

export type LegalDocType = 
  | "DOC_A" | "DOC_B" | "DOC_C" | "DOC_D" 
  | "DOC_E" | "DOC_F" | "DOC_G" | "DOC_H";

export type InterventionTag = 
  | "DIAG" | "REPAIR" | "MECH" | "ECU_REMAP" 
  | "E85_REPROG" | "E85_BOX" | "E85_KIT" | "OTHER"
  | "E85_BOITIER" | "E85_CARTO" | "REPROG_STAGE1" | "REPROG_STAGE2";

export interface LegalDocTemplate {
  id: LegalDocType;
  title: string;
  shortTitle: string;
  description: string;
  requiresSignature: boolean;
  body: string;
  version: string;
}

// ============================================================================
// MATRICE: QUELS DOCUMENTS SELON LE TYPE D'INTERVENTION
// ============================================================================

/**
 * Get required documents based on intervention tags
 * - DOC-A + DOC-F: Toujours (socle + restitution)
 * - DOC-B: Diagnostic seul
 * - DOC-C: Entretien / réparation mécanique
 * - DOC-D: Reprogrammation ECU (perf/couple/E85 par reprog)
 * - DOC-E: Boîtier E85 homologué
 */
export function getRequiredDocs(tags: string[]): LegalDocType[] {
  const docs: Set<LegalDocType> = new Set(["DOC_A"]); // Toujours le socle
  
  const normalizedTags = tags.map(t => t.toUpperCase());
  
  // DOC-B: Diagnostic
  if (normalizedTags.some(t => t.includes("DIAG"))) {
    docs.add("DOC_B");
  }
  
  // DOC-C: Réparation mécanique / entretien
  if (normalizedTags.some(t => 
    t.includes("REPAIR") || 
    t.includes("MECH") || 
    t.includes("ENTRETIEN") ||
    t.includes("MAINTENANCE")
  )) {
    docs.add("DOC_C");
  }
  
  // DOC-D: Reprogrammation ECU
  if (normalizedTags.some(t => 
    t.includes("REPROG") || 
    t.includes("ECU") || 
    t.includes("REMAP") ||
    t.includes("STAGE") ||
    t.includes("E85_CARTO") ||
    t.includes("E85_REPROG")
  )) {
    docs.add("DOC_D");
  }
  
  // DOC-E: Boîtier E85
  if (normalizedTags.some(t => 
    t.includes("E85_BOX") || 
    t.includes("E85_KIT") || 
    t.includes("E85_BOITIER") ||
    t.includes("BOITIER")
  )) {
    docs.add("DOC_E");
  }
  
  // DOC-F: Toujours à la fin (restitution)
  docs.add("DOC_F");
  
  return Array.from(docs);
}

/**
 * Get informational notices (non-signable)
 */
export function getInfoNotices(): LegalDocType[] {
  return ["DOC_G", "DOC_H"];
}

// ============================================================================
// DOC-A — ORDRE DE RÉPARATION / DEVIS (SOCLE)
// ============================================================================

export const DOC_A: LegalDocTemplate = {
  id: "DOC_A",
  title: "Ordre de Réparation / Devis",
  shortTitle: "Ordre de réparation",
  description: "Document socle pour toute intervention — À signer",
  requiresSignature: true,
  version: "1.0.0",
  body: `## 1. Parties / Véhicule

Le présent ordre de réparation et/ou devis ("Document") est conclu entre **{{GARAGE_NOM}}** ({{GARAGE_ADRESSE}}, SIRET {{GARAGE_SIRET}}, {{GARAGE_EMAIL}}) et **{{CLIENT_NOM}}** ({{CLIENT_EMAIL}}, {{CLIENT_TEL}}), concernant le véhicule :

- **Marque / Modèle** : {{VEH_MARQUE}} {{VEH_MODELE}}
- **Immatriculation** : {{VEH_IMMAT}}
- **VIN** : {{VEH_VIN}}
- **Kilométrage** : {{VEH_KM}} km

## 2. Objet – Description des travaux demandés

Le client demande l'intervention suivante : **{{INTERVENTION_TITRE}}**.

**Symptômes / Constat initial (déclaratif client)** : {{SYMPTOMES}}

**État visuel et réserves à la réception** (chocs, défauts, témoins allumés, accessoires fournis) : {{ETAT_RECEPTION}}

> *Note : L'ordre de réparation sert à décrire la nature des travaux, l'état du véhicule et un coût estimatif avant réparation.*

## 3. Autorisation de diagnostic et opérations nécessaires

Le client autorise {{GARAGE_NOM}} à réaliser les opérations nécessaires au diagnostic (lecture défauts, contrôles, essais) et à informer le client en cas de découverte d'opérations supplémentaires nécessaires.

## 4. Prix / Estimation / Accord préalable

**Montant estimatif** : {{MONTANT_ESTIMATIF}} € TTC (ou "sur devis après diagnostic")

Aucun travail supplémentaire payant ne sera engagé sans accord du client (écrit / validation électronique), conformément à l'obligation d'information précontractuelle sur le prix.

## 5. Délais

**Délai estimatif** : {{DELAI_ESTIMATIF}}

Ce délai peut varier selon approvisionnement, complexité et disponibilité.

## 6. Essais routiers / Garde du véhicule

Le client autorise les essais routiers nécessaires (avant/après). Le véhicule peut être stationné dans l'enceinte du garage ou à proximité, selon contraintes opérationnelles.

## 7. Obligation d'information – Décisions du client

Le garage informe le client des risques/conséquences connues liés à l'intervention. Le client reconnaît avoir reçu les informations déterminantes pour consentir.

## 8. Responsabilité – Cadre général

Le contrat engage les parties : il doit être exécuté de bonne foi et produit effet obligatoire.

En cas d'inexécution, la responsabilité contractuelle peut entraîner dommages et intérêts selon le droit commun.

⚠️ **Important** : Rien dans le présent Document n'exclut la responsabilité en cas de faute lourde/dolosive ni ne limite les droits impératifs du consommateur (clauses abusives réputées non écrites).

## 9. Signature électronique – Preuve

Le client accepte de signer électroniquement ; la signature identifie le signataire et manifeste son consentement au contenu du Document.

---

**Signature**

Signé par **{{CLIENT_NOM}}** le **{{DATE_SIGNATURE}}** — {{MODE_SIGNATURE}} (email + lien sécurisé)
`,
};

// ============================================================================
// DOC-B — ANNEXE DIAGNOSTIC
// ============================================================================

export const DOC_B: LegalDocTemplate = {
  id: "DOC_B",
  title: "Annexe Diagnostic",
  shortTitle: "Diagnostic",
  description: "Annexe pour diagnostic seul ou avant devis — À signer",
  requiresSignature: true,
  version: "1.0.0",
  body: `## Annexe B — Diagnostic

### 1. Objet

Le diagnostic vise à identifier une cause probable (sans démontage lourd sauf accord).

**Forfait diagnostic** : {{PRIX_DIAG}} € TTC

### 2. Limites

Le client comprend qu'un diagnostic peut nécessiter des étapes successives et que certains défauts peuvent être intermittents. Un diagnostic n'est pas une "garantie de réparation" tant qu'un devis de réparation n'est pas accepté.

### 3. Accord

Le client valide expressément le lancement du diagnostic et la facturation correspondante.

> *Ce document renforce la preuve d'accord préalable et l'information sur le prix.*
`,
};

// ============================================================================
// DOC-C — ANNEXE ENTRETIEN / RÉPARATION MÉCANIQUE
// ============================================================================

export const DOC_C: LegalDocTemplate = {
  id: "DOC_C",
  title: "Annexe Entretien / Réparation Mécanique",
  shortTitle: "Réparation mécanique",
  description: "Annexe pour entretien et réparations — À signer",
  requiresSignature: true,
  version: "1.0.0",
  body: `## Annexe C — Entretien / Réparation Mécanique

### 1. Obligation de résultat sur la réparation

En réparation automobile, le professionnel est généralement tenu de restituer un véhicule en état de fonctionnement correspondant à l'intervention facturée (cadre "obligation de résultat" rappelé en pratique par la DGCCRF).

### 2. Pièces et choix

- **Pièces fournies par le garage** : garanties selon fournisseur, traçabilité conservée.
- **Pièces apportées par le client** (si autorisé) : le client assume la compatibilité/qualité ; le garage peut refuser si risque sécurité.

### 3. Découverte de défauts

Si des défauts connexes (sécurité / fiabilité) sont détectés, le garage informe le client et peut recommander de ne pas reprendre la route tant que non traité (preuve de conseil).

### 4. Réserves

Le client est informé que certains organes existants peuvent céder ultérieurement (usure/âge) sans lien direct avec l'intervention.
`,
};

// ============================================================================
// DOC-D — ANNEXE REPROGRAMMATION ECU
// ============================================================================

export const DOC_D: LegalDocTemplate = {
  id: "DOC_D",
  title: "Annexe Reprogrammation ECU / Optimisation / Conversion E85 par Reprog",
  shortTitle: "Reprogrammation ECU",
  description: "Annexe pour toute reprogrammation moteur — Protection maximale — À signer",
  requiresSignature: true,
  version: "1.0.0",
  body: `## Annexe D — Reprogrammation ECU / Optimisation / Conversion E85

### 0. Clause "Conformité / Refus d'illégal" ⚠️

**Le garage refuse toute modification visant à désactiver/supprimer des dispositifs réglementaires** (ex : dépollution, sécurité) ou à rendre le véhicule non conforme à la loi. Toute demande en ce sens est refusée.

### 1. Nature de l'intervention

La reprogrammation modifie des paramètres logiciels du calculateur. Le client demande : **{{DETAIL_REPROG}}** (ex : optimisation couple/puissance / conversion E85 / calibration…).

### 2. Usage et limites – Pas de promesse chiffrée

Les gains annoncés sont indicatifs et dépendent de l'état moteur, du carburant, de la température, de l'entretien et des périphériques. **Aucune garantie de valeur chiffrée n'est donnée** sans mesures normalisées (banc) et conditions documentées.

### 3. État initial / Transparence

Le client déclare :
- être propriétaire ou dûment autorisé,
- que le véhicule est entretenu et en état compatible,
- avoir signalé toute anomalie connue.

### 4. Information "Assurance" ⚠️ (Protection cruciale)

Le client est informé qu'une modification des caractéristiques **doit être déclarée à l'assureur** (aggravation/évolution du risque) et que les fausses déclarations peuvent avoir des conséquences sur le contrat.

### 5. Information "Conformité administrative" ⚠️ (Cruciale)

Le client est informé que toute transformation susceptible de modifier les caractéristiques d'un véhicule peut entraîner des démarches (réception / mise à jour du certificat d'immatriculation).

### 6. Garantie constructeur

Le client est informé que la modification logicielle peut impacter une garantie constructeur ou contrat d'entretien (si applicable).

### 7. Contrôle technique / Émissions

Le client comprend que tout défaut préexistant (sondes, catalyseur, FAP, etc.) peut influencer les émissions/contrôle technique ; l'intervention n'a pas pour objet de contourner les contrôles.

### 8. Responsabilités – Cadre équilibré

- Le garage reste responsable de la qualité de sa prestation selon le droit commun.
- Le client assume les conséquences liées à un usage non conforme (compétition non déclarée, entretien insuffisant, carburant inadapté, modifications ultérieures par un tiers).

### 9. Preuves techniques

Le client accepte que soient archivés : relevés OBD avant/après, liste DTC, versions ECU si disponibles, rapport d'intervention, et le hash du document signé.
`,
};

// ============================================================================
// DOC-E — ANNEXE BOÎTIER E85
// ============================================================================

export const DOC_E: LegalDocTemplate = {
  id: "DOC_E",
  title: "Annexe Boîtier de Conversion Superéthanol E85 (Kit homologué)",
  shortTitle: "Boîtier E85",
  description: "Annexe pour installation boîtier E85 homologué — À signer",
  requiresSignature: true,
  version: "1.0.0",
  body: `## Annexe E — Boîtier de Conversion Superéthanol E85

### 1. Cadre

L'installation d'un dispositif de conversion E85 est encadrée par un texte spécifique (homologation/conditions d'installation).

### 2. Éligibilité

Le client reconnaît que le véhicule doit être éligible au kit homologué correspondant et que l'installation suit la procédure fabricant/agrément.

### 3. Démarches / Conformité

Le client est informé qu'une conversion peut impliquer des **démarches administratives** selon le cas (et/ou mise à jour des caractéristiques du véhicule sur la carte grise).

### 4. Usage / Entretien

Le client s'engage à respecter les recommandations (carburant, entretien, bougies, démarrages à froid, etc.) et comprend que des organes vieillissants peuvent révéler une faiblesse après conversion (durites, pompe, injecteurs).

### 5. Assurance

Le client est informé de ses **obligations déclaratives** potentielles vis-à-vis de l'assurance suite à la conversion.
`,
};

// ============================================================================
// DOC-F — PV DE RESTITUTION
// ============================================================================

export const DOC_F: LegalDocTemplate = {
  id: "DOC_F",
  title: "PV de Restitution / Réception des Travaux",
  shortTitle: "PV Restitution",
  description: "Procès-verbal de restitution du véhicule — À signer en fin",
  requiresSignature: true,
  version: "1.0.0",
  body: `## PV de Restitution / Réception des Travaux

### 1. Rappel intervention

**Intervention réalisée** : {{INTERVENTION_TITRE}}

**Pièces remplacées / Opérations** : {{DETAIL_TRAVAUX}}

### 2. Tests

**Tests effectués** : {{TESTS_EFFECTUES}} (essai routier, OBD, contrôle visuel, etc.)

**Réserves restantes éventuelles** : {{RESERVES_SORTIE}}

### 3. Réception

Le client reconnaît la restitution du véhicule et la réception des travaux, sous réserve des réserves ci-dessus.

---

**Signature**

Signé par **{{CLIENT_NOM}}** le **{{DATE_SIGNATURE}}**
`,
};

// ============================================================================
// DOC-G — NOTICE SIGNATURE ÉLECTRONIQUE (Informatif)
// ============================================================================

export const DOC_G: LegalDocTemplate = {
  id: "DOC_G",
  title: "Notice Signature Électronique & Valeur Probatoire",
  shortTitle: "Notice signature",
  description: "Information sur la valeur juridique de la signature électronique",
  requiresSignature: false,
  version: "1.0.0",
  body: `## Notice — Signature Électronique & Valeur Probatoire

### Cadre juridique

- L'écrit électronique a valeur probante sous réserve d'intégrité (Code civil, Art. 1366).
- La signature électronique doit permettre d'identifier le signataire et de lier la signature à l'acte (Art. 1367).
- Une signature qualifiée a l'effet juridique d'une signature manuscrite au niveau UE (Règlement eIDAS).

### Dossier de preuve SafeMotor

Pour garantir la valeur probatoire, SafeMotor conserve :
- Horodatage de la signature
- Email du signataire
- Adresse IP (hashée)
- User-Agent du navigateur
- Code de vérification (OTP ou lien unique)
- Hash SHA-256 du document PDF
- Logs d'envoi et de réception

### Contestation

En cas de contestation d'une signature électronique, le juge vérifie les conditions des articles 1366 et 1367 du Code civil.
`,
};

// ============================================================================
// DOC-H — NOTICE RGPD & DURÉES DE CONSERVATION
// ============================================================================

export const DOC_H: LegalDocTemplate = {
  id: "DOC_H",
  title: "Notice RGPD & Durées de Conservation",
  shortTitle: "Notice RGPD",
  description: "Information sur le traitement des données personnelles",
  requiresSignature: false,
  version: "1.0.0",
  body: `## Notice — RGPD & Durées de Conservation

### Finalités du traitement

- Gestion de la relation client
- Réalisation des interventions
- Création et archivage des documents
- Conformité légale et preuve
- Facturation

### Durées de conservation

| Catégorie | Durée | Base légale |
|-----------|-------|-------------|
| Documents signés / Preuves | 10 ans | Archivage probatoire |
| Pièces comptables | 10 ans | Code de commerce |
| Logs techniques opérationnels | 12 mois | Intérêt légitime |
| Données client actif | Durée de la relation | Contrat |

### Principe de minimisation

Aucune conservation indéfinie. Les données sont supprimées à l'expiration des durées légales.

### Contrats électroniques

Conformément au Code de la consommation et au décret applicable, les contrats conclus par voie électronique au-delà d'un certain montant sont conservés et accessibles pendant 10 ans.

### Vos droits

Vous disposez des droits d'accès, rectification, effacement, limitation, portabilité et opposition. Contact : {{GARAGE_EMAIL}}
`,
};

// ============================================================================
// EXPORT ALL TEMPLATES
// ============================================================================

export const LEGAL_PACK_V1: Record<LegalDocType, LegalDocTemplate> = {
  DOC_A,
  DOC_B,
  DOC_C,
  DOC_D,
  DOC_E,
  DOC_F,
  DOC_G,
  DOC_H,
};

/**
 * Get all required templates for an intervention
 */
export function getRequiredTemplates(tags: string[]): LegalDocTemplate[] {
  const docIds = getRequiredDocs(tags);
  return docIds.map(id => LEGAL_PACK_V1[id]);
}

/**
 * Get info notices templates
 */
export function getInfoNoticeTemplates(): LegalDocTemplate[] {
  return getInfoNotices().map(id => LEGAL_PACK_V1[id]);
}

// ============================================================================
// PLACEHOLDER REPLACEMENT
// ============================================================================

export interface PlaceholderData {
  // Garage
  GARAGE_NOM?: string;
  GARAGE_ADRESSE?: string;
  GARAGE_SIRET?: string;
  GARAGE_EMAIL?: string;
  
  // Client
  CLIENT_NOM?: string;
  CLIENT_EMAIL?: string;
  CLIENT_TEL?: string;
  
  // Vehicle
  VEH_MARQUE?: string;
  VEH_MODELE?: string;
  VEH_IMMAT?: string;
  VEH_VIN?: string;
  VEH_KM?: string;
  
  // Intervention
  INTERVENTION_TITRE?: string;
  SYMPTOMES?: string;
  ETAT_RECEPTION?: string;
  MONTANT_ESTIMATIF?: string;
  DELAI_ESTIMATIF?: string;
  
  // Diagnostic
  PRIX_DIAG?: string;
  
  // Reprog
  DETAIL_REPROG?: string;
  
  // Restitution
  DETAIL_TRAVAUX?: string;
  TESTS_EFFECTUES?: string;
  RESERVES_SORTIE?: string;
  
  // Signature
  DATE_SIGNATURE?: string;
  MODE_SIGNATURE?: string;
}

/**
 * Replace all placeholders in a template body
 */
export function fillTemplate(template: LegalDocTemplate, data: PlaceholderData): string {
  let body = template.body;
  
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    body = body.replaceAll(placeholder, value || `[${key}]`);
  }
  
  // Replace any remaining placeholders with empty brackets
  body = body.replace(/\{\{([A-Z_]+)\}\}/g, '[$1]');
  
  return body;
}

/**
 * Fill multiple templates at once
 */
export function fillTemplates(templates: LegalDocTemplate[], data: PlaceholderData): { template: LegalDocTemplate; filledBody: string }[] {
  return templates.map(template => ({
    template,
    filledBody: fillTemplate(template, data),
  }));
}
