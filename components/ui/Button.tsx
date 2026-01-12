import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--rButton)] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-bg shadow-[0_16px_40px_rgb(var(--accent)/0.14)] hover:bg-primaryHover",
  secondary:
    "bg-surface text-text border border-border/70 hover:bg-surface2",
  ghost: "bg-transparent text-text hover:bg-surface2/60",
  outline:
    "bg-transparent text-text border border-border hover:bg-surface2/70",
  danger:
    "bg-danger/12 text-danger border border-danger/35 hover:bg-danger/18",
  destructive:
    "bg-danger/12 text-danger border border-danger/35 hover:bg-danger/18",
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
    <button
      className={cn(base, "active:translate-y-[1px] active:shadow-none", variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
