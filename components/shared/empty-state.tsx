"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { LucideIcon, FileText, Users, Car, Wrench, Package } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  default: FileText,
  users: Users,
  clients: Users,
  car: Car,
  vehicules: Car,
  vehicles: Car,
  wrench: Wrench,
  interventions: Wrench,
  package: Package,
};

interface EmptyStateProps {
  icon?: string | LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = "default",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = typeof icon === "string" ? icons[icon] || icons.default : icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ms-bg-subtle)] mb-4">
        <Icon className="h-7 w-7 text-[var(--ms-text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--ms-text)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--ms-text-secondary)] max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-white bg-[var(--ms-primary)] hover:bg-[var(--ms-primary-hover)] transition-colors"
          >
            {action.label}
          </Link>
        ) : action.onClick ? (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-white bg-[var(--ms-primary)] hover:bg-[var(--ms-primary-hover)] transition-colors"
          >
            {action.label}
          </button>
        ) : null
      )}
    </div>
  );
}
