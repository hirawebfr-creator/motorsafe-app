"use client";


import Link from "next/link";
import { NAV_ITEMS } from "@/components/layout/nav-config";

export default function MobileNav({ activePath }: { activePath: string }) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-[var(--r)] border border-border bg-surface/90 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] shadow-[var(--shDropdown)] backdrop-blur lg:hidden [@media(pointer:fine)]:hidden">
      <div className="flex items-center justify-between gap-3">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = activePath === item.href || activePath.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 text-xs ${
                isActive ? "text-text" : "text-muted2"
              }`}
            >
              <Icon size={16} className={isActive ? "text-primary" : "text-muted2"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
