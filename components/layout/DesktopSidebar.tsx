"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { NAV_ITEMS, NAV_SECTIONS, getItemsByGroup, type NavItem, type NavGroup } from "@/components/layout/nav-config";
import { GarageEmulator } from "@/components/admin/GarageEmulator";
import {
  LogOut,
  Search,
  Shield,
  Crown,
  Sparkles,
  ChevronDown,
  Wrench,
  Users,
  FileCheck,
  Receipt,
} from "lucide-react";
import { useState, useMemo } from "react";

// ============================================================
// DESKTOP SIDEBAR - SafeMotor
// Design moderne avec sections collapsibles et actions rapides
// ============================================================

export function DesktopSidebar({
  user,
  navItems = NAV_ITEMS,
  onLogout = () => {},
}: {
  user?: SessionUser;
  navItems?: NavItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
}) {
  const pathname = (usePathname() || "/").split("?")[0];
  const [collapsedSections, setCollapsedSections] = useState<Set<NavGroup>>(new Set());

  // User info
  const isAdmin = user?.role === "ADMIN";
  const garagePlan = user?.garage?.plan ?? "FREE";
  const isPro = garagePlan !== "FREE";
  const garageName = user?.garage?.name || "Mon Garage";

  // Filter items based on admin status
  const filteredItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || isAdmin),
    [navItems, isAdmin]
  );

  // Toggle section collapse
  const toggleSection = (group: NavGroup) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  // Check if path is active
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Quick actions
  const quickActions = [
    { label: "Client", href: "/clients/nouveau", icon: Users },
    { label: "Intervention", href: "/interventions/nouvelle", icon: Wrench },
    { label: "Devis", href: "/devis/nouveau", icon: FileCheck },
    { label: "Facture", href: "/factures/nouvelle", icon: Receipt },
  ];

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        display: "flex",
        height: "100vh",
        width: "260px",
        flexDirection: "column",
        background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)",
        borderRight: "1px solid #E5E7EB",
      }}
    >
      {/* Header / Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 16px",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Shield size={22} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>SafeMotor</div>
          <div
            style={{
              fontSize: "12px",
              color: "#6B7280",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {garageName}
          </div>
        </div>
        {isPro && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              fontSize: "10px",
              fontWeight: 700,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <Crown size={10} />
            PRO
          </div>
        )}
      </div>

      {/* Search Trigger */}
      <div style={{ padding: "12px 12px 8px" }}>
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            height: "38px",
            padding: "0 12px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            background: "#F9FAFB",
            fontSize: "13px",
            color: "#9CA3AF",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#6366F1";
            e.currentTarget.style.background = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E5E7EB";
            e.currentTarget.style.background = "#F9FAFB";
          }}
        >
          <Search size={15} color="#9CA3AF" />
          <span style={{ flex: 1, textAlign: "left" }}>Rechercher...</span>
          <kbd
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid #E5E7EB",
              background: "#fff",
              fontSize: "10px",
              fontFamily: "monospace",
              color: "#9CA3AF",
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "8px 12px 12px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "6px",
          }}
        >
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "10px 4px",
                borderRadius: "10px",
                background: "#F3F4F6",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#EEF2FF";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F3F4F6";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                }}
              >
                <action.icon size={14} color="#6366F1" />
              </div>
              <span style={{ fontSize: "10px", color: "#6B7280", fontWeight: 500 }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 12px",
        }}
      >
        {NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin).map((section) => {
          const sectionItems = getItemsByGroup(filteredItems, section.id);
          if (sectionItems.length === 0) return null;

          const isCollapsed = collapsedSections.has(section.id);
          const isAdminSection = section.id === "admin";

          return (
            <div key={section.id} style={{ marginBottom: "8px" }}>
              {/* Section Header */}
              {section.label && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "8px 10px",
                    marginBottom: "4px",
                    borderRadius: "8px",
                    border: "none",
                    background: isAdminSection ? "rgba(245, 158, 11, 0.1)" : "transparent",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isAdminSection ? "#D97706" : "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isAdminSection) e.currentTarget.style.background = "#F3F4F6";
                  }}
                  onMouseLeave={(e) => {
                    if (!isAdminSection) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {isAdminSection && <Shield size={12} />}
                  <span style={{ flex: 1, textAlign: "left" }}>{section.label}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
              )}

              {/* Section Items */}
              {!isCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {sectionItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          textDecoration: "none",
                          background: active
                            ? isAdminSection
                              ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                              : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
                            : "transparent",
                          boxShadow: active
                            ? isAdminSection
                              ? "0 4px 12px rgba(245, 158, 11, 0.25)"
                              : "0 4px 12px rgba(99, 102, 241, 0.25)"
                            : "none",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = isAdminSection
                              ? "rgba(245, 158, 11, 0.1)"
                              : "#F3F4F6";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <Icon
                          size={18}
                          color={active ? "#fff" : isAdminSection ? "#D97706" : "#6B7280"}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: "14px",
                            fontWeight: active ? 600 : 500,
                            color: active ? "#fff" : "#374151",
                          }}
                        >
                          {item.label}
                        </span>
                        {item.isNew && (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: active ? "rgba(255,255,255,0.2)" : "#6366F1",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "#fff",
                              textTransform: "uppercase",
                            }}
                          >
                            New
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Admin Emulator */}
              {isAdminSection && !isCollapsed && isAdmin && (
                <div style={{ padding: "8px 0" }}>
                  <GarageEmulator />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Upgrade CTA for Free users */}
      {!isPro && !isAdmin && (
        <div style={{ padding: "12px" }}>
          <Link href="/parametres?tab=abonnement" style={{ textDecoration: "none" }}>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                padding: "20px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)",
                boxShadow: "0 8px 24px rgba(99, 102, 241, 0.3)",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(99, 102, 241, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.3)";
              }}
            >
              {/* Decorative elements */}
              <div
                style={{
                  position: "absolute",
                  top: "-20px",
                  right: "-20px",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  filter: "blur(20px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-10px",
                  left: "-10px",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  filter: "blur(15px)",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Sparkles size={14} color="#FCD34D" />
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#FCD34D",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Passez Pro
                  </span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                  Protection complète
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "12px" }}>
                  Véhicules illimités • IA Copilot • SIV
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#6366F1",
                  }}
                >
                  Essai gratuit 14j
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px",
            borderRadius: "12px",
            background: "#F9FAFB",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#111827",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.email ? user.email.split("@")[0] : "Utilisateur"}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280" }}>
              {isAdmin ? "Administrateur" : isPro ? "Plan Pro" : "Plan Gratuit"}
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            title="Déconnexion"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "#9CA3AF",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FEE2E2";
              e.currentTarget.style.color = "#EF4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
