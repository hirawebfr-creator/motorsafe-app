"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import Drawer from "@/components/ui/navigation/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import {
  LayoutGrid,
  Users,
  Car,
  Wrench,
  FileText,
  Settings,
  ShieldCheck,
  Menu,
  Plus,
  Search,
  MoreHorizontal,
  LogOut,
  UserCircle2,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
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
  collapsed: _collapsed = false,
  onToggleCollapse: _onToggleCollapse = () => {},
  onMenu = () => {},
  onToggleCreate = () => {},
  createOpen: _createOpen = false,
  onLogout = () => {},
}: AppShellProps) {
  const pathname = usePathname?.() || activePath || "/";

  const bottomItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Véhicules", href: "/vehicules", icon: Car },
    { label: "Interventions", href: "/interventions", icon: Wrench },
  ] as const;

  const [plusOpen, setPlusOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      {/* TopBar (fixed) */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--bg)]/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 lg:px-8">
          <button
            type="button"
            onClick={onMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-transparent text-[color:var(--textMuted)] hover:bg-white/5 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface2)]">
              <span className="text-sm font-semibold text-[color:var(--accent2)]">MS</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold">MotorSafe</div>
              <div className="text-xs text-[color:var(--textMuted)]">Panel garages</div>
            </div>
          </Link>

          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 md:flex">
            <Search size={16} className="text-[color:var(--textMuted)]" />
            <input
              className="h-10 w-full bg-transparent text-sm text-[color:var(--text)] placeholder:text-[color:var(--textMuted)] outline-none"
              placeholder="Rechercher un client, une plaque, un dossier…"
              aria-label="Recherche globale"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-transparent text-[color:var(--textMuted)] hover:bg-white/5 md:hidden"
              aria-label="Recherche"
            >
              <Search size={18} />
            </button>

            <DropdownMenu
              trigger={
                <Button variant="primary" size="sm" onClick={onToggleCreate}>
                  <Plus size={16} /> Nouveau
                </Button>
              }
            >
              <Link className="block" href="/clients">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">Client</div>
              </Link>
              <Link className="block" href="/vehicules">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">Véhicule</div>
              </Link>
              <Link className="block" href="/interventions">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">Intervention</div>
              </Link>
              <Link className="block" href="/documents">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">PDF</div>
              </Link>
            </DropdownMenu>

            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm hover:bg-white/5"
                >
                  <UserCircle2 size={18} className="text-[color:var(--textMuted)]" />
                  <span className="hidden sm:block max-w-[180px] truncate">{user?.email ?? "Profil"}</span>
                </button>
              }
            >
              <Link className="block" href="/parametres">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">Paramètres</div>
              </Link>
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text)] hover:bg-white/5"
                onClick={onLogout}
              >
                Quitter
              </button>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop layout */}
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[260px] shrink-0 border-r border-[color:var(--border)] bg-[color:var(--bg)] lg:block">
          <div className="flex h-full flex-col px-3 py-4">
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-[rgba(139,92,246,0.14)] text-white"
                        : "text-[color:var(--textMuted)] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-[color:var(--accent2)]" : "text-[color:var(--textMuted)]"} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.email ?? ""}</p>
                  <p className="text-xs text-[color:var(--textMuted)]">Profil</p>
                </div>
                <Badge variant="accent">{user?.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--textMuted)] hover:bg-white/5"
              >
                <LogOut size={16} /> Quitter
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pt-16">
          <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">{children}</div>
          <div className="h-20 md:hidden" />
        </main>
      </div>

      {/* Mobile Drawer (sidebar) */}
      <Drawer open={sidebarOpen} onClose={onSidebarClose} side="left" title="Navigation">
        <div className="mb-4">
          <Input placeholder="Rechercher…" />
        </div>
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
                    ? "bg-[rgba(139,92,246,0.14)] text-white"
                    : "text-[color:var(--textMuted)] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} className={isActive ? "text-[color:var(--accent2)]" : "text-[color:var(--textMuted)]"} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm">{user?.email ?? ""}</p>
            <Badge variant="accent">{user?.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
          </div>
        </div>
      </Drawer>

      {/* Mobile BottomNav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border)] bg-[color:var(--bg)]/80 backdrop-blur md:hidden">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-2 text-xs ${
                  isActive ? "text-white" : "text-[color:var(--textMuted)]"
                }`}
              >
                <Icon size={18} className={isActive ? "text-[color:var(--accent2)]" : "text-[color:var(--textMuted)]"} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setPlusOpen(true)}
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs text-[color:var(--textMuted)]"
            aria-label="Plus"
          >
            <MoreHorizontal size={18} className="text-[color:var(--textMuted)]" />
            <span>Plus</span>
          </button>
        </div>
      </nav>

      <Drawer open={plusOpen} onClose={() => setPlusOpen(false)} side="bottom" title="Plus">
        <div className="grid gap-2">
          {[
            { label: "Documents PDF", href: "/documents", icon: FileText },
            { label: "Paramètres", href: "/parametres", icon: Settings },
            { label: "Pro demandes", href: "/admin/pro-demandes", icon: ShieldCheck },
            { label: "Références légales", href: "/admin/references", icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setPlusOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm hover:bg-white/5"
              >
                <Icon size={18} className="text-[color:var(--accent2)]" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}
