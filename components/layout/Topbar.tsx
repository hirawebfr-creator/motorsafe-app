"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import type { SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { Menu, Plus, Search, UserCircle2 } from "lucide-react";

export function TopBar({
  user,
  isDesktop,
  query,
  onQueryChange,
  onSearch,
  onMenu,
  onOpenMobileSearch,
  onLogout,
  onToggleCreate,
}: {
  user?: SessionUser;
  isDesktop: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onMenu: () => void;
  onOpenMobileSearch: () => void;
  onLogout: () => void;
  onToggleCreate: () => void;
}) {
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isDesktop) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDesktop]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--bg)]/60 backdrop-blur-xl"
      data-ui="topbar-2026-01-02-premium"
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {!isDesktop ? (
          <button
            type="button"
            onClick={onMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--textMuted)] transition hover:bg-[color:var(--surface2)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40"
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>
        ) : null}

        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface2)]">
            <span className="text-sm font-extrabold text-[color:var(--accent2)]">MS</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold text-[color:var(--text)]">MotorSafe</div>
            <div className="text-xs text-[color:var(--textMuted)]">Panel garages</div>
          </div>
        </Link>

        {isDesktop ? (
          <div
            className="ms-focus-within hidden flex-1 items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 shadow-sm lg:flex"
            role="search"
            aria-label="Recherche"
          >
            <Search size={16} className="text-[color:var(--textMuted)]" />
            <label htmlFor={searchId} className="sr-only">
              Recherche globale
            </label>
            <input
              id={searchId}
              ref={searchRef}
              className="h-11 w-full bg-transparent text-sm text-[color:var(--text)] placeholder:text-[color:var(--textMuted)] outline-none"
              placeholder="Rechercher un client, une plaque, un dossier…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
            />
            <kbd className="hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface2)] px-2 py-1 text-[11px] text-[color:var(--textMuted)] sm:inline-flex">
              Ctrl K
            </kbd>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="ml-auto flex items-center gap-2">
          {!isDesktop ? (
            <button
              type="button"
              onClick={onOpenMobileSearch}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--textMuted)] transition hover:bg-[color:var(--surface2)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40"
              aria-label="Recherche"
            >
              <Search size={18} />
            </button>
          ) : null}

          <DropdownMenu
            trigger={
              <Button variant="primary" size="sm" onClick={onToggleCreate}>
                <Plus size={16} /> Nouveau
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
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm font-semibold text-[color:var(--text)] transition hover:bg-[color:var(--surface2)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40"
              >
                <UserCircle2 size={18} className="text-[color:var(--textMuted)]" />
                <span className="hidden max-w-[220px] truncate sm:block">{user?.email ?? "Profil"}</span>
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
