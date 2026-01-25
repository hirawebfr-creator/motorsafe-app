"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wrench,
  FileCheck,
  Menu,
} from "lucide-react";

// ============================================================
// MOBILE BOTTOM NAV - SafeMotor
// Barre de navigation rapide en bas de l'écran mobile
// ============================================================

const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Travaux", href: "/interventions", icon: Wrench },
  { label: "Devis", href: "/devis", icon: FileCheck },
  { label: "Plus", href: "#menu", icon: Menu, isMenu: true },
];

export default function MobileNav({ onMenuOpen }: { activePath?: string; onMenuOpen?: () => void }) {
  const pathname = usePathname() || "/";

  const isActive = (href: string) => {
    if (href === "#menu") return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "stretch",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid #E5E7EB",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      className="lg:hidden"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        if (item.isMenu) {
          return (
            <button
              key={item.href}
              type="button"
              onClick={onMenuOpen}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "10px 4px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#F3F4F6",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={20} color="#6B7280" />
              </div>
              <span style={{ fontSize: "10px", fontWeight: 500, color: "#6B7280" }}>
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "10px 4px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: active
                  ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
                  : "#F3F4F6",
                boxShadow: active ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={20} color={active ? "#fff" : "#6B7280"} />
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: active ? 600 : 500,
                color: active ? "#6366F1" : "#6B7280",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

