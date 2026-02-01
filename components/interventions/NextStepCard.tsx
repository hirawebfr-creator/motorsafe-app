"use client";

/**
 * UX-IMPROVEMENT-01: Next Step Card Component
 *
 * Shows the recommended next action for an intervention dossier.
 * Contextual guidance based on current state.
 */

import { ArrowRight, FileText, ClipboardCheck, Send, Receipt, CheckCircle } from "lucide-react";
import Link from "next/link";

export interface NextStepInfo {
  step: "reception" | "devis" | "or" | "travaux" | "restitution" | "facture" | "complete";
  title: string;
  description: string;
  href?: string;
  buttonLabel?: string;
  icon: React.ReactNode;
}

interface NextStepCardProps {
  nextStep: NextStepInfo;
  interventionId: string;
}

export function NextStepCard({ nextStep }: NextStepCardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: nextStep.step === "complete" ? "var(--ms-success-light)" : "var(--ms-primary-light)",
    border: `1px solid ${nextStep.step === "complete" ? "var(--ms-success)" : "var(--ms-primary)"}`,
    borderRadius: "12px",
    padding: "16px",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  };

  const iconContainerStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: nextStep.step === "complete" ? "var(--ms-success)" : "var(--ms-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: nextStep.step === "complete" ? "var(--ms-success)" : "var(--ms-primary)",
    margin: 0,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--ms-text-secondary)",
    margin: "0 0 12px 0",
    lineHeight: 1.4,
  };

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    backgroundColor: nextStep.step === "complete" ? "var(--ms-success)" : "var(--ms-primary)",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    transition: "opacity 0.2s",
  };

  if (nextStep.step === "complete") {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconContainerStyle}>
            <CheckCircle size={20} />
          </div>
          <h4 style={titleStyle}>Dossier complet</h4>
        </div>
        <p style={descriptionStyle}>
          Toutes les etapes de ce dossier ont ete completees. Le PV de restitution a ete signe et la facture est reglee.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={iconContainerStyle}>{nextStep.icon}</div>
        <h4 style={titleStyle}>Prochaine etape : {nextStep.title}</h4>
      </div>
      <p style={descriptionStyle}>{nextStep.description}</p>
      {nextStep.href && nextStep.buttonLabel && (
        <Link href={nextStep.href} style={buttonStyle}>
          {nextStep.buttonLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

/**
 * Determine the next step based on intervention state
 */
export function getNextStep(data: {
  interventionId: string;
  pvReceptionDone: boolean;
  hasDevis: boolean;
  devisSigned: boolean;
  hasOr: boolean;
  orSigned: boolean;
  interventionStatus: "DRAFT" | "OPEN" | "DONE" | "CANCELED";
  pvRestitutionDone: boolean;
  hasFacture: boolean;
  facturePaid: boolean;
}): NextStepInfo {
  const {
    interventionId,
    pvReceptionDone,
    hasDevis,
    devisSigned,
    hasOr,
    interventionStatus,
    pvRestitutionDone,
    hasFacture,
    facturePaid,
  } = data;
  // Note: orSigned could be used in future for OR step validation

  // Step 1: Reception
  if (!pvReceptionDone) {
    return {
      step: "reception",
      title: "PV de Reception",
      description: "Completez le proces-verbal de reception avec le kilometrage, les photos et la signature du client.",
      href: `/interventions/${interventionId}/reception`,
      buttonLabel: "Faire le PV Reception",
      icon: <ClipboardCheck size={20} />,
    };
  }

  // Step 2: Devis (optional but recommended)
  if (!hasDevis) {
    return {
      step: "devis",
      title: "Creer un devis",
      description: "Etablissez un devis pour les travaux a effectuer. Le client pourra le signer electroniquement.",
      href: `/devis/nouveau?interventionId=${interventionId}`,
      buttonLabel: "Creer le devis",
      icon: <FileText size={20} />,
    };
  }

  // Step 3: Devis not signed yet
  if (hasDevis && !devisSigned) {
    return {
      step: "devis",
      title: "Faire signer le devis",
      description: "Le devis a ete cree mais n'a pas encore ete signe par le client.",
      href: `/devis?interventionId=${interventionId}`,
      buttonLabel: "Voir le devis",
      icon: <Send size={20} />,
    };
  }

  // Step 4: OR (after devis signed)
  if (!hasOr && devisSigned) {
    return {
      step: "or",
      title: "Ordre de Reparation",
      description: "Generez l'ordre de reparation pour officialiser les travaux a effectuer.",
      href: `/interventions/${interventionId}?action=or`,
      buttonLabel: "Generer l'OR",
      icon: <FileText size={20} />,
    };
  }

  // Step 5: Work in progress
  if (interventionStatus !== "DONE") {
    return {
      step: "travaux",
      title: "Terminer les travaux",
      description: "Les travaux sont en cours. Passez le statut en 'Termine' une fois les travaux finis.",
      href: `/interventions/${interventionId}`,
      buttonLabel: "Voir l'intervention",
      icon: <ClipboardCheck size={20} />,
    };
  }

  // Step 6: Restitution
  if (!pvRestitutionDone) {
    return {
      step: "restitution",
      title: "PV de Restitution",
      description: "Effectuez les tests de sortie et faites signer le PV de restitution au client.",
      href: `/interventions/${interventionId}/restitution`,
      buttonLabel: "Faire le PV Restitution",
      icon: <ClipboardCheck size={20} />,
    };
  }

  // Step 7: Facture
  if (!hasFacture) {
    return {
      step: "facture",
      title: "Emettre la facture",
      description: "Le vehicule a ete restitue. Emettez la facture pour finaliser le dossier.",
      href: `/factures/nouveau?interventionId=${interventionId}`,
      buttonLabel: "Creer la facture",
      icon: <Receipt size={20} />,
    };
  }

  if (!facturePaid) {
    return {
      step: "facture",
      title: "Encaisser le paiement",
      description: "La facture a ete emise. En attente du reglement par le client.",
      href: `/factures?interventionId=${interventionId}`,
      buttonLabel: "Voir la facture",
      icon: <Receipt size={20} />,
    };
  }

  // Complete!
  return {
    step: "complete",
    title: "Dossier complet",
    description: "Toutes les etapes ont ete completees.",
    icon: <CheckCircle size={20} />,
  };
}
