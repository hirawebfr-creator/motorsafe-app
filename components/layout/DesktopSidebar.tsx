"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import type { NavItem } from "@/components/layout/nav-config";
import { GarageEmulator } from "@/components/admin/GarageEmulator";
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  Crown,
  Zap,
  CheckCircle,
  ArrowRight,
  FileCheck,
  Receipt,
  ShieldCheck,
} from "lucide-react";

type SidebarIcon = React.ComponentType<{ size?: number; className?: string }>;

const ICONS_BY_HREF: Record<string, SidebarIcon> = {
  "/dashboard": LayoutDashboard,
  "/clients": Users,
  "/vehicules": Car,
  "/interventions": Wrench,
  "/devis": FileCheck,
  "/factures": Receipt,
  "/documents": FileText,
  "/parametres": Settings,
  "/garage": ShieldCheck,
};

export function DesktopSidebar({
  user,
  navItems = [],
  onLogout = () => {},
}: {
  user?: SessionUser;
  navItems?: NavItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
}) {
  const pathname = (usePathname() || "/").split("?")[0];

  // Check plan from user's garage info if available
  // Show CTA for FREE plan or if plan is undefined (treat as FREE)
  const garagePlan = user?.garage?.plan ?? "FREE";
  const isPro = garagePlan === "PRO";
  const isAdmin = user?.role === "ADMIN";
  const showUpgradeCTA = !isPro && !isAdmin;

  const order = [
    "/dashboard",
    "/clients",
    "/vehicules",
    "/interventions",
    "/devis",
    "/factures",
    "/documents",
    "/garage",
    "/parametres",
    "/aide",
    "/support",
  ];

  const items = order
    .map((href) => navItems.find((n) => n.href === href))
    .filter(Boolean) as NavItem[];

  // Admin items (only visible to admin)
  const adminItems = navItems.filter((n) => n.group === "admin" && n.adminOnly);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-[var(--ms-border)] bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
          <Car size={20} className="text-white" />
        </div>
        <div>
          <div className="text-lg font-bold text-[var(--ms-text)]">MotorSafe</div>
          <div className="text-xs text-[var(--ms-text-muted)]">Garage Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main navigation */}
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon ?? ICONS_BY_HREF[item.href] ?? LayoutDashboard;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--ms-primary)] to-[#8B5CF6] text-white shadow-lg shadow-[var(--ms-primary)]/25"
                    : "text-[var(--ms-text-secondary)] hover:bg-[var(--ms-bg-subtle)] hover:text-[var(--ms-text)]"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-colors ${
                    isActive ? "text-white" : "text-[var(--ms-text-muted)] group-hover:text-[var(--ms-text-secondary)]"
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={16} className="ml-auto text-white/80" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Admin section */}
        {isAdmin && adminItems.length > 0 && (
          <>
            <div className="my-4 px-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ms-text-muted)]">
                <ShieldCheck size={14} />
                Administration
              </div>
            </div>
            
            {/* Garage Emulator - allows admin to view as a specific garage */}
            <div className="mb-3 px-3">
              <GarageEmulator />
            </div>
            
            <div className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon ?? LayoutDashboard;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                        : "text-[var(--ms-text-secondary)] hover:bg-amber-50 hover:text-amber-700"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={`transition-colors ${
                        isActive ? "text-white" : "text-amber-500/70 group-hover:text-amber-600"
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <ChevronRight size={16} className="ml-auto text-white/80" />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Upgrade Card - Always show for non-Pro, non-Admin users */}
      {showUpgradeCTA && (
        <div className="mx-3 mb-4">
          <Link href="/parametres?tab=abonnement" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7] p-5 shadow-lg shadow-purple-500/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-purple-500/30 group-hover:scale-[1.02]">
              {/* Animated background elements */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform duration-500 group-hover:scale-150" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />
              <div className="absolute top-1/2 right-1/4 h-8 w-8 rounded-full bg-yellow-400/30 blur-lg" />
              
              <div className="relative z-10">
                {/* Animated sparkle */}
                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center">
                  <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                </div>
                
                {/* Content */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <Zap size={10} className="fill-current" />
                    Offre limitée
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1.5 tracking-tight">
                  Passez Pro 🚀
                </h3>
                
                <p className="text-sm text-white/80 leading-snug mb-4">
                  Véhicules illimités<br />
                  + fonctionnalités avancées
                </p>
                
                {/* Price */}
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-white">29€</span>
                  <span className="text-white/70 text-sm mb-1">/mois</span>
                </div>
                
                {/* CTA Button */}
                <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white font-bold text-[var(--ms-primary)] text-sm shadow-lg transition-transform group-hover:scale-[1.02]">
                  Essai gratuit 14j
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Pro Badge for Pro users */}
      {isPro && !isAdmin && (
        <div className="mx-3 mb-4">
          <Link href="/parametres?tab=abonnement" className="block">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 transition-all hover:border-emerald-300 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                <Crown size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-700">Plan Pro</span>
                  <CheckCircle size={16} className="text-emerald-500 fill-emerald-100" />
                </div>
                <span className="text-xs text-emerald-600/80">Abonnement actif</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div className="border-t border-[var(--ms-border)] p-3">
        <div className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-[var(--ms-bg-subtle)] transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F472B6] to-[#EC4899] shadow-md">
            <span className="text-sm font-bold text-white">
              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--ms-text)]">
              {user?.email ? user.email.split("@")[0] : "Utilisateur"}
            </div>
            <div className="text-xs text-[var(--ms-text-muted)]">
              {user?.role === "ADMIN" ? "Administrateur" : isPro ? "Plan Pro" : "Plan Gratuit"}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ms-text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
