"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Car,
  Wrench,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { UserProvider } from "@/components/user-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import type { SessionUser } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Vehicules", href: "/vehicules", icon: Car },
  { label: "Interventions", href: "/interventions", icon: Wrench },
  { label: "Documents PDF", href: "/documents", icon: FileText },
  { label: "Parametres", href: "/parametres", icon: Settings },
  { label: "Pro demandes", href: "/admin/pro-demandes", icon: ShieldCheck, adminOnly: true },
  { label: "References legales", href: "/admin/references", icon: ShieldCheck, adminOnly: true },
];

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
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px]">
          <Sidebar
            user={user}
            navItems={filteredNav}
            activePath={pathname}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
          />

          <div className={`flex min-h-screen flex-1 flex-col ${collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}`}>
            <Topbar
              onMenu={() => setSidebarOpen(true)}
              onToggleCreate={() => setCreateOpen((open) => !open)}
              createOpen={createOpen}
              onLogout={handleLogout}
            />
            <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
          </div>
        </div>
        <MobileNav navItems={filteredNav} activePath={pathname} />
      </div>
    </UserProvider>
  );
}
