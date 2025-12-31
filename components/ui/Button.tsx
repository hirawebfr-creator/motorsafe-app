import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-[0_16px_40px_rgba(139,92,246,0.35)] hover:bg-[var(--accent-2)]",
  secondary:
    "bg-[var(--card-strong)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)]",
  ghost: "bg-transparent text-[var(--text)] hover:bg-[rgba(139,92,246,0.12)]",
  outline:
    "bg-transparent text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)]",
  destructive:
    "bg-[rgba(239,68,68,0.12)] text-[#f87171] border border-[rgba(239,68,68,0.45)] hover:bg-[rgba(239,68,68,0.2)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  );
}
