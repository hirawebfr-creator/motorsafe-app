"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export type DesktopNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  group?: "main" | "admin";
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: DesktopNavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40",
        active
          ? "bg-[color:var(--accentWeak)] text-[color:var(--text)]"
          : "text-[color:var(--textMuted)] hover:bg-[color:var(--surface2)] hover:text-[color:var(--text)]"
      )}
    >
      <span
        className={cx(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition",
          active
            ? "border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10"
            : "border-[color:var(--border)] bg-[color:var(--surface)] group-hover:bg-[color:var(--surface2)]"
        )}
      >
        <Icon
          size={18}
          className={cx(
            "transition",
            active
              ? "text-[color:var(--accent2)]"
              : "text-[color:var(--textMuted)] group-hover:text-[color:var(--text)]"
          )}
        />
      </span>

      {!collapsed ? <span className="min-w-0 truncate">{item.label}</span> : null}

      {active ? (
        <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[color:var(--accent2)]" />
      ) : null}
    </Link>
  );

  return (
    <Tooltip content={item.label} disabled={!collapsed}>
      {link}
    </Tooltip>
  );
}

export function DesktopSidebar({
  user,
  navItems,
  collapsed,
  onToggleCollapse,
  onLogout,
}: {
  user?: SessionUser;
  navItems: DesktopNavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const grouped = useMemo(() => {
    const main = navItems.filter((n) => (n.group ?? "main") === "main");
    const admin = navItems.filter((n) => (n.group ?? "main") === "admin");
    return { main, admin };
  }, [navItems]);

  return (
    <aside
      className={cx(
        "sticky top-16 hidden h-[calc(100vh-64px)] shrink-0 border-r border-[color:var(--border)] bg-[color:var(--bg)] lg:block",
        collapsed ? "w-[84px]" : "w-[280px]"
      )}
      aria-label="Navigation principale"
    >
      <div className={cx("flex h-full flex-col px-3 py-4", collapsed && "px-2")}>
        {/* Brand */}
        <div className={cx("mb-4 flex items-center gap-3", collapsed && "justify-center")}
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface2)]">
            <span className="text-sm font-extrabold text-[color:var(--accent2)]">MS</span>
          </div>

          {!collapsed ? (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-[color:var(--text)]">MotorSafe</div>
              <div className="truncate text-xs text-[color:var(--textMuted)]">Panel garages</div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onToggleCollapse}
            className={cx(
              "ml-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--textMuted)] transition hover:bg-[color:var(--surface2)]",
              "focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40",
              collapsed && "ml-0"
            )}
            aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
            title={collapsed ? "Déplier" : "Réduire"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-3">
          <div className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--textMuted)]">
                Menu
              </p>
            ) : null}

            {grouped.main.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return <NavLink key={item.href} item={item} active={active} collapsed={collapsed} />;
            })}
          </div>

          {grouped.admin.length ? (
            <div className="pt-2">
              <div className={cx("my-2 h-px bg-[color:var(--border)]/70", collapsed && "mx-2")} />
              {!collapsed ? (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--textMuted)]">
                  Admin
                </p>
              ) : null}
              <div className="space-y-1">
                {grouped.admin.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return <NavLink key={item.href} item={item} active={active} collapsed={collapsed} />;
                })}
              </div>
            </div>
          ) : null}
        </nav>

        {/* Footer user */}
        <div
          className={cx(
            "mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3",
            collapsed && "p-2"
          )}
        >
          <div className={cx("flex items-center gap-3", collapsed && "justify-center")}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface2)]">
              <span className="text-xs font-bold text-[color:var(--accent2)]">U</span>
            </div>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[color:var(--text)]">{user?.email ?? ""}</p>
                <p className="text-xs text-[color:var(--textMuted)]">Compte</p>
              </div>
            ) : null}

            {!collapsed ? (
              <Badge variant="accent">{user?.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className={cx(
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm font-semibold text-[color:var(--textMuted)] transition hover:bg-[color:var(--surface2)]",
              "focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40",
              collapsed && "mt-2 h-10 px-0"
            )}
            aria-label="Quitter"
            title={collapsed ? "Quitter" : undefined}
          >
            <LogOut size={16} />
            {!collapsed ? "Quitter" : null}
          </button>
        </div>
      </div>
    </aside>
  );
}
