"use client";

import type { ReactNode } from "react";

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="w-full h-full flex flex-col p-4 rounded-[var(--rCard)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shCard)]">
      {children}
    </aside>
  );
}
