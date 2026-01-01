"use client";

import { usePathname } from "next/navigation";
import { ProSidebarMenu } from "@/components/layout/responsive/ProSidebarMenu";

/**
 * ResponsiveSidebar
 * - Mobile: Drawer (hidden by default, toggled by button)
 * - Desktop: Fixed sidebar
 */
export default function ResponsiveSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname?.() || "/";
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 h-full bg-gradient-to-b from-[#1a1a2e] to-[#23234b] border-r border-border flex-col shadow-xl">
        <ProSidebarMenu />
        {children}
      </aside>
      {/* Mobile drawer (à implémenter si besoin) */}
    </>
  );
}
