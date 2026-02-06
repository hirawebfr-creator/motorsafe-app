"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  Clock,
  Mail,
  Printer,
  Eye,
  Trash2,
  Download,
  Edit,
  XCircle,
  Globe,
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
// GDPR RIGHTS CARDS
// ============================================================================

const GDPR_RIGHTS = [
  { icon: Eye, title: "Droit d'acces", desc: "Obtenir une copie de vos donnees", color: "#6366F1" },
  { icon: Edit, title: "Droit de rectification", desc: "Corriger vos informations", color: "#10B981" },
  { icon: Trash2, title: "Droit a l'effacement", desc: "Supprimer vos donnees", color: "#EF4444" },
  { icon: Download, title: "Droit a la portabilite", desc: "Exporter vos donnees", color: "#F59E0B" },
  { icon: XCircle, title: "Droit d'opposition", desc: "Refuser certains traitements", color: "#8B5CF6" },
  { icon: Lock, title: "Droit a la limitation", desc: "Restreindre le traitement", color: "#EC4899" },
];

// ============================================================================
// SUBPROCESSORS TABLE
// ============================================================================

const SUBPROCESSORS = [
  { name: "Vercel Inc.", purpose: "Hebergement et CDN", location: "USA/EU", dpa: "Oui", scc: "Oui" },
  { name: "Neon Tech", purpose: "Base de donnees PostgreSQL", location: "EU", dpa: "Oui", scc: "N/A" },
  { name: "Stripe Inc.", purpose: "Paiements", location: "USA/EU", dpa: "Oui", scc: "Oui" },
  { name: "Resend Inc.", purpose: "Emails transactionnels", location: "USA", dpa: "Oui", scc: "Oui" },
  { name: "Sentry.io", purpose: "Monitoring erreurs", location: "USA", dpa: "Oui", scc: "Oui" },
];

// ============================================================================
// PRIVACY POLICY SECTIONS
// ============================================================================

const PRIVACY_SECTIONS = [
  {
    id: "introduction",
    title: "Introduction et engagements",
    content: `
**SafeMotor s'engage a proteger votre vie privee.**

La presente Politique de Confidentialite decrit comment SafeMotor SAS (ci-apres "SafeMotor", "nous", "notre") collecte, utilise, stocke et protege vos donnees personnelles lorsque vous utilisez notre plateforme accessible a l'adresse https://safemotor.fr.

Cette politique s'applique a :
- Nos utilisateurs professionnels (garages, mecaniciens)
- Les clients finaux dont les donnees sont gerees via notre plateforme
- Les visiteurs de notre site web

**Nos engagements :**
- Transparence totale sur l'utilisation de vos donnees
- Collecte limitee au strict necessaire (minimisation)
- Securite renforcee de vos informations
- Respect integral du RGPD et de la loi Informatique et Libertes
- Pas de vente de vos donnees a des tiers
- Droit de controle total sur vos informations

**Responsable du traitement :**
SafeMotor SAS
15 rue de l'Innovation, 75001 Paris
Email : dpo@safemotor.fr
    `.trim(),
  },
  {
    id: "donnees-collectees",
    title: "Donnees personnelles collectees",
    content: `
**1. Donnees que vous nous fournissez directement :**

*Lors de l'inscription :*
- Nom et prenom
- Adresse email professionnelle
- Numero de telephone
- Nom de l'entreprise / raison sociale
- Adresse du siege social
- Numero SIRET

*Lors de l'utilisation du service :*
- Donnees de vos clients (nom, coordonnees, vehicules)
- Historique des interventions
- Devis et factures
- Notes et commentaires

**2. Donnees collectees automatiquement :**

*Donnees techniques :*
- Adresse IP
- Type de navigateur et version
- Systeme d'exploitation
- Resolution d'ecran
- Pages visitees et duree des sessions
- Horodatage des connexions

*Cookies et traceurs :*
- Cookie de session (authentification)
- Cookie de preferences (theme, langue)
- Cookies analytiques (avec consentement)

**3. Donnees sensibles :**

Nous ne collectons PAS de donnees sensibles au sens du RGPD (origines ethniques, opinions politiques, donnees de sante, orientation sexuelle, etc.) sauf si strictement necessaire pour le service et avec votre consentement explicite.
    `.trim(),
  },
  {
    id: "finalites",
    title: "Finalites et bases legales",
    content: `
**Vos donnees sont utilisees pour les finalites suivantes :**

| Finalite | Base legale | Duree de conservation |
|----------|-------------|----------------------|
| Gestion de votre compte | Execution du contrat | Duree du contrat + 3 ans |
| Fourniture des services | Execution du contrat | Duree du contrat + 3 ans |
| Facturation | Obligation legale | 10 ans (comptabilite) |
| Support client | Interet legitime | 3 ans apres le dernier contact |
| Amelioration des services | Interet legitime | Donnees anonymisees |
| Marketing (newsletter) | Consentement | Jusqu'au retrait du consentement |
| Securite et prevention fraude | Interet legitime | 1 an |
| Conformite legale | Obligation legale | Selon la reglementation |

**Details des bases legales :**

*Execution du contrat (Art. 6.1.b RGPD) :*
Le traitement est necessaire pour vous fournir les services auxquels vous avez souscrit.

*Obligation legale (Art. 6.1.c RGPD) :*
Certains traitements sont imposes par la loi (facturation, comptabilite).

*Interet legitime (Art. 6.1.f RGPD) :*
Certains traitements sont necessaires a nos interets legitimes (securite, amelioration), sous reserve de ne pas porter atteinte a vos droits.

*Consentement (Art. 6.1.a RGPD) :*
Pour certains traitements (newsletter, cookies analytiques), nous recueillons votre consentement prealable. Vous pouvez le retirer a tout moment.
    `.trim(),
  },
  {
    id: "destinataires",
    title: "Destinataires des donnees",
    content: `
**Vos donnees peuvent etre partagees avec :**

**1. Nos equipes internes :**
- Equipe technique (pour le fonctionnement du service)
- Equipe support (pour l'assistance client)
- Equipe commerciale (pour la gestion de votre abonnement)
Acces limite selon le principe du "besoin d'en connaitre".

**2. Nos sous-traitants techniques :**
Nous faisons appel a des prestataires techniques pour assurer le bon fonctionnement de notre service. Ces sous-traitants agissent uniquement sur nos instructions et sont lies par des engagements de confidentialite stricts.

Liste de nos sous-traitants principaux :
- **Vercel** : Hebergement web et CDN
- **Neon** : Base de donnees PostgreSQL
- **Stripe** : Traitement des paiements
- **Resend** : Envoi d'emails transactionnels
- **Sentry** : Monitoring et detection d'erreurs

**3. Autorites et tiers autorises :**
Vos donnees peuvent etre communiquees :
- Aux autorites judiciaires ou administratives sur requisition legale
- Aux organismes de lutte contre la fraude
- A nos conseils juridiques et comptables (secret professionnel)

**4. Transferts internationaux :**
Certains de nos sous-traitants sont situes aux Etats-Unis. Ces transferts sont encadres par :
- Les Clauses Contractuelles Types (CCT) de la Commission europeenne
- Le Data Privacy Framework (lorsqu'applicable)

**Ce que nous ne faisons JAMAIS :**
- Vendre vos donnees a des tiers
- Partager vos donnees a des fins publicitaires
- Donner acces a des tiers non autorises
    `.trim(),
  },
  {
    id: "securite",
    title: "Securite des donnees",
    content: `
**Nous mettons en oeuvre des mesures de securite robustes pour proteger vos donnees :**

**Mesures techniques :**

*Chiffrement :*
- Chiffrement en transit : TLS 1.3 (HTTPS)
- Chiffrement au repos : AES-256 pour les donnees stockees
- Hachage des mots de passe : bcrypt avec salt unique

*Infrastructure :*
- Hebergement sur serveurs certifies ISO 27001
- Pare-feu et protection DDoS
- Surveillance 24/7 des systemes
- Tests de penetration reguliers
- Mises a jour de securite automatiques

*Acces :*
- Authentification forte (2FA disponible)
- Gestion des acces par roles (RBAC)
- Journalisation des acces
- Sessions securisees avec expiration automatique

**Mesures organisationnelles :**

*Politique interne :*
- Sensibilisation des employes a la securite
- Engagement de confidentialite de tous les collaborateurs
- Procedures de gestion des incidents
- Audits de securite reguliers

*Continuite d'activite :*
- Sauvegardes quotidiennes chiffrees
- Plan de reprise d'activite (PRA)
- Redondance geographique des donnees

**En cas d'incident :**
En cas de violation de donnees susceptible d'engendrer un risque pour vos droits et libertes, nous vous informerons dans les meilleurs delais et notifierons la CNIL sous 72 heures conformement au RGPD.
    `.trim(),
  },
  {
    id: "droits",
    title: "Vos droits RGPD",
    content: `
**Conformement au RGPD, vous disposez des droits suivants :**

**1. Droit d'acces (Art. 15 RGPD)**
Vous pouvez obtenir :
- La confirmation que des donnees vous concernant sont traitees
- Une copie de ces donnees
- Des informations sur le traitement (finalites, destinataires, duree)

**2. Droit de rectification (Art. 16 RGPD)**
Vous pouvez demander la correction de donnees inexactes ou incompletes vous concernant.

**3. Droit a l'effacement / "Droit a l'oubli" (Art. 17 RGPD)**
Vous pouvez demander la suppression de vos donnees lorsque :
- Elles ne sont plus necessaires
- Vous retirez votre consentement
- Vous vous opposez au traitement
- Le traitement est illicite

**4. Droit a la limitation du traitement (Art. 18 RGPD)**
Vous pouvez demander la restriction du traitement dans certains cas (contestation de l'exactitude, traitement illicite, etc.).

**5. Droit a la portabilite (Art. 20 RGPD)**
Vous pouvez recevoir vos donnees dans un format structure et lisible par machine, et les transmettre a un autre responsable de traitement.

**6. Droit d'opposition (Art. 21 RGPD)**
Vous pouvez vous opposer au traitement de vos donnees pour des raisons tenant a votre situation particuliere, notamment pour le marketing direct.

**7. Droits lies au profilage et decisions automatisees (Art. 22 RGPD)**
Vous avez le droit de ne pas faire l'objet d'une decision fondee exclusivement sur un traitement automatise produisant des effets juridiques.

**Comment exercer vos droits :**
- Email : dpo@safemotor.fr
- Courrier : SafeMotor SAS - DPO - 15 rue de l'Innovation, 75001 Paris
- Depuis votre compte : Parametres > Vie privee

Nous repondons dans un delai d'un mois maximum (prolongeable de 2 mois pour les demandes complexes).
    `.trim(),
  },
  {
    id: "cookies",
    title: "Politique de cookies",
    content: `
**Qu'est-ce qu'un cookie ?**
Un cookie est un petit fichier texte depose sur votre appareil lors de la visite d'un site web. Il permet de stocker des informations relatives a votre navigation.

**Types de cookies utilises :**

**1. Cookies strictement necessaires (toujours actifs)**
Ces cookies sont essentiels au fonctionnement du site :
- **ms_session** : Cookie de session (authentification)
- **csrf_token** : Protection contre les attaques CSRF
- **theme** : Preferences d'affichage (clair/sombre)
Duree : Session ou 1 an pour les preferences

**2. Cookies de performance (avec consentement)**
Ces cookies nous aident a comprendre comment le site est utilise :
- **Google Analytics** (_ga, _gid) : Statistiques de visite
- **Hotjar** : Cartes de chaleur et enregistrements de session
Duree : 2 ans maximum

**3. Cookies fonctionnels (avec consentement)**
Ces cookies ameliorent l'experience utilisateur :
- **Intercom** : Chat de support client
- **Preferences avancees** : Personnalisation de l'interface
Duree : 1 an

**Gestion des cookies :**

*Via notre bandeau de consentement :*
Lors de votre premiere visite, un bandeau vous permet de choisir les cookies a accepter. Vous pouvez modifier vos choix a tout moment via le lien "Gerer les cookies" en bas de page.

*Via votre navigateur :*
Vous pouvez configurer votre navigateur pour refuser ou supprimer les cookies. Attention, certaines fonctionnalites peuvent ne plus fonctionner.

**Cookies tiers :**
Certains cookies sont deposes par nos partenaires. Consultez leurs politiques respectives :
- Google : https://policies.google.com/privacy
- Stripe : https://stripe.com/privacy
    `.trim(),
  },
  {
    id: "retention",
    title: "Durees de conservation",
    content: `
**Nous conservons vos donnees uniquement le temps necessaire aux finalites pour lesquelles elles ont ete collectees :**

| Type de donnees | Duree de conservation | Justification |
|-----------------|----------------------|---------------|
| Donnees de compte | Duree du contrat + 3 ans | Prescription civile |
| Donnees de facturation | 10 ans | Obligation comptable |
| Logs de connexion | 1 an | Securite et LCEN |
| Donnees clients (geres par vous) | Duree du contrat + 3 ans | Execution du service |
| Cookies de session | Fin de session | Technique |
| Cookies analytiques | 13 mois maximum | Recommandation CNIL |
| Donnees support client | 3 ans apres dernier contact | Interet legitime |
| Donnees de prospection | 3 ans apres dernier contact | CNIL |

**A l'expiration de ces delais :**
- Les donnees sont supprimees definitivement
- Ou anonymisees de maniere irreversible pour des fins statistiques

**Conservation pour obligations legales :**
Certaines donnees peuvent etre conservees plus longtemps si la loi l'exige (contentieux, requisitions judiciaires, etc.).

**Vos donnees clients :**
En tant que responsable de traitement des donnees de vos clients, vous determinez la duree de conservation. SafeMotor agit comme sous-traitant et suit vos instructions.

**En cas de resiliation :**
- Export possible de vos donnees pendant 30 jours
- Suppression des donnees apres 30 jours (sauf obligation legale)
- Certificat de destruction sur demande
    `.trim(),
  },
  {
    id: "mineurs",
    title: "Protection des mineurs",
    content: `
**SafeMotor est un service destine aux professionnels.**

Notre plateforme n'est pas destinee aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de donnees personnelles concernant des mineurs.

**Si vous etes un professionnel :**
Si vous gerez des donnees de clients mineurs (par exemple, proprietaires de vehicules mineurs emancipes), vous etes responsable de vous conformer aux reglementations applicables.

**En tant que parent ou tuteur :**
Si vous pensez qu'un mineur nous a fourni des donnees personnelles sans consentement parental, veuillez nous contacter immediatement a dpo@safemotor.fr. Nous prendrons les mesures necessaires pour supprimer ces informations.

**Consentement parental :**
Conformement au RGPD, le traitement des donnees d'un enfant de moins de 16 ans (ou 15 ans en France) necessite le consentement du titulaire de la responsabilite parentale.
    `.trim(),
  },
  {
    id: "transferts",
    title: "Transferts internationaux",
    content: `
**Principe de localisation en Europe :**
Dans la mesure du possible, nous conservons vos donnees au sein de l'Union europeenne.

**Transferts hors UE :**
Certains de nos sous-traitants techniques sont situes aux Etats-Unis. Ces transferts sont encadres par des garanties appropriees :

**1. Clauses Contractuelles Types (CCT)**
Nous avons conclu avec nos sous-traitants les clauses contractuelles types adoptees par la Commission europeenne (Decision 2021/914).

**2. Data Privacy Framework**
Lorsque nos sous-traitants sont certifies au Data Privacy Framework (successeur du Privacy Shield), ce mecanisme fournit des garanties supplementaires.

**3. Mesures supplementaires**
Nous appliquons des mesures supplementaires recommandees par le CEPD :
- Chiffrement de bout en bout
- Pseudonymisation des donnees
- Evaluation des legislations locales

**Liste des transferts :**

| Sous-traitant | Pays | Garantie |
|---------------|------|----------|
| Vercel Inc. | USA/EU | CCT + Hebergement EU |
| Stripe Inc. | USA | CCT + DPF |
| Resend Inc. | USA | CCT |
| Sentry | USA | CCT |

**Vos droits :**
Vous pouvez obtenir une copie des garanties appropriees en contactant dpo@safemotor.fr.
    `.trim(),
  },
  {
    id: "modifications",
    title: "Modifications de la politique",
    content: `
**Evolution de la politique :**
Nous pouvons etre amenes a modifier cette Politique de Confidentialite pour refleter les evolutions de nos pratiques ou de la reglementation.

**Notification des modifications :**

*Modifications mineures :*
- Mise a jour de la date de revision
- Corrections de forme
- Publication sur le site sans notification particuliere

*Modifications substantielles :*
- Nouvelles finalites de traitement
- Nouveaux destinataires
- Modification des droits
- Notification par email aux utilisateurs enregistres
- Bandeau d'information sur le site
- Delai de 30 jours avant entree en vigueur

**Historique des versions :**
- Version 2.0 - 15 janvier 2025 : Refonte complete RGPD
- Version 1.0 - 1er juin 2024 : Version initiale

**Archivage :**
Les versions anterieures sont conservees et disponibles sur demande.

**Acceptation :**
Votre utilisation continue du service apres notification des modifications vaut acceptation de la nouvelle politique.
    `.trim(),
  },
  {
    id: "contact",
    title: "Contact et reclamations",
    content: `
**Pour toute question relative a vos donnees personnelles :**

**Delegue a la Protection des Donnees (DPO) :**
SafeMotor SAS
A l'attention du DPO
15 rue de l'Innovation
75001 Paris - France
Email : dpo@safemotor.fr

Nous nous engageons a repondre a toute demande dans un delai d'un mois.

**Reclamation aupres de la CNIL :**
Si vous estimez que le traitement de vos donnees ne respecte pas la reglementation, vous avez le droit d'introduire une reclamation aupres de la CNIL :

Commission Nationale de l'Informatique et des Libertes (CNIL)
3 Place de Fontenoy
TSA 80715
75334 Paris Cedex 07
Tel : 01 53 73 22 22
Site : www.cnil.fr

**Ressources utiles :**
- Guide CNIL des droits des personnes : www.cnil.fr/fr/les-droits-pour-maitriser-vos-donnees-personnelles
- Reglement General sur la Protection des Donnees (RGPD) : eur-lex.europa.eu
- Loi Informatique et Libertes : www.legifrance.gouv.fr
    `.trim(),
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function PolitiqueConfidentialitePage() {
  const { isMobile, isTablet } = useResponsive();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["introduction"]));
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

  const expandAll = () => setExpandedSections(new Set(PRIVACY_SECTIONS.map((s) => s.id)));
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
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)",
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
                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock size={24} color="#fff" />
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
                Politique de Confidentialite
              </h1>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0 0" }}>
                Protection de vos donnees personnelles
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
              <Shield size={14} color="#8B5CF6" />
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Conforme <strong>RGPD</strong>
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

      {/* GDPR Rights Cards */}
      <section
        style={{
          padding: isMobile ? "32px 16px" : "48px 24px",
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "8px", textAlign: "center" }}>
            Vos droits RGPD
          </h2>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px", textAlign: "center" }}>
            Vous disposez de droits sur vos donnees personnelles
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            {GDPR_RIGHTS.map((right) => {
              const Icon = right.icon;
              return (
                <div
                  key={right.title}
                  style={{
                    padding: isMobile ? "16px 12px" : "20px",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: `${right.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <Icon size={20} color={right.color} />
                  </div>
                  <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                    {right.title}
                  </h3>
                  <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>{right.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subprocessors Table */}
      <section
        style={{
          padding: isMobile ? "32px 16px" : "48px 24px",
          background: "#F9FAFB",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
            Nos sous-traitants
          </h2>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "20px" }}>
            Liste des prestataires techniques qui traitent vos donnees
          </p>
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB" }}>
                      Sous-traitant
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB" }}>
                      Finalite
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB" }}>
                      Localisation
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB" }}>
                      DPA
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB" }}>
                      CCT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SUBPROCESSORS.map((sp, i) => (
                    <tr key={sp.name} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#111827" }}>{sp.name}</td>
                      <td style={{ padding: "12px 16px", color: "#6B7280" }}>{sp.purpose}</td>
                      <td style={{ padding: "12px 16px", color: "#6B7280" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: sp.location.includes("EU") ? "#DCFCE7" : "#FEF3C7",
                            color: sp.location.includes("EU") ? "#166534" : "#92400E",
                            fontSize: "12px",
                            fontWeight: 500,
                          }}
                        >
                          <Globe size={12} />
                          {sp.location}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <CheckCircle2 size={16} color="#10B981" />
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {sp.scc === "Oui" ? (
                          <CheckCircle2 size={16} color="#10B981" />
                        ) : (
                          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "12px" }}>
            DPA = Data Processing Agreement | CCT = Clauses Contractuelles Types
          </p>
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
                {PRIVACY_SECTIONS.map((section, index) => (
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
                      color: activeSection === section.id ? "#8B5CF6" : "#374151",
                      background: activeSection === section.id ? "rgba(139, 92, 246, 0.08)" : "transparent",
                      fontWeight: activeSection === section.id ? 600 : 400,
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        background: activeSection === section.id ? "#8B5CF6" : "#F3F4F6",
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
                      {section.title}
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
              background: "rgba(139, 92, 246, 0.08)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "12px",
              padding: isMobile ? "16px" : "20px",
              marginBottom: "24px",
              display: "flex",
              gap: "12px",
            }}
          >
            <Shield size={20} color="#7C3AED" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#5B21B6", margin: "0 0 6px 0" }}>
                Votre vie privee nous tient a coeur
              </h4>
              <p style={{ fontSize: "13px", color: "#6D28D9", margin: 0, lineHeight: 1.6 }}>
                SafeMotor s&apos;engage a proteger vos donnees personnelles. Cette politique explique comment nous
                collectons, utilisons et protegeons vos informations.
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
            {PRIVACY_SECTIONS.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: expandedSections.has(section.id) ? "1px solid #8B5CF6" : "1px solid #E5E7EB",
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
                        ? "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
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
            ))}
          </div>

          {/* Contact DPO */}
          <div
            style={{
              marginTop: "32px",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)",
              borderRadius: "14px",
              border: "1px solid rgba(139, 92, 246, 0.15)",
              padding: isMobile ? "20px" : "28px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Contacter notre DPO
            </h3>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "16px", lineHeight: 1.6 }}>
              Pour toute question relative a vos donnees personnelles ou pour exercer vos droits.
            </p>
            <a
              href="mailto:dpo@safemotor.fr"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Mail size={16} />
              dpo@safemotor.fr
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
                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
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
            <Link href="/cgv" style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              CGV
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
