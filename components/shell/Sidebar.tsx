"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, Car, Wrench, FileText } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Véhicules", href: "/vehicules", icon: Car },
  { label: "Interventions", href: "/interventions", icon: Wrench },
  { label: "Documents PDF", href: "/documents", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-[var(--panel)] border-r border-[var(--border)] min-h-screen py-6 px-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="h-10 w-10 flex items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-white font-bold text-xl shadow-lg">M</div>
        <span className="font-semibold text-lg tracking-tight">MotorSafe</span>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] transition text-[var(--text)] hover:bg-[var(--panel-2)] hover:text-[var(--accent)] ${pathname.startsWith(href) ? "bg-[var(--panel-2)] text-[var(--accent)]" : ""}`}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
          >
            <Icon size={20} className="shrink-0" />
            <span className="text-base font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
