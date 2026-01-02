import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TableProps = HTMLAttributes<HTMLDivElement>;

export function Table({ className = "", ...props }: TableProps) {
  return (
    <div
      className={cn("ms-card overflow-x-auto", className)}
      {...props}
    />
  );
}
