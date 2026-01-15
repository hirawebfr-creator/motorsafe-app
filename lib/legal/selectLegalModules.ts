/**
 * Legal Modules Selection Engine
 * Automatically selects applicable legal clauses based on intervention tags
 */

import { LEGAL_MODULES, LegalClause, LegalReference } from "@/content/legal";
import { createHash } from "crypto";

export interface LegalSelection {
  modules: string[];
  clauses: LegalClause[];
  allReferences: LegalReference[];
  snapshotHash: string;
}

/**
 * Select legal modules based on intervention tags
 * @param tags - Array of intervention tags (e.g., ["E85_BOITIER", "MAINTENANCE"])
 * @returns Selected modules, clauses, references, and snapshot hash
 */
export function selectLegalModules(tags: string[] = []): LegalSelection {
  const selectedModuleIds = new Set<string>();
  
  // Always include BASE
  selectedModuleIds.add("BASE");
  
  // Check for E85 tags
  if (tags.includes("E85_BOITIER")) {
    selectedModuleIds.add("E85_BOITIER");
    selectedModuleIds.add("INSURANCE_CHANGE");
  }
  
  if (tags.includes("E85_CARTO")) {
    selectedModuleIds.add("E85_CARTO");
    selectedModuleIds.add("INSURANCE_CHANGE");
  }
  
  // Check for reprog tags
  if (tags.some(t => t.startsWith("REPROG_"))) {
    selectedModuleIds.add("REPROG");
    selectedModuleIds.add("INSURANCE_CHANGE");
  }
  
  // Check for other modifications
  if (tags.includes("OTHER_MODIF")) {
    selectedModuleIds.add("OTHER_MODIF");
    selectedModuleIds.add("INSURANCE_CHANGE");
  }
  
  // Order: BASE first, specific modules, INSURANCE_CHANGE last
  const orderedModuleIds: string[] = [];
  
  // 1. BASE always first
  if (selectedModuleIds.has("BASE")) {
    orderedModuleIds.push("BASE");
    selectedModuleIds.delete("BASE");
  }
  
  // 2. Remove INSURANCE_CHANGE temporarily (to add last)
  const hasInsurance = selectedModuleIds.has("INSURANCE_CHANGE");
  selectedModuleIds.delete("INSURANCE_CHANGE");
  
  // 3. Add remaining in a stable order
  const orderedRest = ["E85_BOITIER", "E85_CARTO", "REPROG", "OTHER_MODIF"];
  for (const id of orderedRest) {
    if (selectedModuleIds.has(id)) {
      orderedModuleIds.push(id);
    }
  }
  
  // 4. INSURANCE_CHANGE always last
  if (hasInsurance) {
    orderedModuleIds.push("INSURANCE_CHANGE");
  }
  
  // Build clauses list (deduplicated by id)
  const clauseIds = new Set<string>();
  const clauses: LegalClause[] = [];
  const allReferences: LegalReference[] = [];
  
  for (const moduleId of orderedModuleIds) {
    const module = LEGAL_MODULES[moduleId];
    if (!module) continue;
    
    for (const clause of module.clauses) {
      if (!clauseIds.has(clause.id)) {
        clauseIds.add(clause.id);
        clauses.push(clause);
        allReferences.push(...clause.references);
      }
    }
  }
  
  // Calculate snapshot hash for integrity verification
  const snapshotData = JSON.stringify({
    modules: orderedModuleIds,
    clauses: clauses.map(c => ({ id: c.id, title: c.title, text: c.text })),
    version: "1.0.0",
  });
  const snapshotHash = createHash("sha256").update(snapshotData).digest("hex");
  
  return {
    modules: orderedModuleIds,
    clauses,
    allReferences,
    snapshotHash,
  };
}

/**
 * Build a JSON snapshot of legal content for storage
 * Used to preserve exact content at time of signature
 */
export function buildLegalSnapshot(tags: string[]): {
  json: string;
  hash: string;
} {
  const selection = selectLegalModules(tags);
  
  const snapshot = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    modules: selection.modules,
    clauses: selection.clauses.map(c => ({
      id: c.id,
      title: c.title,
      text: c.text,
      level: c.level,
      references: c.references,
    })),
  };
  
  const json = JSON.stringify(snapshot);
  const hash = createHash("sha256").update(json).digest("hex");
  
  return { json, hash };
}
