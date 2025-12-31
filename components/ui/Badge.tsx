import type { HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "neutral" | "accent";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  success: "bg-[rgba(34,197,94,0.16)] text-[#4ade80] border-[rgba(34,197,94,0.45)]",
  warning: "bg-[rgba(251,191,36,0.14)] text-[#facc15] border-[rgba(251,191,36,0.4)]",
  neutral: "bg-[rgba(156,163,175,0.12)] text-[var(--muted)] border-[rgba(31,41,55,0.7)]",
  accent: "bg-[rgba(139,92,246,0.18)] text-[var(--accent-2)] border-[rgba(139,92,246,0.5)]",
};

export function Badge({ className = "", variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
