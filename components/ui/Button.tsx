import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--rButton)] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--accent)] text-white shadow-[var(--shCard)] hover:bg-[color:var(--accentHover)] active:translate-y-[1px]",
  secondary:
    "bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border)] hover:bg-[color:var(--surface2)] hover:border-[rgba(255,255,255,0.12)] active:translate-y-[1px]",
  ghost: "bg-transparent text-[color:var(--text)] hover:bg-[color:var(--surface2)] active:translate-y-[1px]",
  outline:
    "bg-transparent text-[color:var(--text)] border border-[color:var(--border)] hover:bg-[color:var(--surface2)] hover:border-[rgba(255,255,255,0.12)] active:translate-y-[1px]",
  destructive:
    "bg-[rgba(239,68,68,0.14)] text-[color:var(--danger)] border border-[rgba(239,68,68,0.35)] hover:bg-[rgba(239,68,68,0.22)] active:translate-y-[1px]",
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
