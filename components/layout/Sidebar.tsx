"use client";

import Link from "next/link";
import { X, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
  collapsed,
  onToggleCollapse,
}: {
  user: SessionUser;
  navItems: NavItem[];
  activePath: string;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const garageLabel = user.role === "ADMIN" ? "Administration" : user.garage?.name ?? "Garage";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 border-r border-[rgba(31,41,55,0.7)] bg-[var(--panel)] px-5 py-6 transition-transform lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "lg:w-[76px]" : "lg:w-[260px]"} w-[260px]`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-[rgba(139,92,246,0.2)] text-[var(--accent)] shadow-[0_12px_30px_rgba(139,92,246,0.35)]">
            <span className="flex h-full items-center justify-center text-lg font-bold">M</span>
          </div>
          {!collapsed ? (
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">MotorSafe</p>
              <p className="text-lg font-semibold">{garageLabel}</p>
            </div>
          ) : null}
        </div>
        <button
          onClick={onClose}
          className="text-[var(--muted)] lg:hidden"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {!collapsed ? (
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Navigation</span>
        ) : null}
        <div className="hidden lg:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Etendre" : "Reduire"}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </Button>
        </div>
      </div>

      <nav className="mt-4 grid gap-2">
        {navItems.map((item) => {
          const isActive = activePath === item.href || activePath.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-[rgba(139,92,246,0.2)] text-white"
                  : "text-[var(--muted)] hover:bg-[rgba(139,92,246,0.12)] hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mt-auto pt-8">
          <div className="rounded-[var(--radius)] border border-[rgba(31,41,55,0.7)] bg-[var(--card)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Profil</p>
            <p className="mt-2 text-sm font-semibold">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={user.role === "ADMIN" ? "accent" : "success"}>
                {user.role === "ADMIN" ? "Admin" : "Pro"}
              </Badge>
              {user.role !== "ADMIN" ? (
                <Badge variant={user.garage?.status === "ACTIVE" ? "success" : "warning"}>
                  {user.garage?.status === "ACTIVE" ? "Actif" : "En attente"}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
