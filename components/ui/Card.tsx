import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--sh)] ${className}`}
      {...props}
    />
  );
}
