"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, NavItem } from "@/components/layout/nav-config";
import { UserProvider } from "@/components/user-context";
import { AppShell } from "@/components/layout/AppShell";
import type { SessionUser } from "@/lib/auth";



export default function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ms_sidebar_collapsed");
    if (stored) {
      setCollapsed(stored === "1");
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("ms_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  };

  const filteredNav = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN"),
    [user.role]
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <UserProvider user={user}>
      <AppShell
        user={user}
        navItems={filteredNav}
        activePath={pathname}
        sidebarOpen={sidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onMenu={() => setSidebarOpen(true)}
        onToggleCreate={() => setCreateOpen((open) => !open)}
        createOpen={createOpen}
        onLogout={handleLogout}
      >
        {children}
      </AppShell>
    </UserProvider>
  );
}
