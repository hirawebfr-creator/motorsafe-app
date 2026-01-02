import type { HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "neutral" | "accent";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  success: "bg-[rgba(34,197,94,0.16)] text-[color:var(--success)]",
  warning: "bg-[rgba(251,191,36,0.14)] text-[rgba(251,191,36,0.92)]",
  neutral: "bg-[rgba(255,255,255,0.06)] text-[color:var(--textMuted)]",
  accent: "bg-[rgba(124,92,255,0.16)] text-[color:var(--accent)]",
};

export function Badge({ className = "", variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
