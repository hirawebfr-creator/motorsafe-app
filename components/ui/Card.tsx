import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-[rgba(31,41,55,0.7)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] backdrop-blur ${className}`}
      {...props}
    />
  );
}
