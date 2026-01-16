/**
 * Official Intervention Tags
 * Centralized list of tags for interventions with legal module mapping
 * 
 * Usage:
 * - Import INTERVENTION_TAGS for the full list
 * - Import TAG_OPTIONS for UI Select components
 * - Import getTagLabel() to display human-readable labels
 */

export interface InterventionTag {
  value: string;
  label: string;
  description?: string;
  /** If true, triggers INSURANCE_CHANGE clause */
  requiresInsuranceDeclaration?: boolean;
  /** Associated legal module IDs */
  legalModules?: string[];
}

/**
 * Official intervention tags (MVP)
 * Order matters for UI display
 */
export const INTERVENTION_TAGS: InterventionTag[] = [
  // === Standard interventions ===
  {
    value: "MAINTENANCE",
    label: "Maintenance",
    description: "Entretien courant (vidange, filtres, etc.)",
    legalModules: ["BASE"],
  },
  {
    value: "DIAGNOSTIC",
    label: "Diagnostic",
    description: "Diagnostic électronique ou mécanique",
    legalModules: ["BASE"],
  },
  {
    value: "REPAIR_GENERAL",
    label: "Réparation",
    description: "Réparation mécanique générale",
    legalModules: ["BASE"],
  },
  {
    value: "FREINAGE",
    label: "Freinage",
    description: "Disques, plaquettes, étriers, liquide",
    legalModules: ["BASE"],
  },
  {
    value: "EMBRAYAGE",
    label: "Embrayage",
    description: "Kit embrayage, volant moteur",
    legalModules: ["BASE"],
  },
  {
    value: "TURBO",
    label: "Turbo",
    description: "Remplacement ou réparation turbo",
    legalModules: ["BASE"],
  },

  // === E85 conversions ===
  {
    value: "E85_BOITIER",
    label: "E85 Boîtier",
    description: "Installation boîtier éthanol homologué",
    requiresInsuranceDeclaration: true,
    legalModules: ["BASE", "E85_BOITIER", "INSURANCE_CHANGE"],
  },
  {
    value: "E85_CARTO",
    label: "E85 Carto",
    description: "Reprogrammation cartographique E85 (non homologuée)",
    requiresInsuranceDeclaration: true,
    legalModules: ["BASE", "E85_CARTO", "INSURANCE_CHANGE"],
  },

  // === Reprogrammation ===
  {
    value: "REPROG_ECU",
    label: "Reprog ECU",
    description: "Reprogrammation calculateur (stage 1)",
    requiresInsuranceDeclaration: true,
    legalModules: ["BASE", "REPROG", "INSURANCE_CHANGE"],
  },
  {
    value: "REPROG_PERF",
    label: "Reprog Perf",
    description: "Reprogrammation performance (stage 2+)",
    requiresInsuranceDeclaration: true,
    legalModules: ["BASE", "REPROG", "INSURANCE_CHANGE"],
  },

  // === Other modifications ===
  {
    value: "OTHER_MODIF",
    label: "Autre modif",
    description: "Modification technique non catégorisée",
    requiresInsuranceDeclaration: true,
    legalModules: ["BASE", "OTHER_MODIF", "INSURANCE_CHANGE"],
  },
];

/**
 * Tag options for UI Select components
 * Format compatible with Select/MultiSelect components
 */
export const TAG_OPTIONS = INTERVENTION_TAGS.map((tag) => ({
  value: tag.value,
  label: tag.label,
}));

/**
 * Get tag by value
 */
export function getTag(value: string): InterventionTag | undefined {
  return INTERVENTION_TAGS.find((t) => t.value === value);
}

/**
 * Get human-readable label for a tag value
 */
export function getTagLabel(value: string): string {
  const tag = getTag(value);
  return tag?.label ?? value;
}

/**
 * Check if any tag requires insurance declaration
 */
export function requiresInsuranceDeclaration(tags: string[]): boolean {
  return tags.some((t) => getTag(t)?.requiresInsuranceDeclaration);
}

/**
 * Get legal modules for a set of tags
 * Returns deduplicated, ordered list of module IDs
 */
export function getLegalModulesForTags(tags: string[]): string[] {
  const modules = new Set<string>();

  // Always include BASE
  modules.add("BASE");

  for (const tagValue of tags) {
    const tag = getTag(tagValue);
    if (tag?.legalModules) {
      tag.legalModules.forEach((m) => modules.add(m));
    }
  }

  // Order: BASE first, specifics, INSURANCE_CHANGE last
  const ordered: string[] = [];

  if (modules.has("BASE")) {
    ordered.push("BASE");
    modules.delete("BASE");
  }

  const hasInsurance = modules.has("INSURANCE_CHANGE");
  modules.delete("INSURANCE_CHANGE");

  // Add remaining in stable order
  const orderedRest = ["E85_BOITIER", "E85_CARTO", "REPROG", "OTHER_MODIF"];
  for (const id of orderedRest) {
    if (modules.has(id)) {
      ordered.push(id);
    }
  }

  if (hasInsurance) {
    ordered.push("INSURANCE_CHANGE");
  }

  return ordered;
}
