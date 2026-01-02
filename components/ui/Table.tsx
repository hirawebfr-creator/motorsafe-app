import type { HTMLAttributes } from "react";

type TableProps = HTMLAttributes<HTMLDivElement>;

export function Table({ className = "", ...props }: TableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--sh)] ${className}`}
      {...props}
    />
  );
}
