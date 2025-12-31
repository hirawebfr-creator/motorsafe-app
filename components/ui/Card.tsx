import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_24px_60px_rgba(6,10,20,0.35)] ${className}`}
      {...props}
    />
  );
}
