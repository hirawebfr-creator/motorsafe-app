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
    <nav className="fixed bottom-4 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-[var(--radius-lg)] border border-[rgba(31,41,55,0.7)] bg-[var(--panel)] px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] shadow-[var(--shadow-card)] lg:hidden">
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
