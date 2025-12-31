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
