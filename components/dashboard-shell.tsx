"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-config";
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

  // Close drawer on route change (safety)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
        onMenu={() => setSidebarOpen(true)}
        onLogout={handleLogout}
      >
        {children}
      </AppShell>
    </UserProvider>
  );
}
