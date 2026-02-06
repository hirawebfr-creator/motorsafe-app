"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  Printer,
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
// CGU CONTENT - COMPLET ET JURIDIQUE
// ============================================================================

const CGU_SECTIONS = [
  {
    id: "objet",
    title: "Article 1 - Objet et champ d'application",
    content: `
Les presentes Conditions Generales d'Utilisation (ci-apres "CGU") ont pour objet de definir les modalites et conditions d'utilisation de la plateforme SafeMotor (ci-apres "la Plateforme"), accessible a l'adresse https://safemotor.fr.

La Plateforme est un logiciel de gestion professionnel destine aux garages automobiles, offrant des fonctionnalites de :
- Gestion des clients et de leurs vehicules
- Suivi des interventions et de l'historique
- Facturation et devis
- Gestion des rendez-vous
- Tableau de bord analytique

L'utilisation de la Plateforme implique l'acceptation pleine et entiere des presentes CGU. L'Utilisateur reconnait avoir pris connaissance des presentes CGU et les accepter sans reserve.

Ces CGU sont opposables a l'Utilisateur des son inscription sur la Plateforme. SafeMotor se reserve le droit de modifier les presentes CGU a tout moment. Les modifications entreront en vigueur des leur publication sur la Plateforme. L'Utilisateur sera informe de toute modification substantielle par email.
    `.trim(),
  },
  {
    id: "definitions",
    title: "Article 2 - Definitions",
    content: `
Dans les presentes CGU, les termes suivants ont la signification suivante :

**"Utilisateur"** : Toute personne physique ou morale utilisant la Plateforme, qu'elle soit titulaire d'un compte ou non.

**"Utilisateur Professionnel"** : Professionnel de la reparation automobile (garage, mecanicien, carrossier) titulaire d'un compte payant sur la Plateforme.

**"Client Final"** : Personne physique dont les donnees sont gerees par un Utilisateur Professionnel via la Plateforme.

**"Compte"** : Espace personnel de l'Utilisateur, accessible par identifiant et mot de passe, permettant d'acceder aux Services.

**"Services"** : Ensemble des fonctionnalites proposees par la Plateforme.

**"Contenu"** : Ensemble des donnees, textes, images, documents uploades ou crees par l'Utilisateur sur la Plateforme.

**"Donnees Personnelles"** : Toute information se rapportant a une personne physique identifiee ou identifiable, au sens du RGPD.
    `.trim(),
  },
  {
    id: "acces",
    title: "Article 3 - Acces a la Plateforme",
    content: `
**3.1 Conditions d'acces**

L'acces a la Plateforme est reserve aux professionnels de la reparation automobile (personnes morales ou personnes physiques exercant une activite professionnelle). L'Utilisateur garantit etre majeur et avoir la capacite juridique de contracter.

Pour creer un Compte, l'Utilisateur doit :
- Fournir des informations exactes et completes (raison sociale, SIRET, adresse, email)
- Choisir un mot de passe securise (minimum 8 caracteres, incluant majuscules, minuscules et chiffres)
- Accepter les presentes CGU et la Politique de Confidentialite

**3.2 Identifiants de connexion**

L'Utilisateur est seul responsable de la confidentialite de ses identifiants. Toute utilisation de son Compte est presumee avoir ete effectuee par lui. En cas de perte, vol ou utilisation frauduleuse de ses identifiants, l'Utilisateur doit en informer immediatement SafeMotor par email a support@safemotor.fr.

**3.3 Suspension et resiliation**

SafeMotor se reserve le droit de suspendre ou resilier l'acces a un Compte en cas de :
- Violation des presentes CGU
- Utilisation frauduleuse ou abusive de la Plateforme
- Non-paiement de l'abonnement
- Fourniture d'informations inexactes lors de l'inscription
    `.trim(),
  },
  {
    id: "services",
    title: "Article 4 - Description des Services",
    content: `
**4.1 Fonctionnalites principales**

La Plateforme offre les Services suivants :

*Gestion des clients*
- Creation et modification de fiches clients
- Historique complet des interactions
- Gestion des vehicules associes

*Gestion des vehicules*
- Fiche vehicule complete (immatriculation, VIN, marque, modele)
- Historique des interventions
- Alertes de controle technique et entretien

*Gestion des interventions*
- Creation de bons d'intervention
- Suivi en temps reel
- Association de pieces et main d'oeuvre

*Facturation*
- Creation de devis et factures
- Envoi par email aux clients
- Export comptable

*Tableau de bord*
- Statistiques d'activite
- Suivi du chiffre d'affaires
- Indicateurs de performance

**4.2 Disponibilite**

SafeMotor s'engage a assurer une disponibilite de la Plateforme de 99,5% sur une base mensuelle, hors maintenance programmee. Les maintenances sont effectuees de preference en heures creuses (22h-6h) et annoncees 48h a l'avance par email.

**4.3 Evolution des Services**

SafeMotor se reserve le droit de faire evoluer les Services, d'ajouter ou de supprimer des fonctionnalites. Les modifications substantielles seront communiquees aux Utilisateurs avec un preavis raisonnable.
    `.trim(),
  },
  {
    id: "obligations-utilisateur",
    title: "Article 5 - Obligations de l'Utilisateur",
    content: `
**5.1 Utilisation conforme**

L'Utilisateur s'engage a :
- Utiliser la Plateforme conformement a sa destination professionnelle
- Respecter les lois et reglements en vigueur, notamment en matiere de protection des donnees
- Ne pas porter atteinte a l'integrite ou au fonctionnement de la Plateforme
- Ne pas tenter d'acceder a des donnees ou fonctionnalites non autorisees

**5.2 Contenu**

L'Utilisateur est seul responsable du Contenu qu'il publie sur la Plateforme. Il garantit :
- Detenir les droits necessaires sur ce Contenu
- Que ce Contenu ne viole aucun droit de tiers (propriete intellectuelle, vie privee)
- Que ce Contenu n'est pas illicite, diffamatoire ou contraire a l'ordre public

**5.3 Donnees clients**

En qualite de responsable de traitement des donnees de ses Clients Finaux, l'Utilisateur Professionnel s'engage a :
- Informer ses Clients Finaux de la collecte et du traitement de leurs donnees
- Recueillir leur consentement lorsque requis par le RGPD
- Respecter leurs droits (acces, rectification, effacement, portabilite)
- Ne collecter que les donnees strictement necessaires
- Assurer la securite et la confidentialite des donnees

**5.4 Activites interdites**

Sont strictement interdites :
- La revente ou mise a disposition de l'acces a la Plateforme a des tiers
- L'extraction systematique de donnees (scraping)
- L'utilisation de robots, scripts automatises ou tout procede similaire
- Toute tentative d'intrusion ou d'atteinte a la securite
- L'usurpation d'identite
    `.trim(),
  },
  {
    id: "obligations-safemotor",
    title: "Article 6 - Obligations de SafeMotor",
    content: `
**6.1 Fourniture des Services**

SafeMotor s'engage a :
- Mettre a disposition les Services decrits a l'Article 4
- Assurer la disponibilite de la Plateforme conformement aux engagements de l'Article 4.2
- Informer l'Utilisateur des evolutions substantielles
- Fournir un support technique pendant les heures ouvrables

**6.2 Securite**

SafeMotor met en oeuvre les mesures techniques et organisationnelles appropriees pour assurer la securite des donnees :
- Chiffrement des donnees au repos (AES-256) et en transit (TLS 1.3)
- Authentification securisee (bcrypt pour les mots de passe)
- Sauvegardes quotidiennes
- Surveillance et detection des intrusions
- Hebergement sur infrastructure certifiee ISO 27001

**6.3 Protection des donnees**

SafeMotor s'engage a traiter les Donnees Personnelles conformement au RGPD et a la loi Informatique et Libertes. Les modalites de ce traitement sont detaillees dans notre Politique de Confidentialite.

**6.4 Sous-traitance**

SafeMotor fait appel a des sous-traitants pour certains aspects techniques (hebergement, paiement, emailing). La liste de ces sous-traitants est disponible sur la page Informations Legales. SafeMotor s'assure que ces sous-traitants presentent des garanties suffisantes en matiere de protection des donnees.
    `.trim(),
  },
  {
    id: "propriete-intellectuelle",
    title: "Article 7 - Propriete intellectuelle",
    content: `
**7.1 Droits de SafeMotor**

La Plateforme, son interface, son code source, ses logos, marques, et tout element graphique ou fonctionnel sont la propriete exclusive de SafeMotor ou de ses concedants. Ils sont proteges par les lois francaises et internationales relatives a la propriete intellectuelle.

Toute reproduction, representation, modification, publication, ou exploitation, totale ou partielle, de ces elements est interdite sans autorisation prealable ecrite de SafeMotor.

L'Utilisateur beneficie d'un droit d'utilisation personnel, non exclusif et non cessible, limite a l'acces et a l'utilisation de la Plateforme conformement aux presentes CGU.

**7.2 Droits de l'Utilisateur**

L'Utilisateur conserve l'integralite de ses droits sur le Contenu qu'il publie sur la Plateforme. Il concede toutefois a SafeMotor une licence non exclusive, mondiale et gratuite pour heberger, stocker, reproduire et afficher ce Contenu aux seules fins de fourniture des Services.

Cette licence prend fin a la suppression du Contenu par l'Utilisateur ou a la resiliation de son Compte.

**7.3 Feedback**

Toute suggestion, idee d'amelioration ou retour transmis par l'Utilisateur concernant la Plateforme pourra etre librement utilise par SafeMotor sans contrepartie ni obligation.
    `.trim(),
  },
  {
    id: "responsabilite",
    title: "Article 8 - Responsabilite",
    content: `
**8.1 Responsabilite de SafeMotor**

SafeMotor s'engage a fournir les Services avec diligence et conformement aux regles de l'art. Toutefois, les obligations de SafeMotor constituent des obligations de moyens.

SafeMotor ne saurait etre tenue responsable :
- Des interruptions temporaires pour maintenance ou cas de force majeure
- Des dommages indirects (perte de chiffre d'affaires, de clientele, de donnees)
- Des dysfonctionnements lies a l'equipement ou a la connexion de l'Utilisateur
- Du Contenu publie par l'Utilisateur
- De l'utilisation frauduleuse des identifiants de l'Utilisateur

En tout etat de cause, la responsabilite de SafeMotor est limitee au montant des sommes versees par l'Utilisateur au cours des 12 mois precedant l'evenement dommageable.

**8.2 Responsabilite de l'Utilisateur**

L'Utilisateur est seul responsable de :
- L'utilisation qu'il fait de la Plateforme
- La conformite du Contenu aux lois et reglements
- La conservation et la confidentialite de ses identifiants
- Les relations avec ses Clients Finaux
- Le respect de ses obligations en qualite de responsable de traitement

L'Utilisateur garantit SafeMotor contre toute reclamation, action ou recours de tiers resultant de l'utilisation qu'il fait de la Plateforme.

**8.3 Force majeure**

SafeMotor ne saurait etre tenue responsable de l'inexecution de ses obligations en cas de force majeure au sens de l'article 1218 du Code civil.
    `.trim(),
  },
  {
    id: "duree-resiliation",
    title: "Article 9 - Duree et resiliation",
    content: `
**9.1 Duree**

Les presentes CGU entrent en vigueur a compter de leur acceptation par l'Utilisateur et restent en vigueur tant que l'Utilisateur dispose d'un Compte actif sur la Plateforme.

**9.2 Resiliation par l'Utilisateur**

L'Utilisateur peut resilier son Compte a tout moment depuis les parametres de son compte ou par email a support@safemotor.fr. La resiliation prend effet :
- A la fin de la periode d'abonnement en cours pour les abonnements mensuels
- A la date de la demande pour les comptes gratuits ou en periode d'essai

**9.3 Resiliation par SafeMotor**

SafeMotor peut resilier le Compte d'un Utilisateur :
- Immediatement en cas de violation grave des CGU
- Avec un preavis de 30 jours en cas de manquement non resolu apres mise en demeure
- Avec un preavis de 3 mois en cas de cessation de l'activite

**9.4 Consequences de la resiliation**

A la resiliation :
- L'Utilisateur perd l'acces a son Compte et aux Services
- Les donnees sont conservees pendant 30 jours puis supprimees, sauf obligation legale de conservation
- L'Utilisateur peut demander l'export de ses donnees avant la resiliation
- Aucun remboursement n'est du pour la periode non ecoulee (sauf resiliation fautive de SafeMotor)
    `.trim(),
  },
  {
    id: "dispositions-diverses",
    title: "Article 10 - Dispositions diverses",
    content: `
**10.1 Modification des CGU**

SafeMotor se reserve le droit de modifier les presentes CGU a tout moment. Les modifications seront notifiees aux Utilisateurs par email et/ou par affichage sur la Plateforme au moins 30 jours avant leur entree en vigueur.

L'utilisation continuee de la Plateforme apres l'entree en vigueur des nouvelles CGU vaut acceptation de celles-ci. En cas de desaccord, l'Utilisateur peut resilier son Compte dans les conditions prevues a l'Article 9.

**10.2 Integralite**

Les presentes CGU constituent l'integralite de l'accord entre l'Utilisateur et SafeMotor concernant l'utilisation de la Plateforme. Elles remplacent tout accord anterieur ecrit ou oral.

**10.3 Nullite partielle**

Si une disposition des presentes CGU etait declaree nulle ou inapplicable, les autres dispositions resteraient en vigueur. La disposition nulle serait remplacee par une disposition valide se rapprochant le plus de l'intention originelle.

**10.4 Non-renonciation**

Le fait pour SafeMotor de ne pas exercer un droit prevu aux presentes CGU ne saurait constituer une renonciation a ce droit.

**10.5 Cession**

L'Utilisateur ne peut ceder ses droits et obligations au titre des presentes CGU sans l'accord prealable ecrit de SafeMotor. SafeMotor peut librement ceder les presentes CGU a tout successeur ou acquereur.
    `.trim(),
  },
  {
    id: "droit-applicable",
    title: "Article 11 - Droit applicable et juridiction",
    content: `
**11.1 Droit applicable**

Les presentes CGU sont regies par le droit francais.

**11.2 Reglement amiable**

En cas de litige, les parties s'engagent a rechercher une solution amiable avant toute action judiciaire. L'Utilisateur peut adresser sa reclamation a support@safemotor.fr. SafeMotor s'engage a repondre dans un delai de 15 jours ouvrables.

**11.3 Mediation**

Conformement aux articles L.612-1 et suivants du Code de la consommation, l'Utilisateur consommateur peut recourir gratuitement a un mediateur de la consommation en cas de litige non resolu.

**11.4 Juridiction competente**

A defaut de resolution amiable, tout litige relatif a l'interpretation ou a l'execution des presentes CGU sera soumis a la competence exclusive des tribunaux de Paris, sous reserve des regles imperatives de competence territoriale.
    `.trim(),
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function CGUPage() {
  const { isMobile, isTablet } = useResponsive();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["objet"]));

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(CGU_SECTIONS.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={handlePrint}
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
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: isMobile ? "40px 16px 32px" : "64px 24px 48px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={24} color="#fff" />
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
                Conditions Generales d&apos;Utilisation
              </h1>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0 0" }}>
                Regles d&apos;utilisation de la plateforme SafeMotor
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginTop: "24px",
            }}
          >
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

      {/* Table of contents + Content */}
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
        {/* Table of contents - Sidebar */}
        {!isMobile && (
          <aside
            style={{
              position: isTablet ? "relative" : "sticky",
              top: "100px",
              height: "fit-content",
            }}
          >
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
                {CGU_SECTIONS.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(section.id);
                      if (!expandedSections.has(section.id)) {
                        toggleSection(section.id);
                      }
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
                      color: activeSection === section.id ? "#6366F1" : "#374151",
                      background: activeSection === section.id ? "rgba(99, 102, 241, 0.08)" : "transparent",
                      fontWeight: activeSection === section.id ? 600 : 400,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        background: activeSection === section.id ? "#6366F1" : "#F3F4F6",
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
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
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

        {/* Content */}
        <div>
          {/* Important Notice */}
          <div
            style={{
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "12px",
              padding: isMobile ? "16px" : "20px",
              marginBottom: "24px",
              display: "flex",
              gap: "12px",
            }}
          >
            <AlertTriangle size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#92400E", margin: "0 0 6px 0" }}>
                Document contractuel
              </h4>
              <p style={{ fontSize: "13px", color: "#B45309", margin: 0, lineHeight: 1.6 }}>
                En utilisant SafeMotor, vous acceptez les presentes Conditions Generales d&apos;Utilisation.
                Veuillez les lire attentivement avant de creer votre compte.
              </p>
            </div>
          </div>

          {/* Mobile: expand/collapse all buttons */}
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
            {CGU_SECTIONS.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: expandedSections.has(section.id) ? "1px solid #6366F1" : "1px solid #E5E7EB",
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
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
                        ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
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
                  <span
                    style={{
                      flex: 1,
                      fontSize: isMobile ? "15px" : "16px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
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
                  <div
                    style={{
                      padding: isMobile ? "0 16px 20px" : "0 20px 24px",
                      paddingLeft: isMobile ? "16px" : "60px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#374151",
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                      }}
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

          {/* Contact Section */}
          <div
            style={{
              marginTop: "32px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
              borderRadius: "14px",
              border: "1px solid rgba(99, 102, 241, 0.15)",
              padding: isMobile ? "20px" : "28px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Une question sur ces CGU ?
            </h3>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "16px", lineHeight: 1.6 }}>
              Notre equipe juridique est a votre disposition pour toute question relative aux presentes
              Conditions Generales d&apos;Utilisation.
            </p>
            <a
              href="mailto:legal@safemotor.fr"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Mail size={16} />
              Contacter le service juridique
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
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
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
            <Link href="/cgv" style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              CGV
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
