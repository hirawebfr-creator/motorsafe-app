"use client";

import { useEffect, useId, useRef, useState } from "react";

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef} data-dropdown={id}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="contents" aria-expanded={open}>
        {trigger}
      </button>
      {open ? (
        <div
          className={`absolute z-50 mt-2 min-w-[240px] rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--sh)] p-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text)] hover:bg-white/5"
    >
      {children}
    </button>
  );
}
