import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className = "", label, ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-sm text-[color:var(--textMuted)]">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <input
        className={`min-h-[44px] w-full rounded-[var(--rInput)] border border-[color:var(--border)] bg-[color:var(--surface2)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--textMuted)] outline-none transition focus:border-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[rgba(139,92,246,0.45)] ${className}`}
        {...props}
      />
    </label>
  );
}
