"use client";

import type { ReactNode } from "react";

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="ms-card w-full h-full flex flex-col p-4">
      {children}
    </aside>
  );
}
