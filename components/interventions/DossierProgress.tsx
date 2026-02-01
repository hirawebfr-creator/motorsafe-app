"use client";

/**
 * UX-IMPROVEMENT-01: Dossier Progress Component
 *
 * Displays a visual progress bar showing the state of an intervention dossier.
 * Steps: Reception > Devis > OR > Travaux > Restitution > Facture
 *
 * Each step shows: completed (green), in progress (orange), pending (gray)
 */

import { Check, Circle, AlertCircle } from "lucide-react";

export interface DossierStep {
  id: string;
  label: string;
  status: "completed" | "in_progress" | "pending" | "skipped";
  href?: string;
}

interface DossierProgressProps {
  steps: DossierStep[];
  currentStepIndex?: number;
  showPercentage?: boolean;
  compact?: boolean;
}

export function DossierProgress({
  steps,
  showPercentage = true,
  compact = false,
}: DossierProgressProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  const getStepColor = (status: DossierStep["status"]) => {
    switch (status) {
      case "completed":
        return {
          bg: "var(--ms-success)",
          text: "#fff",
          border: "var(--ms-success)",
        };
      case "in_progress":
        return {
          bg: "var(--ms-warning)",
          text: "#fff",
          border: "var(--ms-warning)",
        };
      case "skipped":
        return {
          bg: "var(--ms-bg-subtle)",
          text: "var(--ms-text-secondary)",
          border: "var(--ms-border)",
        };
      default:
        return {
          bg: "var(--ms-bg-subtle)",
          text: "var(--ms-text-secondary)",
          border: "var(--ms-border)",
        };
    }
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
  };

  const progressBarContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: compact ? "4px" : "8px",
    marginBottom: showPercentage ? "8px" : "0",
  };

  const stepContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flex: 1,
  };

  const stepCircleStyle = (status: DossierStep["status"]): React.CSSProperties => {
    const colors = getStepColor(status);
    return {
      width: compact ? "24px" : "32px",
      height: compact ? "24px" : "32px",
      borderRadius: "50%",
      backgroundColor: colors.bg,
      border: `2px solid ${colors.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.text,
      fontSize: compact ? "12px" : "14px",
      fontWeight: 600,
      flexShrink: 0,
      transition: "all 0.2s ease",
    };
  };

  const connectorStyle = (isCompleted: boolean): React.CSSProperties => ({
    flex: 1,
    height: "3px",
    backgroundColor: isCompleted ? "var(--ms-success)" : "var(--ms-border)",
    margin: "0 4px",
    borderRadius: "2px",
    transition: "background-color 0.2s ease",
  });

  const labelStyle = (status: DossierStep["status"]): React.CSSProperties => ({
    fontSize: compact ? "10px" : "11px",
    fontWeight: status === "in_progress" ? 600 : 500,
    color:
      status === "completed"
        ? "var(--ms-success)"
        : status === "in_progress"
        ? "var(--ms-warning)"
        : "var(--ms-text-secondary)",
    textAlign: "center",
    marginTop: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: compact ? "50px" : "80px",
  });

  const percentageStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "8px",
  };

  const progressBarBgStyle: React.CSSProperties = {
    flex: 1,
    height: "6px",
    backgroundColor: "var(--ms-bg-subtle)",
    borderRadius: "3px",
    overflow: "hidden",
    marginRight: "12px",
  };

  const progressBarFillStyle: React.CSSProperties = {
    width: `${percentage}%`,
    height: "100%",
    backgroundColor: percentage === 100 ? "var(--ms-success)" : "var(--ms-primary)",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  };

  const percentageTextStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
    color: percentage === 100 ? "var(--ms-success)" : "var(--ms-text)",
    minWidth: "36px",
    textAlign: "right",
  };

  return (
    <div style={containerStyle}>
      {/* Steps row */}
      <div style={progressBarContainerStyle}>
        {steps.map((step, index) => (
          <div key={step.id} style={stepContainerStyle}>
            {/* Step circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={stepCircleStyle(step.status)}>
                {step.status === "completed" ? (
                  <Check size={compact ? 14 : 18} />
                ) : step.status === "in_progress" ? (
                  <AlertCircle size={compact ? 14 : 18} />
                ) : (
                  <Circle size={compact ? 10 : 12} />
                )}
              </div>
              {!compact && <div style={labelStyle(step.status)}>{step.label}</div>}
            </div>

            {/* Connector line (not after last step) */}
            {index < steps.length - 1 && (
              <div style={connectorStyle(step.status === "completed")} />
            )}
          </div>
        ))}
      </div>

      {/* Compact labels below */}
      {compact && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          {steps.map((step) => (
            <div key={`label-${step.id}`} style={labelStyle(step.status)}>
              {step.label}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar with percentage */}
      {showPercentage && (
        <div style={percentageStyle}>
          <div style={progressBarBgStyle}>
            <div style={progressBarFillStyle} />
          </div>
          <span style={percentageTextStyle}>{percentage}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to build steps from intervention data
 */
export function buildDossierSteps(data: {
  pvReceptionDone: boolean;
  devisStatus?: "none" | "draft" | "sent" | "signed";
  orStatus?: "none" | "draft" | "sent" | "signed";
  interventionStatus: "DRAFT" | "OPEN" | "DONE" | "CANCELED";
  pvRestitutionDone: boolean;
  factureStatus?: "none" | "draft" | "issued" | "paid";
}): DossierStep[] {
  const {
    pvReceptionDone,
    devisStatus = "none",
    orStatus = "none",
    interventionStatus,
    pvRestitutionDone,
    factureStatus = "none",
  } = data;

  // Determine current step
  const isWorkDone = interventionStatus === "DONE";

  return [
    {
      id: "reception",
      label: "Reception",
      status: pvReceptionDone ? "completed" : "in_progress",
    },
    {
      id: "devis",
      label: "Devis",
      status:
        devisStatus === "signed"
          ? "completed"
          : devisStatus === "sent"
          ? "in_progress"
          : devisStatus === "draft"
          ? "in_progress"
          : pvReceptionDone
          ? "pending"
          : "pending",
    },
    {
      id: "or",
      label: "OR",
      status:
        orStatus === "signed"
          ? "completed"
          : orStatus === "sent" || orStatus === "draft"
          ? "in_progress"
          : "pending",
    },
    {
      id: "travaux",
      label: "Travaux",
      status: isWorkDone ? "completed" : interventionStatus === "OPEN" ? "in_progress" : "pending",
    },
    {
      id: "restitution",
      label: "Restitution",
      status: pvRestitutionDone ? "completed" : isWorkDone ? "in_progress" : "pending",
    },
    {
      id: "facture",
      label: "Facture",
      status:
        factureStatus === "paid"
          ? "completed"
          : factureStatus === "issued"
          ? "in_progress"
          : factureStatus === "draft"
          ? "in_progress"
          : "pending",
    },
  ];
}
