import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className = "", label, ...props }: TextareaProps) {
  return (
    <label className="grid gap-2 text-sm text-[var(--muted)]">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <textarea
        className={`min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] ${className}`}
        {...props}
      />
    </label>
  );
}
