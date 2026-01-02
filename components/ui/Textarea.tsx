import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className = "", label, ...props }: TextareaProps) {
  return (
    <label className="grid gap-2 text-sm text-[color:var(--textMuted)]">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <textarea
        className={`min-h-[120px] w-full rounded-[var(--rInput)] border border-[color:var(--border)] bg-[color:var(--surface2)] px-3 py-3 text-sm text-[color:var(--text)] placeholder:text-[color:var(--textMuted)] outline-none transition focus:border-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[rgba(124,92,255,0.45)] ${className}`}
        {...props}
      />
    </label>
  );
}
