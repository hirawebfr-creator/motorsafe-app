"use client";

import { usePathname } from "next/navigation";
import { ProSidebarMenu } from "@/components/layout/responsive/ProSidebarMenu";

/**
 * ResponsiveSidebar
 * - Mobile: Drawer (hidden by default, toggled by button)
 * - Desktop: Fixed sidebar
 */
export default function ResponsiveSidebar({ children }: { children: React.ReactNode }) {
  usePathname?.();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 h-full flex-col rounded-[var(--rCard)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shCard)]">
        <ProSidebarMenu />
        {children}
      </aside>
      {/* Mobile drawer (à implémenter si besoin) */}
    </>
  );
}
