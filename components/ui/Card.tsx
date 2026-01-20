import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--r)] border border-border bg-surface shadow-soft p-5 sm:p-6",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />;
}

export function CardTitle({ className = "", ...props }: CardProps) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className = "", ...props }: CardProps) {
  return <p className={cn("text-sm text-muted2", className)} {...props} />;
}

export function CardContent({ className = "", ...props }: CardProps) {
  return <div className={cn("", className)} {...props} />;
}
