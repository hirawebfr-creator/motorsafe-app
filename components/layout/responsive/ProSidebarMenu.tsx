
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
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">M</div>
        {!collapsed && <span className="font-bold text-lg text-white tracking-wide">MotorSafe Pro</span>}
      </div>
      <ul className="flex-1 flex flex-col gap-1 px-2" role="list">
        {mainNav.map(({ label, href, icon: Icon }) => (
          <li key={href} role="listitem">
            <Tooltip content={collapsed ? label : undefined} side="right" disabled={!collapsed}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] outline-none ${
                  activePath.startsWith(href)
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
                aria-current={activePath.startsWith(href) ? "page" : undefined}
                tabIndex={0}
              >
                <Icon size={20} aria-hidden />
                {!collapsed && <span>{label}</span>}
              </Link>
            </Tooltip>
          </li>
        ))}
        {adminNav.length > 0 && (
          <React.Fragment>
            <li className="my-2 border-t border-[rgba(255,255,255,0.08)]" aria-hidden />
            {adminNav.map(({ label, href, icon: Icon }) => (
              <li key={href} role="listitem">
                <Tooltip content={collapsed ? label : undefined} side="right" disabled={!collapsed}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] outline-none ${
                      activePath.startsWith(href)
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                    aria-current={activePath.startsWith(href) ? "page" : undefined}
                    tabIndex={0}
                  >
                    <Icon size={20} aria-hidden />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                </Tooltip>
              </li>
            ))}
          </React.Fragment>
        )}
      </ul>
      <div className="mt-auto px-2">
        <button
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-[var(--accent)] outline-none"
          aria-label="Déconnexion"
          tabIndex={0}
        >
          <LogOut size={20} aria-hidden />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </nav>
  );
}
