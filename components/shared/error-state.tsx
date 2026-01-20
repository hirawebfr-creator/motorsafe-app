"use client";

import { cn } from "@/lib/cn";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données. Veuillez réessayer.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ms-error-light)] mb-4">
        <AlertTriangle className="h-7 w-7 text-[var(--ms-error)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--ms-text)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--ms-text-secondary)] max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-[var(--ms-text)] bg-white border border-[var(--ms-border)] hover:bg-[var(--ms-surface-hover)] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      )}
    </div>
  );
}
