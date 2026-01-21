"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { UserProvider } from "@/components/user-context";
import { AppShell } from "@/components/layout/AppShell";
import { CommandPalette, CommandItem } from "@/components/shared/command-palette";
import { useCommandPalette } from "@/components/shared/use-command-palette";
import { Toaster } from "sonner";
import type { SessionUser } from "@/lib/auth";

export default function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOpen, close } = useCommandPalette();

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

  // Command palette navigation items from nav config
  const commandItems: CommandItem[] = useMemo(
    () =>
      filteredNav.map((item) => ({
        id: `nav-${item.href}`,
        type: 'navigation' as const,
        title: item.label,
        description: item.href,
        keywords: [item.label.toLowerCase()],
        onSelect: () => router.push(item.href),
      })),
    [filteredNav, router]
  );

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
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        items={commandItems}
        placeholder="Rechercher ou taper une commande..."
        emptyText="Aucun résultat trouvé"
      />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: "var(--ms-surface)",
            border: "1px solid var(--ms-border)",
            color: "var(--ms-text)",
          },
        }}
      />
    </UserProvider>
  );
}
