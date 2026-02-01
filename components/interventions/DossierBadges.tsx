"use client";

/**
 * UX-IMPROVEMENT-01: Dossier Badges Component
 *
 * Compact badges showing dossier completion status at a glance.
 * Used in intervention list to show: PV | DEV | OR | RES | FAC
 */

import { Check, Minus, Clock } from "lucide-react";

export interface DossierBadgesData {
  pvReception: "done" | "pending" | "none";
  devis: "signed" | "sent" | "draft" | "none";
  or: "signed" | "sent" | "draft" | "none";
  pvRestitution: "done" | "pending" | "none";
  facture: "paid" | "issued" | "draft" | "none";
}

interface DossierBadgesProps {
  data: DossierBadgesData;
  size?: "sm" | "md";
}

export function DossierBadges({ data, size = "sm" }: DossierBadgesProps) {
  const badges = [
    { key: "pv", label: "PV", status: data.pvReception },
    { key: "dev", label: "DEV", status: mapDevisStatus(data.devis) },
    { key: "or", label: "OR", status: mapOrStatus(data.or) },
    { key: "res", label: "RES", status: data.pvRestitution },
    { key: "fac", label: "FAC", status: mapFactureStatus(data.facture) },
  ];

  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: size === "sm" ? "3px" : "4px",
    flexWrap: "wrap",
  };

  return (
    <div style={containerStyle}>
      {badges.map((badge) => (
        <Badge key={badge.key} label={badge.label} status={badge.status} size={size} />
      ))}
    </div>
  );
}

type BadgeStatus = "done" | "in_progress" | "pending" | "none";

interface BadgeProps {
  label: string;
  status: BadgeStatus;
  size: "sm" | "md";
}

function Badge({ label, status, size }: BadgeProps) {
  const getColors = () => {
    switch (status) {
      case "done":
        return {
          bg: "var(--ms-success-light, #d1fae5)",
          text: "var(--ms-success, #10b981)",
          border: "var(--ms-success, #10b981)",
        };
      case "in_progress":
        return {
          bg: "var(--ms-warning-light, #fef3c7)",
          text: "var(--ms-warning, #f59e0b)",
          border: "var(--ms-warning, #f59e0b)",
        };
      case "pending":
        return {
          bg: "var(--ms-bg-subtle, #f3f4f6)",
          text: "var(--ms-text-secondary, #6b7280)",
          border: "var(--ms-border, #e5e7eb)",
        };
      default:
        return {
          bg: "transparent",
          text: "var(--ms-text-secondary, #9ca3af)",
          border: "var(--ms-border, #e5e7eb)",
        };
    }
  };

  const colors = getColors();

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    padding: size === "sm" ? "2px 4px" : "3px 6px",
    fontSize: size === "sm" ? "9px" : "10px",
    fontWeight: 600,
    borderRadius: "4px",
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    whiteSpace: "nowrap",
  };

  const iconSize = size === "sm" ? 10 : 12;

  return (
    <span style={badgeStyle}>
      {status === "done" && <Check size={iconSize} />}
      {status === "in_progress" && <Clock size={iconSize} />}
      {status === "none" && <Minus size={iconSize} />}
      {label}
    </span>
  );
}

// Helper functions to map statuses
function mapDevisStatus(status: DossierBadgesData["devis"]): BadgeStatus {
  if (status === "signed") return "done";
  if (status === "sent" || status === "draft") return "in_progress";
  return "none";
}

function mapOrStatus(status: DossierBadgesData["or"]): BadgeStatus {
  if (status === "signed") return "done";
  if (status === "sent" || status === "draft") return "in_progress";
  return "none";
}

function mapFactureStatus(status: DossierBadgesData["facture"]): BadgeStatus {
  if (status === "paid") return "done";
  if (status === "issued" || status === "draft") return "in_progress";
  return "none";
}

/**
 * Build badges data from raw intervention data
 */
export function buildBadgesData(intervention: {
  intakeCompletedAt?: Date | string | null;
  deliveryCompletedAt?: Date | string | null;
  quote?: { status: string } | null;
  repairOrder?: { status: string } | null;
  invoice?: { status: string } | null;
}): DossierBadgesData {
  return {
    pvReception: intervention.intakeCompletedAt ? "done" : "pending",
    devis: mapQuoteStatus(intervention.quote?.status),
    or: mapRepairOrderStatus(intervention.repairOrder?.status),
    pvRestitution: intervention.deliveryCompletedAt ? "done" : "pending",
    facture: mapInvoiceStatus(intervention.invoice?.status),
  };
}

function mapQuoteStatus(status?: string): DossierBadgesData["devis"] {
  if (!status) return "none";
  if (status === "ACCEPTED" || status === "INVOICED") return "signed";
  if (status === "SENT") return "sent";
  if (status === "DRAFT") return "draft";
  return "none";
}

function mapRepairOrderStatus(status?: string): DossierBadgesData["or"] {
  if (!status) return "none";
  if (status === "SIGNED") return "signed";
  if (status === "SENT") return "sent";
  if (status === "DRAFT") return "draft";
  return "none";
}

function mapInvoiceStatus(status?: string): DossierBadgesData["facture"] {
  if (!status) return "none";
  if (status === "PAID") return "paid";
  if (status === "ISSUED" || status === "PARTIALLY_PAID") return "issued";
  if (status === "DRAFT") return "draft";
  return "none";
}
