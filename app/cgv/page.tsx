"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Shield,
  ShoppingCart,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Receipt,
  Mail,
  Printer,
  Euro,
  Calendar,
  Ban,
} from "lucide-react";

// ============================================================================
// RESPONSIVE HOOK
// ============================================================================

function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet" };
}

// ============================================================================
// CGV CONTENT - COMPLET ET JURIDIQUE
// ============================================================================

const CGV_SECTIONS = [
  {
    id: "preambule",
    title: "Article 1 - Preambule et champ d'application",
    icon: ShoppingCart,
    content: `
Les presentes Conditions Generales de Vente (ci-apres "CGV") regissent les relations contractuelles entre :

**Le Vendeur :**
SafeMotor SAS
Societe par actions simplifiee au capital de 10 000 euros
Siege social : 15 rue de l'Innovation, 75001 Paris
RCS Paris : 912 345 678
N° TVA intracommunautaire : FR12912345678
Email : contact@safemotor.fr
Telephone : +33 1 23 45 67 89

**Et l'Acheteur :**
Tout professionnel de la reparation automobile (garage, mecanicien, carrossier) souscrivant a un abonnement SafeMotor.

**Champ d'application :**
Les presentes CGV s'appliquent a toutes les ventes de services d'abonnement a la plateforme SafeMotor conclues entre SafeMotor et ses clients professionnels.

Toute commande implique l'acceptation sans reserve des presentes CGV, qui prevalent sur tout autre document, notamment les conditions generales d'achat de l'Acheteur.

SafeMotor se reserve le droit de modifier les presentes CGV a tout moment. Les CGV applicables sont celles en vigueur a la date de la commande.
    `.trim(),
  },
  {
    id: "offres",
    title: "Article 2 - Description des offres",
    icon: Receipt,
    content: `
**2.1 Offres disponibles**

SafeMotor propose les formules d'abonnement suivantes :

*Offre Starter - 29€ HT/mois*
- Jusqu'a 50 clients
- 1 utilisateur
- Gestion des vehicules et interventions
- Facturation basique
- Support par email

*Offre Pro - 59€ HT/mois*
- Clients illimites
- Jusqu'a 3 utilisateurs
- Toutes les fonctionnalites Starter
- Tableau de bord analytique
- Rappels automatiques clients
- Support prioritaire

*Offre Business - 99€ HT/mois*
- Clients illimites
- Utilisateurs illimites
- Toutes les fonctionnalites Pro
- API et integrations
- Multi-etablissements
- Formation personnalisee
- Support telephonique dedie

**2.2 Periode d'essai**

Une periode d'essai gratuite de 14 jours est proposee pour decouvrir la plateforme. Aucun moyen de paiement n'est requis pendant l'essai. A l'issue de l'essai, l'Acheteur peut souscrire a une offre payante ou voir son acces limite.

**2.3 Caracteristiques des Services**

Les caracteristiques detaillees de chaque offre sont disponibles sur la page tarifs du site safemotor.fr. SafeMotor se reserve le droit de faire evoluer les offres et leurs caracteristiques.
    `.trim(),
  },
  {
    id: "prix",
    title: "Article 3 - Prix et modalites de paiement",
    icon: Euro,
    content: `
**3.1 Prix**

Les prix sont indiques en euros hors taxes (HT). La TVA applicable (20%) sera ajoutee au montant HT pour obtenir le prix toutes taxes comprises (TTC).

Les prix peuvent etre revises par SafeMotor. Toute modification sera communiquee avec un preavis de 30 jours et prendra effet au prochain renouvellement de l'abonnement.

**3.2 Facturation**

Les abonnements sont factures mensuellement ou annuellement selon le choix de l'Acheteur. L'abonnement annuel beneficie d'une remise de 2 mois gratuits.

Les factures sont emises electroniquement et mises a disposition dans l'espace client. Une copie est envoyee par email.

**3.3 Modalites de paiement**

Le paiement s'effectue par :
- Carte bancaire (Visa, Mastercard, American Express)
- Prelevement SEPA (sur demande pour les abonnements annuels)

Le paiement est du a la souscription puis a chaque date anniversaire de l'abonnement.

**3.4 Retard de paiement**

Tout retard de paiement entraine de plein droit :
- L'exigibilite immediate de toutes les sommes dues
- Des penalites de retard egales a 3 fois le taux d'interet legal
- Une indemnite forfaitaire de 40€ pour frais de recouvrement
- La possibilite de suspendre l'acces aux Services jusqu'au paiement integral

**3.5 Contestation**

Toute contestation de facture doit etre adressee par ecrit dans un delai de 15 jours suivant la reception. Passe ce delai, la facture est reputee acceptee.
    `.trim(),
  },
  {
    id: "commande",
    title: "Article 4 - Processus de commande",
    icon: CreditCard,
    content: `
**4.1 Etapes de la commande**

La souscription a un abonnement SafeMotor s'effectue selon les etapes suivantes :

1. Creation d'un compte sur safemotor.fr
2. Selection de l'offre souhaitee
3. Renseignement des informations de facturation
4. Acceptation des CGV et de la politique de confidentialite
5. Validation du paiement
6. Confirmation de la commande par email

**4.2 Confirmation de commande**

La commande n'est definitive qu'apres :
- Reception par SafeMotor du paiement integral
- Envoi par SafeMotor d'un email de confirmation

L'email de confirmation recapitule les elements essentiels de la commande (offre souscrite, prix, duree, date de renouvellement).

**4.3 Validite des informations**

L'Acheteur garantit l'exactitude des informations fournies lors de la commande. SafeMotor ne saurait etre tenu responsable des consequences d'informations erronees.

**4.4 Refus de commande**

SafeMotor se reserve le droit de refuser toute commande pour motif legitime, notamment en cas de :
- Informations manifestement inexactes
- Historique de non-paiement
- Utilisation frauduleuse anterieure
    `.trim(),
  },
  {
    id: "abonnement",
    title: "Article 5 - Duree et renouvellement",
    icon: Calendar,
    content: `
**5.1 Duree de l'abonnement**

L'abonnement est conclu pour une duree :
- D'un mois pour les abonnements mensuels
- D'un an pour les abonnements annuels

**5.2 Renouvellement**

Sauf resiliation dans les conditions prevues a l'Article 6, l'abonnement est automatiquement renouvele a chaque echeance pour une duree identique.

Le renouvellement s'effectue au tarif en vigueur a la date du renouvellement. En cas de modification tarifaire, l'Acheteur en est informe 30 jours avant le renouvellement.

**5.3 Changement d'offre**

L'Acheteur peut changer d'offre a tout moment depuis son espace client :

*Passage a une offre superieure (upgrade)*
- Effet immediat
- Facturation au prorata pour la periode restante

*Passage a une offre inferieure (downgrade)*
- Effet au prochain renouvellement
- Pas de remboursement de la difference

**5.4 Suspension**

SafeMotor peut suspendre temporairement l'acces aux Services :
- En cas de non-paiement
- En cas de violation des CGU
- Pour maintenance programmee (preavis de 48h sauf urgence)
    `.trim(),
  },
  {
    id: "resiliation",
    title: "Article 6 - Resiliation",
    icon: Ban,
    content: `
**6.1 Resiliation par l'Acheteur**

L'Acheteur peut resilier son abonnement a tout moment depuis son espace client ou par email a support@safemotor.fr.

*Abonnement mensuel*
- La resiliation prend effet a la fin du mois en cours
- Aucun remboursement au prorata

*Abonnement annuel*
- La resiliation prend effet a la date anniversaire
- Aucun remboursement de la periode restante

**6.2 Resiliation par SafeMotor**

SafeMotor peut resilier l'abonnement :

*Avec preavis de 30 jours*
- Pour motif legitime
- En cas de cessation de l'activite

*Avec effet immediat*
- En cas de manquement grave aux CGU ou CGV
- En cas de non-paiement non regularise sous 15 jours
- En cas d'utilisation frauduleuse

**6.3 Consequences de la resiliation**

A la resiliation :
- L'acces aux Services est desactive
- L'Acheteur peut exporter ses donnees pendant 30 jours
- Les donnees sont ensuite supprimees (sauf obligation legale)
- Les sommes dues restent exigibles

**6.4 Droit de retractation**

Conformement a l'article L.221-28 du Code de la consommation, le droit de retractation ne s'applique pas aux contrats conclus entre professionnels (B2B).

Neanmoins, SafeMotor offre une garantie "Satisfait ou rembourse" de 30 jours : si l'Acheteur n'est pas satisfait dans les 30 premiers jours suivant sa souscription, il peut demander le remboursement integral.
    `.trim(),
  },
  {
    id: "obligations-vendeur",
    title: "Article 7 - Obligations de SafeMotor",
    icon: Shield,
    content: `
**7.1 Fourniture des Services**

SafeMotor s'engage a :
- Fournir les Services conformement aux specifications de l'offre souscrite
- Assurer une disponibilite de 99,5% (hors maintenance programmee)
- Maintenir et ameliorer la plateforme
- Assurer la securite et la confidentialite des donnees

**7.2 Support technique**

SafeMotor assure un support technique :
- Par email : support@safemotor.fr (reponse sous 24h ouvrables)
- Par chat dans l'application (offres Pro et Business)
- Par telephone (offre Business uniquement)

Les horaires du support sont : du lundi au vendredi, de 9h a 18h (heure de Paris), hors jours feries.

**7.3 Sauvegarde des donnees**

SafeMotor realise des sauvegardes quotidiennes des donnees. En cas de perte de donnees due a une defaillance technique de SafeMotor, les donnees sont restaurees dans les meilleurs delais.

**7.4 Evolution des Services**

SafeMotor se reserve le droit de faire evoluer les Services. Les evolutions majeures sont communiquees avec un preavis raisonnable. Les evolutions n'entraineront pas de degradation substantielle des fonctionnalites souscrites.

**7.5 Sous-traitance**

SafeMotor peut faire appel a des sous-traitants pour l'execution de certaines prestations. SafeMotor reste responsable de la bonne execution des Services vis-a-vis de l'Acheteur.
    `.trim(),
  },
  {
    id: "obligations-acheteur",
    title: "Article 8 - Obligations de l'Acheteur",
    icon: CheckCircle2,
    content: `
**8.1 Paiement**

L'Acheteur s'engage a :
- Payer les sommes dues aux echeances prevues
- Maintenir un moyen de paiement valide
- Informer SafeMotor de tout changement de ses coordonnees de facturation

**8.2 Utilisation des Services**

L'Acheteur s'engage a :
- Utiliser les Services conformement aux CGU
- Ne pas depasser les limites de son offre (nombre d'utilisateurs, etc.)
- Ne pas partager ses identifiants avec des tiers non autorises
- Respecter les lois et reglements applicables

**8.3 Donnees**

L'Acheteur est responsable :
- De l'exactitude des donnees qu'il saisit
- Du respect du RGPD pour les donnees de ses clients
- De la sauvegarde locale de ses donnees critiques

**8.4 Securite**

L'Acheteur s'engage a :
- Conserver ses identifiants de maniere securisee
- Signaler immediatement toute utilisation frauduleuse
- Mettre a jour ses logiciels et systemes de securite

**8.5 Cooperation**

L'Acheteur s'engage a cooperer de bonne foi avec SafeMotor, notamment pour :
- Le diagnostic et la resolution de problemes techniques
- La fourniture d'informations necessaires au support
- Les eventuelles mises a jour ou evolutions
    `.trim(),
  },
  {
    id: "responsabilite",
    title: "Article 9 - Responsabilite et garanties",
    icon: AlertTriangle,
    content: `
**9.1 Limitation de responsabilite**

SafeMotor est tenue a une obligation de moyens. Sa responsabilite ne peut etre engagee qu'en cas de faute prouvee.

En aucun cas SafeMotor ne pourra etre tenue responsable des dommages indirects tels que :
- Perte de chiffre d'affaires ou de benefices
- Perte de clientele
- Perte de donnees (au-dela des sauvegardes)
- Atteinte a l'image ou a la reputation
- Prejudice commercial

**9.2 Plafond d'indemnisation**

En tout etat de cause, la responsabilite totale de SafeMotor est limitee au montant total des sommes versees par l'Acheteur au cours des 12 mois precedant l'evenement generateur du dommage.

**9.3 Exclusions de responsabilite**

SafeMotor n'est pas responsable :
- Des interruptions dues a un cas de force majeure
- Des dysfonctionnements lies aux equipements de l'Acheteur
- Des actes de tiers (piratage, virus, etc.)
- Des dommages resultant d'une utilisation non conforme
- Du contenu saisi par l'Acheteur

**9.4 Garantie**

SafeMotor garantit que les Services fonctionneront conformement aux specifications. En cas de non-conformite, SafeMotor corrigera le probleme dans un delai raisonnable ou proposera une solution de contournement.

**9.5 Assurance**

SafeMotor maintient une assurance responsabilite civile professionnelle couvrant les dommages pouvant resulter de son activite.
    `.trim(),
  },
  {
    id: "propriete-intellectuelle",
    title: "Article 10 - Propriete intellectuelle",
    icon: Shield,
    content: `
**10.1 Droits de SafeMotor**

La plateforme SafeMotor, incluant son code, son interface, ses bases de donnees, ses logos et marques, est la propriete exclusive de SafeMotor. Ces elements sont proteges par les lois sur la propriete intellectuelle.

L'Acheteur beneficie d'un droit d'utilisation limite, personnel et non exclusif de la plateforme pour la duree de son abonnement.

Sont interdits :
- La reproduction, modification ou distribution de la plateforme
- La decompilation ou l'ingenierie inverse
- L'extraction ou la reutilisation des bases de donnees
- L'utilisation des marques SafeMotor sans autorisation

**10.2 Donnees de l'Acheteur**

L'Acheteur reste proprietaire de ses donnees. Il concede a SafeMotor une licence limitee pour heberger, traiter et afficher ces donnees aux fins de fourniture des Services.

**10.3 Statistiques anonymisees**

SafeMotor peut utiliser des donnees anonymisees et agregees a des fins statistiques et d'amelioration des Services. Ces donnees ne permettent pas d'identifier l'Acheteur ou ses clients.
    `.trim(),
  },
  {
    id: "donnees-personnelles",
    title: "Article 11 - Protection des donnees",
    icon: Shield,
    content: `
**11.1 Traitement des donnees**

SafeMotor traite les donnees personnelles de l'Acheteur conformement au RGPD et a sa Politique de Confidentialite.

**11.2 Roles respectifs**

*SafeMotor agit en qualite de :*
- Responsable de traitement pour les donnees de l'Acheteur (coordonnees, facturation)
- Sous-traitant pour les donnees des clients de l'Acheteur (clients finaux)

*L'Acheteur agit en qualite de :*
- Responsable de traitement pour les donnees de ses clients finaux

**11.3 Engagements de SafeMotor**

En qualite de sous-traitant, SafeMotor s'engage a :
- Traiter les donnees uniquement sur instruction de l'Acheteur
- Assurer la confidentialite des donnees
- Mettre en oeuvre les mesures de securite appropriees
- Assister l'Acheteur dans le respect de ses obligations RGPD
- Notifier toute violation de donnees dans les 72 heures
- Supprimer ou restituer les donnees a la fin du contrat

**11.4 Transferts hors UE**

Certains sous-traitants de SafeMotor peuvent traiter des donnees hors de l'Union europeenne. Ces transferts sont encadres par des garanties appropriees (Clauses Contractuelles Types, certification adequation).

**11.5 DPA**

Sur demande, SafeMotor peut conclure un accord de traitement de donnees (DPA) specifique avec l'Acheteur.
    `.trim(),
  },
  {
    id: "litiges",
    title: "Article 12 - Droit applicable et litiges",
    icon: Receipt,
    content: `
**12.1 Droit applicable**

Les presentes CGV sont soumises au droit francais.

**12.2 Reglement amiable**

En cas de differend relatif a l'interpretation ou a l'execution des presentes CGV, les parties s'engagent a rechercher une solution amiable.

L'Acheteur peut adresser une reclamation :
- Par email : legal@safemotor.fr
- Par courrier : SafeMotor SAS - Service Juridique - 15 rue de l'Innovation, 75001 Paris

SafeMotor s'engage a repondre dans un delai de 15 jours ouvrables.

**12.3 Mediation**

A defaut de resolution amiable, les parties peuvent recourir a un mediateur. SafeMotor propose le Centre de Mediation et d'Arbitrage de Paris (CMAP).

**12.4 Juridiction competente**

A defaut de reglement amiable ou de mediation, tout litige sera soumis a la competence exclusive du Tribunal de Commerce de Paris.

**12.5 Prescription**

Toute action judiciaire relative aux presentes CGV doit etre engagee dans un delai de 2 ans a compter de la survenance du fait generateur.
    `.trim(),
  },
  {
    id: "dispositions-finales",
    title: "Article 13 - Dispositions finales",
    icon: CheckCircle2,
    content: `
**13.1 Integralite**

Les presentes CGV, associees aux CGU et a la Politique de Confidentialite, constituent l'integralite de l'accord entre les parties. Elles remplacent tout accord anterieur.

**13.2 Nullite partielle**

Si une clause des presentes CGV est declaree nulle ou inopposable, les autres clauses conservent leur pleine validite. La clause nulle sera remplacee par une clause valide se rapprochant le plus de l'intention originelle.

**13.3 Non-renonciation**

Le fait pour SafeMotor de ne pas exercer un droit prevu aux presentes CGV ne constitue pas une renonciation a ce droit.

**13.4 Tolerance**

Toute tolerance de SafeMotor dans l'application des presentes CGV ne saurait creer de droit acquis au profit de l'Acheteur.

**13.5 Cession**

L'Acheteur ne peut ceder le contrat sans l'accord prealable ecrit de SafeMotor. SafeMotor peut librement ceder le contrat a toute societe du groupe ou a tout acquereur.

**13.6 Notifications**

Toute notification entre les parties sera valablement effectuee par email aux adresses indiquees lors de la commande. L'Acheteur doit informer SafeMotor de tout changement d'adresse.

**13.7 Preuve**

Les registres informatiques de SafeMotor font foi entre les parties. Les emails echanges constituent une preuve valable.
    `.trim(),
  },
];

// ============================================================================
// PRICING TABLE
// ============================================================================

const PRICING_DATA = [
  {
    name: "Starter",
    price: "29",
    period: "mois",
    features: ["50 clients max", "1 utilisateur", "Facturation basique", "Support email"],
  },
  {
    name: "Pro",
    price: "59",
    period: "mois",
    features: ["Clients illimites", "3 utilisateurs", "Analytics", "Support prioritaire"],
    popular: true,
  },
  {
    name: "Business",
    price: "99",
    period: "mois",
    features: ["Tout illimite", "Multi-sites", "API", "Support dedie"],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function CGVPage() {
  const { isMobile, isTablet } = useResponsive();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["preambule"]));
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => setExpandedSections(new Set(CGV_SECTIONS.map((s) => s.id)));
  const collapseAll = () => setExpandedSections(new Set());

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #F9FAFB 0%, #fff 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          padding: isMobile ? "16px" : "20px 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/legal"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              color: "#6B7280",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={18} />
            <span style={{ display: isMobile ? "none" : "inline" }}>Retour aux informations legales</span>
            <span style={{ display: isMobile ? "inline" : "none" }}>Retour</span>
          </Link>
          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              background: "#fff",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Printer size={14} />
            {!isMobile && "Imprimer"}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: isMobile ? "40px 16px 32px" : "64px 24px 48px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCart size={24} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: isMobile ? "24px" : "32px",
                  fontWeight: 800,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Conditions Generales de Vente
              </h1>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0 0" }}>
                Conditions commerciales des abonnements SafeMotor
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#fff",
                border: "1px solid #E5E7EB",
              }}
            >
              <Clock size={14} color="#6B7280" />
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Mis a jour le <strong>15 janvier 2025</strong>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#fff",
                border: "1px solid #E5E7EB",
              }}
            >
              <CheckCircle2 size={14} color="#10B981" />
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Version <strong>2.0</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section
        style={{
          padding: isMobile ? "32px 16px" : "48px 24px",
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "20px", textAlign: "center" }}>
            Nos offres d&apos;abonnement
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {PRICING_DATA.map((plan) => (
              <div
                key={plan.name}
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  border: plan.popular ? "2px solid #10B981" : "1px solid #E5E7EB",
                  background: plan.popular ? "rgba(16, 185, 129, 0.03)" : "#fff",
                  position: "relative",
                }}
              >
                {plan.popular && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#10B981",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: "20px",
                    }}
                  >
                    Populaire
                  </span>
                )}
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
                  {plan.name}
                </h3>
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>{plan.price}€</span>
                  <span style={{ fontSize: "13px", color: "#6B7280" }}> HT/{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      <CheckCircle2 size={14} color="#10B981" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: isMobile ? "24px 16px" : "48px 24px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "280px 1fr",
          gap: "32px",
        }}
      >
        {/* Sidebar */}
        {!isMobile && (
          <aside style={{ position: isTablet ? "relative" : "sticky", top: "100px", height: "fit-content" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                border: "1px solid #E5E7EB",
                padding: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "16px",
                }}
              >
                Sommaire
              </h3>
              <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {CGV_SECTIONS.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(section.id);
                      if (!expandedSections.has(section.id)) toggleSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "13px",
                      color: activeSection === section.id ? "#10B981" : "#374151",
                      background: activeSection === section.id ? "rgba(16, 185, 129, 0.08)" : "transparent",
                      fontWeight: activeSection === section.id ? 600 : 400,
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        background: activeSection === section.id ? "#10B981" : "#F3F4F6",
                        color: activeSection === section.id ? "#fff" : "#6B7280",
                        fontSize: "11px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {section.title.replace(/Article \d+ - /, "")}
                    </span>
                  </a>
                ))}
              </nav>
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid #E5E7EB",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  onClick={expandAll}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Tout ouvrir
                </button>
                <button
                  onClick={collapseAll}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Tout fermer
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div>
          {/* Notice */}
          <div
            style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "12px",
              padding: isMobile ? "16px" : "20px",
              marginBottom: "24px",
              display: "flex",
              gap: "12px",
            }}
          >
            <CreditCard size={20} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#065F46", margin: "0 0 6px 0" }}>
                Contrat B2B
              </h4>
              <p style={{ fontSize: "13px", color: "#047857", margin: 0, lineHeight: 1.6 }}>
                Ces conditions s&apos;appliquent aux professionnels. Les particuliers ne peuvent pas souscrire aux
                services SafeMotor.
              </p>
            </div>
          </div>

          {/* Mobile buttons */}
          {isMobile && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={expandAll}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Tout ouvrir
              </button>
              <button
                onClick={collapseAll}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Tout fermer
              </button>
            </div>
          )}

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {CGV_SECTIONS.map((section, index) => {
              return (
                <div
                  key={section.id}
                  id={section.id}
                  style={{
                    background: "#fff",
                    borderRadius: "14px",
                    border: expandedSections.has(section.id) ? "1px solid #10B981" : "1px solid #E5E7EB",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    style={{
                      width: "100%",
                      padding: isMobile ? "16px" : "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: expandedSections.has(section.id)
                          ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                          : "#F3F4F6",
                        color: expandedSections.has(section.id) ? "#fff" : "#6B7280",
                        fontSize: "13px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: isMobile ? "15px" : "16px", fontWeight: 600, color: "#111827" }}>
                      {section.title}
                    </span>
                    <ChevronDown
                      size={18}
                      color="#6B7280"
                      style={{
                        transform: expandedSections.has(section.id) ? "rotate(180deg)" : "rotate(0)",
                        transition: "transform 0.2s ease",
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {expandedSections.has(section.id) && (
                    <div style={{ padding: isMobile ? "0 16px 20px" : "0 20px 24px", paddingLeft: isMobile ? "16px" : "60px" }}>
                      <div
                        style={{ fontSize: "14px", color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}
                        dangerouslySetInnerHTML={{
                          __html: section.content
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\*(.*?)\*/g, "<em>$1</em>")
                            .replace(/^- /gm, "• ")
                            .replace(/\n/g, "<br>"),
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact */}
          <div
            style={{
              marginTop: "32px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)",
              borderRadius: "14px",
              border: "1px solid rgba(16, 185, 129, 0.15)",
              padding: isMobile ? "20px" : "28px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Questions commerciales ?
            </h3>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "16px", lineHeight: 1.6 }}>
              Notre equipe commerciale est disponible pour repondre a vos questions sur nos offres et tarifs.
            </p>
            <a
              href="mailto:sales@safemotor.fr"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Mail size={16} />
              Contacter les ventes
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          padding: isMobile ? "24px 16px" : "40px 24px",
          background: "#111827",
          color: "#fff",
          marginTop: "48px",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={16} color="#fff" />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>SafeMotor</span>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/cgu" style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              CGU
            </Link>
            <Link
              href="/politique-confidentialite"
              style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
            >
              Confidentialite
            </Link>
            <Link
              href="/mentions-legales"
              style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
            >
              Mentions legales
            </Link>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>© 2025 SafeMotor</p>
        </div>
      </footer>
    </main>
  );
}
