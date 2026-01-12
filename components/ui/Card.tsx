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
