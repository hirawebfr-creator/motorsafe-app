/**
 * SUPPORT-SLA-01: Admin Support Macros (Response Templates)
 * 
 * Variables disponibles:
 * - {TICKET_ID} - Numéro du ticket
 * - {GARAGE_NAME} - Nom du garage (si disponible)
 * - {CLIENT_NAME} - Nom du demandeur
 */

export interface SupportMacro {
  id: string;
  title: string;
  category: "general" | "bug" | "billing" | "legal" | "feature";
  body: string;
}

export const SUPPORT_MACROS: SupportMacro[] = [
  // === General ===
  {
    id: "request-info",
    title: "Demande d'informations complémentaires",
    category: "general",
    body: `Bonjour {CLIENT_NAME},

Merci pour votre message concernant le ticket #{TICKET_ID}.

Pour pouvoir vous aider efficacement, pourriez-vous nous fournir les informations suivantes :
- Quand le problème s'est-il produit ?
- Quelles actions avez-vous effectuées avant le problème ?
- Avez-vous un message d'erreur à nous communiquer ?

Merci de votre collaboration.

L'équipe SafeMotor`,
  },
  {
    id: "received-investigating",
    title: "Bien reçu, en cours d'analyse",
    category: "general",
    body: `Bonjour {CLIENT_NAME},

Nous avons bien reçu votre demande (ticket #{TICKET_ID}) et notre équipe technique est en train de l'analyser.

Nous reviendrons vers vous dans les plus brefs délais avec une solution ou des informations complémentaires.

Merci de votre patience.

L'équipe SafeMotor`,
  },
  {
    id: "resolved-closing",
    title: "Problème résolu, fermeture",
    category: "general",
    body: `Bonjour {CLIENT_NAME},

Le problème signalé dans le ticket #{TICKET_ID} a été résolu.

N'hésitez pas à nous recontacter si vous rencontrez d'autres difficultés.

Bonne continuation avec SafeMotor !

L'équipe SafeMotor`,
  },
  
  // === Bugs ===
  {
    id: "bug-signature",
    title: "Bug signature électronique",
    category: "bug",
    body: `Bonjour {CLIENT_NAME},

Concernant votre problème de signature électronique (ticket #{TICKET_ID}) :

Voici les points à vérifier :
1. Le lien de signature est-il toujours valide ? (validité 7 jours)
2. Le client a-t-il bien reçu l'email ? (vérifier les spams)
3. Le navigateur utilisé est-il à jour ?

Si le problème persiste, nous pouvons :
- Renvoyer le lien de signature
- Générer un nouveau lien

Pouvez-vous nous indiquer ce qui ne fonctionne pas exactement ?

L'équipe SafeMotor`,
  },
  {
    id: "bug-payment",
    title: "Bug paiement/facturation",
    category: "bug",
    body: `Bonjour {CLIENT_NAME},

Nous sommes désolés pour ce problème de paiement (ticket #{TICKET_ID}).

Pour vous aider, nous avons besoin de :
- La date et l'heure de la tentative de paiement
- Le dernier message d'erreur affiché
- Le type de carte utilisée (Visa, Mastercard...)

Nous vérifions immédiatement le statut de votre paiement côté Stripe et revenons vers vous.

L'équipe SafeMotor`,
  },
  {
    id: "bug-email",
    title: "Problème emails non reçus",
    category: "bug",
    body: `Bonjour {CLIENT_NAME},

Concernant les emails non reçus (ticket #{TICKET_ID}) :

Voici les vérifications à effectuer :
1. Vérifier le dossier "Spam" ou "Courrier indésirable"
2. Ajouter noreply@safemotor.fr aux contacts autorisés
3. Vérifier que l'adresse email dans SafeMotor est correcte

Si le problème persiste après ces vérifications, nous pouvons renvoyer l'email.

L'équipe SafeMotor`,
  },
  
  // === Billing ===
  {
    id: "billing-invoice",
    title: "Demande de facture",
    category: "billing",
    body: `Bonjour {CLIENT_NAME},

Concernant votre demande de facture (ticket #{TICKET_ID}) :

Vous pouvez accéder à toutes vos factures depuis :
Menu → Facturation → Historique des factures

Vous y trouverez un bouton "Télécharger" pour chaque facture.

Si vous avez besoin d'une facture spécifique, merci de nous indiquer la période concernée.

L'équipe SafeMotor`,
  },
  {
    id: "billing-cancel",
    title: "Demande résiliation",
    category: "billing",
    body: `Bonjour {CLIENT_NAME},

Nous avons bien reçu votre demande de résiliation (ticket #{TICKET_ID}).

Pour procéder à la résiliation :
1. Allez dans Menu → Facturation
2. Cliquez sur "Gérer l'abonnement"
3. Sélectionnez "Annuler l'abonnement"

Votre abonnement restera actif jusqu'à la fin de la période payée.

Nous sommes désolés de vous voir partir. N'hésitez pas à nous dire ce qui n'a pas fonctionné pour vous.

L'équipe SafeMotor`,
  },
  
  // === Legal ===
  {
    id: "gdpr-export",
    title: "Demande export RGPD",
    category: "legal",
    body: `Bonjour {CLIENT_NAME},

Conformément au RGPD, voici comment exporter vos données (ticket #{TICKET_ID}) :

Pour exporter les données d'un client :
1. Allez dans Clients → sélectionnez le client
2. Cliquez sur ⋮ → "Exporter (RGPD)"
3. Un fichier ZIP sera téléchargé

Pour exporter les données de votre garage :
1. Allez dans Mon garage → onglet Conformité
2. Cliquez sur "Exporter toutes les données"

Si vous avez besoin d'un export complet de votre compte, nous pouvons le préparer sous 72h.

L'équipe SafeMotor`,
  },
  {
    id: "gdpr-delete",
    title: "Demande suppression RGPD",
    category: "legal",
    body: `Bonjour {CLIENT_NAME},

Concernant votre demande de suppression de données (ticket #{TICKET_ID}) :

Pour anonymiser un client (droit à l'oubli) :
1. Allez dans Clients → sélectionnez le client
2. Cliquez sur ⋮ → "Anonymiser (RGPD)"
3. Confirmez l'action

Note : Les données comptables (factures) sont conservées 10 ans conformément à la loi, mais sont pseudonymisées.

Si vous souhaitez la suppression complète de votre compte garage, merci de le confirmer explicitement.

L'équipe SafeMotor`,
  },
  
  // === Feature ===
  {
    id: "feature-noted",
    title: "Suggestion de fonctionnalité notée",
    category: "feature",
    body: `Bonjour {CLIENT_NAME},

Merci pour votre suggestion (ticket #{TICKET_ID}) !

Nous avons bien noté votre demande et l'avons ajoutée à notre roadmap produit.

Notre équipe produit évalue régulièrement les suggestions des utilisateurs pour prioriser les développements.

Nous vous tiendrons informé si cette fonctionnalité est implémentée.

Merci de contribuer à améliorer SafeMotor !

L'équipe SafeMotor`,
  },
];

/**
 * Get all macros, optionally filtered by category
 */
export function getMacros(category?: string): SupportMacro[] {
  if (!category) return SUPPORT_MACROS;
  return SUPPORT_MACROS.filter(m => m.category === category);
}

/**
 * Get a macro by ID
 */
export function getMacroById(id: string): SupportMacro | undefined {
  return SUPPORT_MACROS.find(m => m.id === id);
}

/**
 * Apply variables to macro body
 */
export function applyMacroVariables(
  body: string,
  variables: {
    ticketId?: string;
    garageName?: string;
    clientName?: string;
  }
): string {
  let result = body;
  if (variables.ticketId) {
    result = result.replace(/\{TICKET_ID\}/g, variables.ticketId);
  }
  if (variables.garageName) {
    result = result.replace(/\{GARAGE_NAME\}/g, variables.garageName);
  }
  if (variables.clientName) {
    result = result.replace(/\{CLIENT_NAME\}/g, variables.clientName);
  }
  // Replace remaining variables with empty or placeholder
  result = result.replace(/\{TICKET_ID\}/g, "---");
  result = result.replace(/\{GARAGE_NAME\}/g, "");
  result = result.replace(/\{CLIENT_NAME\}/g, "Client");
  return result;
}
