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

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-full h-full flex flex-col">
      {children}
    </aside>
  );
}
