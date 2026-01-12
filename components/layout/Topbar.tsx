"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef } from "react";
import type { SessionUser } from "@/lib/auth";
import type { NavItem } from "@/components/layout/nav-config";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { Menu, Plus, Search, ShieldCheck, UserCircle2 } from "lucide-react";

export function TopBar({
  user,
  navItems = [],
  activePath = "/",
  query,
  onQueryChange,
  onSearch,
  onMenu,
  onLogout,
  isMobile,
}: {
  user?: SessionUser;
  navItems?: NavItem[];
  activePath?: string;
  query?: string;
  onQueryChange?: (value: string) => void;
  onSearch?: () => void;
  onMenu: () => void;
  onLogout: () => void;
  isMobile: boolean;
}) {
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const pathname = (activePath || "/").split("?")[0];

  const { mainNav, adminNav } = useMemo(() => {
    const isAdmin = user?.role === "ADMIN";
    const filtered = navItems.filter((n) => !n.adminOnly || isAdmin);
    return {
      mainNav: filtered.filter((n) => !n.adminOnly),
      adminNav: filtered.filter((n) => n.adminOnly),
    };
  }, [navItems, user?.role]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        {/* Menu */}
        {isMobile ? (
          <button
            type="button"
            onClick={onMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-muted2 transition hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>
        ) : null}

        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
            <span className="text-sm font-extrabold tracking-tight text-primary2">MS</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold text-text">MotorSafe</div>
            <div className="text-xs text-muted2">Panel garages</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden">
          {mainNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-surface2 text-text"
                    : "text-muted2 hover:bg-surface2/70 hover:text-text",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {Icon ? (
                  <Icon
                    size={16}
                    className={isActive ? "text-primary2" : "text-muted2"}
                  />
                ) : null}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {user?.role === "ADMIN" && adminNav.length > 0 ? (
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold text-muted2 transition hover:bg-surface2/70 hover:text-text"
                >
                  <ShieldCheck size={16} className="text-muted2" />
                  Admin
                </button>
              }
            >
              {adminNav.map((item) => (
                <DropdownItem asChild key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownItem>
              ))}
            </DropdownMenu>
          ) : null}
        </nav>

        {/* Search (lg+) */}
        <div
          className="ms-focus-within hidden flex-1 items-center gap-2 rounded-2xl border border-border bg-surface px-3 shadow-sm lg:flex"
          role="search"
          aria-label="Recherche"
        >
          <Search size={16} className="text-muted2" />
          <label htmlFor={searchId} className="sr-only">
            Recherche globale
          </label>
          <input
            id={searchId}
            ref={searchRef}
            className="h-11 w-full bg-transparent text-sm text-text placeholder:text-muted2 outline-none"
            placeholder="Rechercher un client, une plaque, un dossier…"
            value={query ?? ""}
            onChange={(e) => onQueryChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch?.();
            }}
          />
          <kbd className="hidden rounded-lg border border-border bg-surface2 px-2 py-1 text-[11px] text-muted2 sm:inline-flex">
            Ctrl K
          </kbd>
        </div>

        <div className="flex-1 lg:hidden" />

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu
            trigger={
              <Button variant="primary" size="md">
                <Plus size={16} />
                <span className="hidden sm:inline">Nouveau</span>
              </Button>
            }
          >
            <DropdownItem asChild>
              <Link href="/clients">Client</Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/vehicules">Véhicule</Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/interventions">Intervention</Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/documents">PDF</Link>
            </DropdownItem>
          </DropdownMenu>

          <DropdownMenu
            trigger={
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 text-sm font-semibold text-text transition hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <UserCircle2 size={18} className="text-muted2" />
                <span className="hidden max-w-[220px] truncate sm:block">
                  {user?.email ?? "Profil"}
                </span>
              </button>
            }
          >
            <DropdownItem asChild>
              <Link href="/parametres">Paramètres</Link>
            </DropdownItem>
            <DropdownItem onClick={onLogout}>Quitter</DropdownItem>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
