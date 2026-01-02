"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { TopBar } from "@/components/layout/Topbar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import Drawer from "@/components/ui/navigation/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  group?: "main" | "admin";
};

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
  onToggleCreate?: () => void;
  createOpen?: boolean;
  onLogout?: () => void;
};

export function AppShell({
  children,
  user,
  navItems = [],
  activePath,
  sidebarOpen = false,
  onSidebarClose = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
  onMenu = () => {},
  onToggleCreate = () => {},
  onLogout = () => {},
}: AppShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = usePathname?.() || activePath || "/";

  const pathname = path.split("?")[0] || "/";
  const qFromUrl = searchParams?.get("q") ?? "";
  const [globalQuery, setGlobalQuery] = useState(qFromUrl);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    setGlobalQuery(qFromUrl);
  }, [qFromUrl]);

  // Prevent stacked overlays: close mobile sheets on navigation.
  useEffect(() => {
    setMobileSearchOpen(false);
    onSidebarClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // If we switch to desktop viewport, ensure mobile drawers are closed.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      const nextIsDesktop = media.matches;
      setIsDesktop(nextIsDesktop);

      if (nextIsDesktop) {
        setMobileSearchOpen(false);
        onSidebarClose();
      }
    };

    handleChange();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    // Safari < 14
    (media as unknown as { addListener: (cb: () => void) => void }).addListener(handleChange);
    return () => {
      (media as unknown as { removeListener: (cb: () => void) => void }).removeListener(handleChange);
    };
  }, [onSidebarClose]);

  const desktopNav = useMemo(() => navItems, [navItems]);

  const applyGlobalSearch = () => {
    const next = globalQuery.trim();
    const params = new URLSearchParams(searchParams ? Array.from(searchParams.entries()) : []);
    if (next) params.set("q", next);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    setMobileSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <TopBar
        user={user}
        isDesktop={isDesktop}
        query={globalQuery}
        onQueryChange={setGlobalQuery}
        onSearch={applyGlobalSearch}
        onMenu={() => {
          setMobileSearchOpen(false);
          onMenu();
        }}
        onOpenMobileSearch={() => {
          onSidebarClose();
          setMobileSearchOpen(true);
        }}
        onLogout={onLogout}
        onToggleCreate={onToggleCreate}
      />

      {/* Layout */}
      <div className="mx-auto flex max-w-[1440px]">
        {isDesktop ? (
          <DesktopSidebar
            user={user}
            navItems={desktopNav}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            onLogout={onLogout}
          />
        ) : null}

        <main className="min-w-0 flex-1 pt-16 pb-10 lg:pb-24">
          <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer (sidebar) */}
      <Drawer open={sidebarOpen} onClose={onSidebarClose} side="left" title="Navigation">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onSidebarClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  isActive
                    ? "bg-primary/12 text-text"
                    : "text-muted2 hover:bg-surface2/80 hover:text-text"
                }`}
              >
                <Icon size={18} className={isActive ? "text-primary" : "text-muted2"} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 grid gap-3 rounded-[var(--r)] border border-border bg-surface/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm">{user?.email ?? ""}</p>
            <Badge variant="accent">{user?.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
          </div>
          <div className="flex gap-2">
            <Link href="/parametres" onClick={onSidebarClose} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">Paramètres</Button>
            </Link>
            <Button variant="ghost" size="sm" className="flex-1" onClick={onLogout}>Quitter</Button>
          </div>
        </div>
      </Drawer>

      {/* Mobile Search */}
      <Drawer open={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} side="bottom" title="Recherche">
        <div className="grid gap-3">
          <Input
            label="Rechercher"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Nom, plaque, dossier..."
          />
          <Button onClick={applyGlobalSearch}>Rechercher</Button>
        </div>
      </Drawer>
    </div>
  );
}
