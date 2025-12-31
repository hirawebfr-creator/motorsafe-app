"use client";

import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export function MobileNav({
  navItems,
  activePath,
}: {
  navItems: NavItem[];
  activePath: string;
}) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-3xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-[0_24px_60px_rgba(6,10,20,0.35)] lg:hidden">
      <div className="flex items-center justify-between gap-3">
        {navItems.slice(0, 5).map((item) => {
          const isActive = activePath === item.href || activePath.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 text-xs ${
                isActive ? "text-white" : "text-[var(--muted)]"
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
