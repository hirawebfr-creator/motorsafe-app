"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "destructive";
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
};

export function Dialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  confirmVariant = "primary",
  onConfirm,
  onOpenChange,
  children,
}: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        className="absolute inset-0 bg-black/60"
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-lg rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-6 shadow-[var(--sh)]">
        <div className="grid gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? <p className="text-sm text-[color:var(--textMuted)]">{description}</p> : null}
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
