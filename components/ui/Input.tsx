import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className = "", label, ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-sm text-[var(--muted)]">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <input
        className={`h-11 w-full rounded-[var(--radius-sm)] border border-[rgba(31,41,55,0.7)] bg-[var(--panel)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(139,92,246,0.25)] ${className}`}
        {...props}
      />
    </label>
  );
}
