"use client";

import { cn } from "@/lib/cn";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn("flex items-center gap-3 text-sm", disabled ? "opacity-60" : "text-muted2")}>
      <button
        type="button"
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => (disabled ? null : onChange(!checked))}
        className={cn(
          "relative h-7 w-12 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
          checked ? "border-primary bg-primary/18" : "border-border bg-surface",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border/40 bg-surface2 shadow-sm transition",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
