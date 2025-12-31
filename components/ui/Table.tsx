import type { HTMLAttributes } from "react";

type TableProps = HTMLAttributes<HTMLDivElement>;

export function Table({ className = "", ...props }: TableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--card)] ${className}`}
      {...props}
    />
  );
}
