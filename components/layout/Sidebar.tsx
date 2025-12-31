"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { SessionUser } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export function Sidebar({
  user,
  navItems,
  activePath,
  open,
  onClose,
}: {
  user: SessionUser;
  navItems: NavItem[];
  activePath: string;
  open: boolean;
  onClose: () => void;
}) {
  const garageLabel = user.role === "ADMIN" ? "Administration" : user.garage?.name ?? "Garage";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--border)] bg-[var(--panel)] p-6 transition-transform lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--accent)]/20 text-[var(--accent)] shadow-[0_12px_30px_rgba(124,92,255,0.35)]">
            <span className="flex h-full items-center justify-center text-lg font-bold">M</span>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">MotorSafe</p>
            <p className="text-lg font-semibold">{garageLabel}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--muted)] lg:hidden"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="mt-10 grid gap-2">
        {navItems.map((item) => {
          const isActive = activePath === item.href || activePath.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-[rgba(124,92,255,0.18)] text-white"
                  : "text-[var(--muted)] hover:bg-[rgba(124,92,255,0.1)] hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-10">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Profil</p>
          <p className="mt-2 text-sm font-semibold">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={user.role === "ADMIN" ? "accent" : "success"}>
              {user.role === "ADMIN" ? "Admin" : "Garage"}
            </Badge>
            {user.role !== "ADMIN" ? (
              <Badge variant={user.garage?.status === "ACTIVE" ? "success" : "warning"}>
                {user.garage?.status === "ACTIVE" ? "Actif" : "En attente"}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
