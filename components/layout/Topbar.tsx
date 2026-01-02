"use client";

import Link from "next/link";
import { Menu, Plus, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Topbar({
  onMenu,
  onToggleCreate,
  createOpen,
  onLogout,
}: {
  onMenu: () => void;
  onToggleCreate: () => void;
  createOpen: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 h-16 flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-[var(--rButton)] border border-border p-2 text-muted lg:hidden"
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-[var(--rInput)] border border-border bg-surface px-4 py-2">
          <Search size={16} className="text-[color:var(--textMuted)]" />
          <input
            placeholder="Rechercher un client, une plaque, un dossier..."
            className="w-full bg-transparent text-sm text-[var(--text)] outline-none"
            aria-label="Recherche globale"
          />
        </div>
        <div className="relative">
          <Button variant="primary" size="sm" onClick={onToggleCreate}>
            <Plus size={16} /> Nouveau
          </Button>
          {createOpen ? (
            <div className="absolute right-0 mt-3 w-56 rounded-[var(--rCard)] border border-border bg-surface p-2 shadow-dropdown">
              {[
                { label: "Nouveau client", href: "/clients" },
                { label: "Nouveau vehicule", href: "/vehicules" },
                { label: "Nouvelle intervention", href: "/interventions" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-[var(--rButton)] px-3 py-2 text-sm text-muted hover:bg-primary/10 hover:text-text"
                  onClick={onToggleCreate}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut size={16} /> Quitter
        </Button>
      </div>
    </header>
  );
}
