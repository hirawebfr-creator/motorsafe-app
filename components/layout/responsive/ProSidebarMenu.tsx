
import React from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { Tooltip } from "../../ui/Tooltip";
import { usePathname } from "next/navigation";

export function ProSidebarMenu() {
  // Group nav items: main, admin
  const mainNav = NAV_ITEMS.filter((item) => !item.adminOnly);
  const adminNav = NAV_ITEMS.filter((item) => item.adminOnly);
  // TODO: get collapsed state from context/prop if needed
  const collapsed = false;
  const activePath = usePathname();
  return (
    <nav className="flex flex-col gap-2 w-full h-full py-6" aria-label="Navigation principale">
      <div className="flex items-center gap-3 px-6 mb-8">
        <div className="h-10 w-10 rounded-[var(--rCard)] bg-primary/15 border border-primary/25 grid place-items-center">
          <span className="text-primary font-bold">M</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm tracking-[0.32em] uppercase text-muted">Motorsafe</div>
            <div className="text-xs text-muted/80">Panel garages</div>
          </div>
        )}
      </div>
      <ul className="flex-1 flex flex-col gap-1 px-2" role="list">
        {mainNav.map(({ label, href, icon: Icon }) => (
          <li key={href} role="listitem">
            <Tooltip content={collapsed ? label : undefined} side="right" disabled={!collapsed}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-[var(--rButton)] border transition duration-200 ${
                  activePath.startsWith(href)
                    ? "bg-primary/12 border-primary/25 text-text shadow-soft"
                    : "bg-transparent border-transparent text-text/85 hover:bg-white/5 hover:border-border"
                }`}
                aria-current={activePath.startsWith(href) ? "page" : undefined}
                tabIndex={0}
              >
                <Icon className="h-4 w-4 text-primary opacity-90" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </Link>
            </Tooltip>
          </li>
        ))}
        {adminNav.length > 0 && (
          <React.Fragment>
            <li className="my-2 border-t border-border" aria-hidden />
            {adminNav.map(({ label, href, icon: Icon }) => (
              <li key={href} role="listitem">
                <Tooltip content={collapsed ? label : undefined} side="right" disabled={!collapsed}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[var(--rButton)] border transition duration-200 ${
                      activePath.startsWith(href)
                        ? "bg-primary/12 border-primary/25 text-text shadow-soft"
                        : "bg-transparent border-transparent text-text/85 hover:bg-white/5 hover:border-border"
                    }`}
                    aria-current={activePath.startsWith(href) ? "page" : undefined}
                    tabIndex={0}
                  >
                    <Icon className="h-4 w-4 text-primary opacity-90" />
                    {!collapsed && <span className="text-sm font-medium">{label}</span>}
                  </Link>
                </Tooltip>
              </li>
            ))}
          </React.Fragment>
        )}
      </ul>
      <div className="px-6 mt-8">
        <button className="flex items-center gap-2 text-sm text-muted hover:text-white">
          <LogOut className="h-4 w-4" /> Quitter
        </button>
      </div>
    </nav>
  );
}
