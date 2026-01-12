"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type TooltipSide = "top" | "right" | "bottom" | "left";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
};

const sideClasses: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
  bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2",
  left: "right-full top-1/2 -translate-y-1/2 -translate-x-2",
  right: "left-full top-1/2 -translate-y-1/2 translate-x-2",
};

export function Tooltip({ content, children, side = "top", disabled }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  if (disabled || !content) return <>{children}</>;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-[14px] border border-border bg-surface/95 px-3 py-2 text-xs text-text shadow-[var(--shDropdown)] backdrop-blur transition",
          "opacity-0 scale-[0.98]",
          open ? "opacity-100 scale-100" : "",
          sideClasses[side]
        )}
      >
        {content}
      </span>
    </span>
  );
}
