import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ className = "", label, children, ...props }: SelectProps) {
  return (
    <label className="grid gap-2 text-xs text-muted2">
      {label ? <span className="ms-kicker">{label}</span> : null}
      <select
        className={cn("ms-input text-sm outline-none", className)}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
