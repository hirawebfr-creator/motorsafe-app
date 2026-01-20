"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--ms-bg-subtle)] text-[var(--ms-text-secondary)]",
        primary: "bg-[var(--ms-primary-light)] text-[var(--ms-primary)]",
        success: "bg-[var(--ms-success-light)] text-[var(--ms-success)]",
        warning: "bg-[var(--ms-warning-light)] text-[#B45309]",
        danger: "bg-[var(--ms-error-light)] text-[var(--ms-error)]",
        info: "bg-[var(--ms-info-light)] text-[var(--ms-info)]",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Predefined status mappings for common use cases
const statusConfig: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "info" }> = {
  // Interventions
  DRAFT: { label: "Brouillon", variant: "default" },
  OPEN: { label: "En cours", variant: "info" },
  DONE: { label: "Terminée", variant: "success" },
  CANCELED: { label: "Annulée", variant: "danger" },
  // Devis
  SENT: { label: "Envoyé", variant: "info" },
  ACCEPTED: { label: "Accepté", variant: "success" },
  REJECTED: { label: "Refusé", variant: "danger" },
  CONVERTED: { label: "Converti", variant: "default" },
  // Factures
  ISSUED: { label: "Émise", variant: "info" },
  PAID: { label: "Payée", variant: "success" },
  OVERDUE: { label: "En retard", variant: "danger" },
  // Generic
  PENDING: { label: "En attente", variant: "warning" },
  ACTIVE: { label: "Actif", variant: "success" },
  INACTIVE: { label: "Inactif", variant: "default" },
};

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status?: string;
  label?: string;
  dot?: boolean;
}

export function StatusBadge({
  className,
  variant,
  size,
  status,
  label,
  dot = true,
  ...props
}: StatusBadgeProps) {
  // If status is provided, use predefined config
  const config = status ? statusConfig[status] : null;
  const displayLabel = label ?? config?.label ?? status ?? "Inconnu";
  const displayVariant = variant ?? config?.variant ?? "default";

  return (
    <span
      className={cn(statusBadgeVariants({ variant: displayVariant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            displayVariant === "default" && "bg-[var(--ms-text-muted)]",
            displayVariant === "primary" && "bg-[var(--ms-primary)]",
            displayVariant === "success" && "bg-[var(--ms-success)]",
            displayVariant === "warning" && "bg-[var(--ms-warning)]",
            displayVariant === "danger" && "bg-[var(--ms-error)]",
            displayVariant === "info" && "bg-[var(--ms-info)]"
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}
