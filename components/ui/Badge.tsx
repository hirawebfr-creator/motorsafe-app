import type { HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "neutral" | "accent";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  success: "bg-[rgba(40,199,111,0.16)] text-[#4ade80] border-[rgba(40,199,111,0.4)]",
  warning: "bg-[rgba(251,191,36,0.14)] text-[#facc15] border-[rgba(251,191,36,0.4)]",
  neutral: "bg-[rgba(148,163,184,0.15)] text-[var(--muted)] border-[var(--border)]",
  accent: "bg-[rgba(124,92,255,0.18)] text-[var(--accent-2)] border-[rgba(124,92,255,0.45)]",
};

export function Badge({ className = "", variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
