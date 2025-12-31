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
    <header className="sticky top-0 z-30 border-b border-[rgba(31,41,55,0.7)] bg-[var(--bg)]/80 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-4 lg:px-8">
        <button
          onClick={onMenu}
          className="rounded-[var(--radius-sm)] border border-[rgba(31,41,55,0.7)] p-2 text-[var(--muted)] lg:hidden"
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(31,41,55,0.7)] bg-[var(--panel)] px-4 py-2">
          <Search size={16} className="text-[var(--muted)]" />
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
            <div className="absolute right-0 mt-3 w-56 rounded-[var(--radius)] border border-[rgba(31,41,55,0.7)] bg-[var(--card)] p-2 shadow-[var(--shadow-card)]">
              {[
                { label: "Nouveau client", href: "/clients" },
                { label: "Nouveau vehicule", href: "/vehicules" },
                { label: "Nouvelle intervention", href: "/interventions" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[rgba(139,92,246,0.12)] hover:text-white"
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
