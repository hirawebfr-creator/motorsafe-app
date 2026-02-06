"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Shield,
  Building2,
  ArrowLeft,
  ChevronDown,
  Clock,
  Mail,
  Printer,
  Server,
  User,
  Phone,
  MapPin,
  FileText,
  Scale,
  CreditCard,
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
// COMPANY INFO CARD
// ============================================================================

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  link?: string;
}

function InfoCard({ icon, label, value, link }: InfoCardProps) {
  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px",
        background: "#F9FAFB",
        borderRadius: "10px",
        border: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: "#fff",
          border: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 4px 0", fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: "14px", color: "#111827", margin: 0, fontWeight: 600 }}>{value}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} style={{ textDecoration: "none" }} target={link.startsWith("http") ? "_blank" : undefined}>
        {content}
      </a>
    );
  }
  return content;
}

// ============================================================================
// MENTIONS LEGALES SECTIONS
// ============================================================================

const MENTIONS_SECTIONS = [
  {
    id: "editeur",
    title: "Editeur du site",
    content: `
Le site SafeMotor accessible a l'adresse https://safemotor.fr (ci-apres "le Site") est edite par :

**SafeMotor SAS**
Societe par actions simplifiee au capital social de 10 000 euros
Siege social : 15 rue de l'Innovation, 75001 Paris, France
Immatriculee au Registre du Commerce et des Societes de Paris sous le numero 912 345 678
Numero de TVA intracommunautaire : FR12912345678
Code APE/NAF : 6201Z (Programmation informatique)

**Directeur de la publication :**
M. Jean DUPONT, President de SafeMotor SAS

**Coordonnees :**
- Telephone : +33 1 23 45 67 89
- Email : contact@safemotor.fr
- Site web : https://safemotor.fr
    `.trim(),
  },
  {
    id: "hebergement",
    title: "Hebergement",
    content: `
Le Site est heberge par :

**Vercel Inc.**
440 N Barranca Ave #4133
Covina, CA 91723
United States
Site web : https://vercel.com

Les serveurs de Vercel sont localises dans l'Union Europeenne (region Paris, France) pour garantir la conformite RGPD et assurer des temps de reponse optimaux.

**Infrastructure de base de donnees :**
- Neon (PostgreSQL serverless) - Union Europeenne
- Sauvegardes quotidiennes automatisees
- Chiffrement des donnees au repos et en transit

**CDN et services annexes :**
- Vercel Edge Network pour la distribution de contenu
- Cloudflare pour la protection DDoS (optionnel)
    `.trim(),
  },
  {
    id: "activite",
    title: "Activite et services",
    content: `
**Nature de l'activite :**
SafeMotor est une plateforme SaaS (Software as a Service) de gestion destinee aux professionnels de la reparation automobile.

**Services proposes :**
- Gestion de clientele et fichier clients
- Gestion de parc vehicules
- Suivi des interventions mecaniques
- Creation de devis et factures
- Planification de rendez-vous
- Tableaux de bord et statistiques
- Rappels automatiques clients

**Public cible :**
La plateforme est exclusivement destinee aux professionnels (B2B) :
- Garages automobiles
- Mecaniciens independants
- Centres de controle technique
- Carrossiers
- Concessionnaires

**Conditions d'utilisation :**
L'utilisation des services est soumise a l'acceptation prealable :
- Des Conditions Generales d'Utilisation (CGU)
- Des Conditions Generales de Vente (CGV)
- De la Politique de Confidentialite
    `.trim(),
  },
  {
    id: "propriete-intellectuelle",
    title: "Propriete intellectuelle",
    content: `
**Droits d'auteur et copyright :**
L'ensemble du contenu du Site (textes, images, graphismes, logos, icones, sons, logiciels, etc.) est la propriete exclusive de SafeMotor SAS ou de ses partenaires et est protege par les lois francaises et internationales relatives a la propriete intellectuelle.

Toute reproduction, representation, modification, publication, adaptation, totale ou partielle, des elements du Site, quel que soit le moyen ou le procede utilise, est interdite, sauf autorisation ecrite prealable de SafeMotor SAS.

**Marques :**
"SafeMotor" et le logo associe sont des marques deposees de SafeMotor SAS. Toute utilisation non autorisee de ces marques est strictement interdite.

**Logiciel :**
La plateforme SafeMotor est un logiciel original dont SafeMotor SAS detient tous les droits patrimoniaux. Le code source, l'architecture technique et les algorithmes sont proteges.

**Liens hypertextes :**
La creation de liens hypertextes vers le Site est autorisee sans demande prealable, sous reserve que ces liens s'ouvrent dans une nouvelle fenetre et ne portent pas atteinte aux interets de SafeMotor.
    `.trim(),
  },
  {
    id: "donnees-personnelles",
    title: "Protection des donnees personnelles",
    content: `
**Responsable du traitement :**
SafeMotor SAS
15 rue de l'Innovation, 75001 Paris
Email : dpo@safemotor.fr

**Finalites du traitement :**
Les donnees personnelles collectees sont traitees pour :
- La creation et gestion des comptes utilisateurs
- La fourniture des services souscrits
- La facturation et le paiement
- L'envoi de communications relatives au service
- L'amelioration de nos services
- Le respect de nos obligations legales

**Base legale :**
Selon les cas, le traitement est fonde sur :
- L'execution du contrat
- Le consentement de l'utilisateur
- L'interet legitime de SafeMotor
- Une obligation legale

**Droits des personnes :**
Conformement au RGPD, vous disposez des droits suivants :
- Droit d'acces a vos donnees
- Droit de rectification
- Droit a l'effacement ("droit a l'oubli")
- Droit a la limitation du traitement
- Droit a la portabilite
- Droit d'opposition

Pour exercer ces droits, contactez-nous a dpo@safemotor.fr

**Politique de confidentialite :**
Pour plus de details, consultez notre Politique de Confidentialite complete.
    `.trim(),
  },
  {
    id: "cookies",
    title: "Cookies et traceurs",
    content: `
**Utilisation des cookies :**
Le Site utilise des cookies pour assurer son bon fonctionnement et ameliorer l'experience utilisateur.

**Types de cookies utilises :**

*Cookies strictement necessaires (toujours actifs) :*
- Cookies de session pour l'authentification
- Cookies de securite (CSRF)
- Preferences utilisateur (theme, langue)

*Cookies de performance (avec consentement) :*
- Google Analytics pour analyser le trafic
- Hotjar pour comprendre le comportement utilisateur

*Cookies fonctionnels (avec consentement) :*
- Intercom pour le support client
- Cookies de personnalisation

**Gestion des cookies :**
Vous pouvez a tout moment modifier vos preferences en matiere de cookies :
- Via le bandeau de gestion des cookies
- Via les parametres de votre navigateur

**Duree de conservation :**
- Cookies de session : suppression a la fermeture du navigateur
- Cookies persistants : maximum 13 mois

**Plus d'informations :**
Pour en savoir plus sur les cookies et comment les gerer : www.cnil.fr/cookies
    `.trim(),
  },
  {
    id: "responsabilite",
    title: "Limitation de responsabilite",
    content: `
**Exactitude des informations :**
SafeMotor s'efforce d'assurer l'exactitude et la mise a jour des informations diffusees sur le Site. Toutefois, SafeMotor ne peut garantir l'exactitude, la precision ou l'exhaustivite des informations mises a disposition.

**Disponibilite du Site :**
SafeMotor s'efforce de maintenir le Site accessible 24h/24 et 7j/7. Toutefois, l'acces au Site peut etre interrompu notamment pour des raisons de maintenance, de mise a jour, ou pour tout autre motif technique.

SafeMotor ne saurait etre tenue responsable :
- Des interruptions du Site, volontaires ou non
- Des dysfonctionnements ou dommages causes par une intrusion frauduleuse
- De la perte de donnees ou dommages materiels lies a l'utilisation du Site
- Des dommages indirects resultant de l'utilisation du Site

**Liens externes :**
Le Site peut contenir des liens vers des sites tiers. SafeMotor n'exerce aucun controle sur ces sites et decline toute responsabilite quant a leur contenu ou leurs pratiques en matiere de protection des donnees.

**Virus et securite :**
SafeMotor met en oeuvre des mesures de securite pour proteger le Site. Toutefois, compte tenu de la complexite de l'environnement Internet, SafeMotor ne peut garantir l'absence totale de virus ou autres elements dangereux.
    `.trim(),
  },
  {
    id: "droit-applicable",
    title: "Droit applicable et juridiction",
    content: `
**Loi applicable :**
Les presentes mentions legales sont regies par le droit francais.

**Langue :**
En cas de traduction des presentes mentions legales, seule la version francaise fait foi.

**Juridiction competente :**
Tout litige relatif a l'utilisation du Site sera soumis a la competence exclusive des tribunaux de Paris, sous reserve des dispositions imperatives du Code de la consommation.

**Mediation :**
Conformement aux articles L.616-1 et R.616-1 du Code de la consommation, SafeMotor propose un dispositif de mediation de la consommation.

Le mediateur competent est :
Centre de la Mediation de la Consommation de Conciliateurs de Justice (CM2C)
14 rue Saint Jean, 75017 Paris
https://www.cm2c.net

**Reglement en ligne des litiges :**
Conformement a l'article 14 du Reglement (UE) n°524/2013, la Commission europeenne a mis en place une plateforme de reglement en ligne des litiges :
https://ec.europa.eu/consumers/odr/

**Signalement de contenus illicites :**
Tout utilisateur peut signaler un contenu qu'il estime illicite en contactant : abuse@safemotor.fr
    `.trim(),
  },
  {
    id: "credits",
    title: "Credits et remerciements",
    content: `
**Conception et developpement :**
SafeMotor SAS
15 rue de l'Innovation, 75001 Paris
https://safemotor.fr

**Technologies utilisees :**
- Framework : Next.js 14 (React)
- Langage : TypeScript
- Base de donnees : PostgreSQL (Neon)
- ORM : Prisma
- Hebergement : Vercel
- Paiement : Stripe
- Emailing : Resend

**Ressources graphiques :**
- Icones : Lucide Icons (MIT License)
- Police : System UI fonts
- Illustrations : creations originales SafeMotor

**Partenaires techniques :**
- Vercel (hebergement)
- Stripe (paiement)
- Resend (emails transactionnels)
- Sentry (monitoring)

**Mentions speciales :**
Merci a tous nos utilisateurs beta qui ont contribue a ameliorer SafeMotor par leurs retours et suggestions.
    `.trim(),
  },
  {
    id: "mise-a-jour",
    title: "Mise a jour des mentions legales",
    content: `
**Date de derniere mise a jour :**
15 janvier 2025

**Historique des modifications :**
- 15/01/2025 : Mise a jour complete des mentions legales
- 01/06/2024 : Version initiale

**Notification des modifications :**
SafeMotor se reserve le droit de modifier les presentes mentions legales a tout moment. Les utilisateurs enregistres seront informes par email de toute modification substantielle.

**Archivage :**
Les versions anterieures des mentions legales sont conservees et peuvent etre communiquees sur demande adressee a legal@safemotor.fr.

**Contact :**
Pour toute question relative aux presentes mentions legales, vous pouvez nous contacter :
- Par email : legal@safemotor.fr
- Par courrier : SafeMotor SAS - Service Juridique - 15 rue de l'Innovation, 75001 Paris
    `.trim(),
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function MentionsLegalesPage() {
  const { isMobile, isTablet } = useResponsive();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["editeur"]));
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

  const expandAll = () => setExpandedSections(new Set(MENTIONS_SECTIONS.map((s) => s.id)));
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
          background: "linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(234, 88, 12, 0.05) 100%)",
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
                background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={24} color="#fff" />
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
                Mentions Legales
              </h1>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0 0" }}>
                Informations legales obligatoires
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
              <Scale size={14} color="#F97316" />
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Conforme LCEN
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section
        style={{
          padding: isMobile ? "24px 16px" : "40px 24px",
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
            Informations essentielles
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "12px",
            }}
          >
            <InfoCard
              icon={<Building2 size={18} color="#F97316" />}
              label="Raison sociale"
              value="SafeMotor SAS"
            />
            <InfoCard
              icon={<MapPin size={18} color="#F97316" />}
              label="Siege social"
              value="15 rue de l'Innovation, 75001 Paris"
            />
            <InfoCard
              icon={<FileText size={18} color="#F97316" />}
              label="RCS Paris"
              value="912 345 678"
            />
            <InfoCard
              icon={<CreditCard size={18} color="#F97316" />}
              label="Capital social"
              value="10 000 €"
            />
            <InfoCard
              icon={<Mail size={18} color="#F97316" />}
              label="Email"
              value="contact@safemotor.fr"
              link="mailto:contact@safemotor.fr"
            />
            <InfoCard
              icon={<Phone size={18} color="#F97316" />}
              label="Telephone"
              value="+33 1 23 45 67 89"
              link="tel:+33123456789"
            />
            <InfoCard
              icon={<Server size={18} color="#F97316" />}
              label="Hebergeur"
              value="Vercel Inc. (USA/EU)"
            />
            <InfoCard
              icon={<User size={18} color="#F97316" />}
              label="Directeur publication"
              value="Jean DUPONT"
            />
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
                {MENTIONS_SECTIONS.map((section, index) => (
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
                      color: activeSection === section.id ? "#F97316" : "#374151",
                      background: activeSection === section.id ? "rgba(249, 115, 22, 0.08)" : "transparent",
                      fontWeight: activeSection === section.id ? 600 : 400,
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        background: activeSection === section.id ? "#F97316" : "#F3F4F6",
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
            {MENTIONS_SECTIONS.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: expandedSections.has(section.id) ? "1px solid #F97316" : "1px solid #E5E7EB",
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
                        ? "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"
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

          {/* Contact */}
          <div
            style={{
              marginTop: "32px",
              background: "linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(234, 88, 12, 0.05) 100%)",
              borderRadius: "14px",
              border: "1px solid rgba(249, 115, 22, 0.15)",
              padding: isMobile ? "20px" : "28px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Contact juridique
            </h3>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "16px", lineHeight: 1.6 }}>
              Pour toute question juridique ou demande relative aux mentions legales.
            </p>
            <a
              href="mailto:legal@safemotor.fr"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Mail size={16} />
              legal@safemotor.fr
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
                background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
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
              href="/politique-confidentialite"
              style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
            >
              Confidentialite
            </Link>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>© 2025 SafeMotor</p>
        </div>
      </footer>
    </main>
  );
}
