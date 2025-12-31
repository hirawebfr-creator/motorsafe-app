"use client";

import { useMemo, useState } from "react";
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
  { label: "Parametres", href: "/settings", icon: Settings },
  { label: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
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
          />

          <div className="flex min-h-screen flex-1 flex-col lg:ml-72">
            <Topbar
              onMenu={() => setSidebarOpen(true)}
              onToggleCreate={() => setCreateOpen((open) => !open)}
              createOpen={createOpen}
              onLogout={handleLogout}
            />
            <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
          </div>
        </div>
        <MobileNav navItems={filteredNav} activePath={pathname} />
      </div>
    </UserProvider>
  );
}
