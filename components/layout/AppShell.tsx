"use client";

import type { SessionUser } from "@/lib/auth";
import type { NavItem } from "@/components/layout/nav-config";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { useMemo } from "react";

type AppShellProps = {
  children: React.ReactNode;
  user?: SessionUser;
  navItems?: NavItem[];
  activePath?: string;
  sidebarOpen?: boolean;
  onSidebarClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onMenu?: () => void;
  onLogout?: () => void;
};

export function AppShell({
  children,
  user,
  navItems = [],
  onLogout = () => {},
}: AppShellProps) {
  const visibleNavItems = useMemo(
    () => navItems.filter((n) => !n.adminOnly || user?.role === "ADMIN"),
    [navItems, user?.role]
  );

  return (
    <div className="min-h-screen bg-[var(--ms-bg)]">
      <DesktopSidebar user={user} navItems={visibleNavItems} onLogout={onLogout} />
      
      <main className="ml-[260px] min-h-screen flex flex-col">
        <MaintenanceBanner />
        <div className="flex-1 mx-auto max-w-6xl px-8 py-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
