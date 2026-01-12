"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { cn } from "@/lib/cn";

export function DropdownMenu({
  trigger,
  children,
  align = "right",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onTouch = (e: TouchEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onTouch);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onTouch);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  type TriggerProps = {
    onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: "menu";
  };

  const handleTriggerClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    setOpen((v) => !v);
  };

  const triggerElement = isValidElement<TriggerProps>(trigger) ? (trigger as ReactElement<TriggerProps>) : null;

  const triggerNode = triggerElement
    ? cloneElement(triggerElement, {
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          triggerElement.props.onClick?.(event);
          handleTriggerClick(event);
        },
        "aria-expanded": open,
        "aria-haspopup": "menu",
      })
    : (
        <button
          type="button"
          onClick={handleTriggerClick}
          className="inline-flex items-center gap-2"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {trigger}
        </button>
      );

  return (
    <div className="relative" ref={rootRef} data-dropdown={id}>
      {triggerNode}
      {open ? (
        <div
          className={`absolute z-50 mt-2 min-w-[240px] rounded-[var(--r)] border border-border bg-surface/95 backdrop-blur shadow-[var(--shDropdown)] p-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

type DropdownItemChildProps = {
  className?: string;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  role?: string;
};

export function DropdownItem({
  children,
  onClick,
  asChild = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  asChild?: boolean;
}) {
  const itemClass =
    "w-full rounded-[var(--rButton)] px-3 py-2 text-left text-sm text-text transition hover:bg-surface2/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

  if (asChild && isValidElement<DropdownItemChildProps>(children)) {
    const child = children as ReactElement<DropdownItemChildProps>;
    return cloneElement(child, {
      className: cn(itemClass, child.props.className ?? ""),
      role: "menuitem",
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        child.props.onClick?.(event);
        onClick?.();
      },
    });
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={itemClass}
    >
      {children}
    </button>
  );
}
