import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ className = "", label, children, ...props }: SelectProps) {
  return (
    <label className="grid gap-2 text-sm text-[color:var(--textMuted)]">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <select
        className={`min-h-[44px] w-full rounded-[var(--rInput)] border border-[color:var(--border)] bg-[color:var(--surface2)] px-3 py-2 text-sm text-[color:var(--text)] outline-none transition focus:border-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[rgba(139,92,246,0.45)] ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
