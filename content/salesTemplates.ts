/**
 * LEADS-CRM-01: Sales Message Templates
 * 
 * Copy-paste templates for DM, SMS, Email prospection
 */

export interface SalesTemplate {
  id: string;
  label: string;
  channel: "DM" | "SMS" | "EMAIL";
  subject?: string; // For emails
  body: string;
  tags: string[];
}

export const SALES_TEMPLATES: SalesTemplate[] = [
  // === DM Instagram/Facebook ===
  {
    id: "dm_intro",
    label: "Premier contact DM",
    channel: "DM",
    body: `Bonjour ! 👋

Je suis {{prenom}}, de SafeMotor. J'ai vu votre garage {{nom_garage}} et je voulais vous présenter rapidement notre outil.

SafeMotor aide les garages à se protéger des litiges clients grâce à des fiches intervention avec signature électronique et photos horodatées.

Beaucoup de garages perdent des heures (et de l'argent) en cas de contestation client. On résout ça en 5 minutes par intervention.

On peut vous faire une démo de 10 minutes si ça vous intéresse ?`,
    tags: ["first_contact", "intro"],
  },
  {
    id: "dm_followup",
    label: "Relance DM",
    channel: "DM",
    body: `Bonjour ! 

Je me permets de vous relancer suite à mon message de la semaine dernière.

SafeMotor = protection juridique pour votre garage en 5 min par intervention.

Avez-vous eu le temps d'y réfléchir ? Je reste dispo pour une démo rapide 📱`,
    tags: ["followup"],
  },
  {
    id: "dm_demo_confirm",
    label: "Confirmation démo DM",
    channel: "DM",
    body: `Super ! 🎉

Je vous propose {{date_heure}} pour la démo (10 min max).

Préférez-vous un appel téléphonique ou une visio ?

À très vite !`,
    tags: ["demo", "confirm"],
  },
  
  // === SMS ===
  {
    id: "sms_intro",
    label: "Premier contact SMS",
    channel: "SMS",
    body: `Bonjour, {{prenom}} de SafeMotor. J'aurais aimé vous présenter notre outil de protection juridique pour garages (signature électronique + photos). 5min par intervention = 0 litige. Dispo pour un appel de 10min ?`,
    tags: ["first_contact", "intro"],
  },
  {
    id: "sms_followup",
    label: "Relance SMS",
    channel: "SMS",
    body: `Bonjour ! Je me permets de vous relancer concernant SafeMotor. Avez-vous eu le temps d'y réfléchir ? 10min de démo = protection complète de votre garage. {{prenom}}`,
    tags: ["followup"],
  },
  {
    id: "sms_demo_reminder",
    label: "Rappel démo SMS",
    channel: "SMS",
    body: `Rappel : notre démo SafeMotor est prévue {{date_heure}}. Je vous appelle dans quelques instants ! {{prenom}}`,
    tags: ["demo", "reminder"],
  },
  {
    id: "sms_trial_started",
    label: "Bienvenue essai SMS",
    channel: "SMS",
    body: `Bienvenue sur SafeMotor ! 🎉 Votre essai gratuit est actif. N'hésitez pas à m'appeler si vous avez des questions. Bonne prise en main ! {{prenom}}`,
    tags: ["trial", "welcome"],
  },

  // === EMAIL ===
  {
    id: "email_intro",
    label: "Premier contact Email",
    channel: "EMAIL",
    subject: "Protection juridique pour {{nom_garage}}",
    body: `Bonjour,

Je suis {{prenom}}, de SafeMotor. J'ai découvert votre garage {{nom_garage}} et je voulais vous présenter notre solution de protection juridique.

**Le problème :** Les litiges clients coûtent cher (temps, stress, parfois avocat). "Le client dit que j'ai rayé sa voiture", "Il refuse de payer car il conteste les travaux"...

**Notre solution :** SafeMotor permet de créer des fiches intervention avec :
- Signature électronique du client (avant ET après intervention)
- Photos horodatées et géolocalisées
- Historique complet du véhicule
- Export PDF juridiquement valable

**Résultat :** En cas de litige, vous avez une preuve irréfutable. La plupart des clients abandonnent leur contestation dès qu'ils voient le dossier.

**5 minutes par intervention = protection totale.**

Seriez-vous disponible pour une démo de 10 minutes cette semaine ?

Cordialement,
{{prenom}}
SafeMotor`,
    tags: ["first_contact", "intro"],
  },
  {
    id: "email_followup",
    label: "Relance Email",
    channel: "EMAIL",
    subject: "Re: Protection juridique pour {{nom_garage}}",
    body: `Bonjour,

Je me permets de vous relancer suite à mon email de la semaine dernière concernant SafeMotor.

Avez-vous eu le temps d'y réfléchir ? Je reste disponible pour une démo rapide (10 min) à votre convenance.

Cordialement,
{{prenom}}`,
    tags: ["followup"],
  },
  {
    id: "email_demo_confirm",
    label: "Confirmation démo Email",
    channel: "EMAIL",
    subject: "Démo SafeMotor - {{date_heure}}",
    body: `Bonjour,

Je vous confirme notre démo SafeMotor le {{date_heure}}.

Je vous appellerai au {{telephone}} (ou en visio si vous préférez).

En attendant, vous pouvez jeter un œil à notre page de présentation : https://motorsafe.fr/demo

À très vite !

{{prenom}}`,
    tags: ["demo", "confirm"],
  },
  {
    id: "email_post_demo",
    label: "Post-démo Email",
    channel: "EMAIL",
    subject: "Suite à notre démo SafeMotor",
    body: `Bonjour,

Merci pour le temps accordé à notre démo SafeMotor !

Comme convenu, voici le récapitulatif :
- **Essai gratuit** : 14 jours, sans engagement, sans CB
- **Plan Starter** : 49€/mois (pour la plupart des garages)
- **Plan Pro** : 129€/mois (multi-utilisateurs, stats avancées)

Pour démarrer votre essai gratuit : https://motorsafe.fr/app/auth/register

N'hésitez pas à me contacter si vous avez des questions.

Cordialement,
{{prenom}}`,
    tags: ["demo", "followup"],
  },
  {
    id: "email_trial_started",
    label: "Bienvenue essai Email",
    channel: "EMAIL",
    subject: "Bienvenue sur SafeMotor ! 🎉",
    body: `Bonjour,

Félicitations, votre compte SafeMotor est maintenant actif !

**Prochaines étapes :**
1. Connectez-vous sur https://motorsafe.fr/app
2. Complétez les infos de votre garage (logo, coordonnées)
3. Créez votre première fiche intervention
4. Faites signer votre premier client !

**Besoin d'aide ?** Je suis disponible par téléphone ou email pour vous accompagner dans la prise en main.

Bonne protection !

{{prenom}}
SafeMotor`,
    tags: ["trial", "welcome"],
  },
];

/**
 * Replace template variables with actual values
 */
export function renderTemplate(
  template: SalesTemplate,
  vars: Record<string, string>
): { subject?: string; body: string } {
  let body = template.body;
  let subject = template.subject;

  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    body = body.replace(pattern, value);
    if (subject) {
      subject = subject.replace(pattern, value);
    }
  }

  return { subject, body };
}

/**
 * Get templates by channel
 */
export function getTemplatesByChannel(channel: "DM" | "SMS" | "EMAIL"): SalesTemplate[] {
  return SALES_TEMPLATES.filter((t) => t.channel === channel);
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): SalesTemplate[] {
  return SALES_TEMPLATES.filter((t) => t.tags.includes(tag));
}
