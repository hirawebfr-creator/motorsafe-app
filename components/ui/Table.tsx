import type { HTMLAttributes } from "react";

type TableProps = HTMLAttributes<HTMLDivElement>;

export function Table({ className = "", ...props }: TableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-[var(--radius)] border border-[rgba(31,41,55,0.7)] bg-[var(--card)] shadow-[var(--shadow-soft)] ${className}`}
      {...props}
    />
  );
}
