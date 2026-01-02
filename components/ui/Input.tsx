import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className = "", label, ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-xs text-muted2">
      {label ? <span className="ms-kicker">{label}</span> : null}
      <input
        className={cn("ms-input text-sm outline-none", className)}
        {...props}
      />
    </label>
  );
}
