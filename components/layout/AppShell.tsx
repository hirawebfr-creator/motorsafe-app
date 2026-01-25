"use client";

import type { SessionUser } from "@/lib/auth";
import { NAV_ITEMS, NAV_SECTIONS, getItemsByGroup, type NavItem, type NavGroup } from "@/components/layout/nav-config";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  Search, 
  LogOut, 
  Shield,
  ChevronDown,
  Crown,
  Sparkles,
  X,
  Wrench,
  Users,
  FileCheck,
  Receipt,
} from "lucide-react";
import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
  user?: SessionUser;
  navItems?: NavItem[];
  activePath?: string;
  sidebarOpen?: boolean;
  onSidebarClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onMenu?: () => void;
  onLogout?: () => void;
};

export function AppShell({
  children,
  user,
  navItems = NAV_ITEMS,
  onLogout = () => {},
}: AppShellProps) {
  const pathname = usePathname() || "/";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<NavGroup>>(new Set());

  const isAdmin = user?.role === "ADMIN";
  const garagePlan = user?.garage?.plan ?? "FREE";
  const isPro = garagePlan !== "FREE";
  const garageName = user?.garage?.name || "Mon Garage";

  const visibleNavItems = useMemo(
    () => navItems.filter((n) => !n.adminOnly || isAdmin),
    [navItems, isAdmin]
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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

  // Quick actions for mobile
  const quickActions = [
    { label: "Client", href: "/clients/nouveau", icon: Users },
    { label: "Intervention", href: "/interventions/nouvelle", icon: Wrench },
    { label: "Devis", href: "/devis/nouveau", icon: FileCheck },
    { label: "Facture", href: "/factures/nouvelle", icon: Receipt },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopSidebar user={user} navItems={visibleNavItems} onLogout={onLogout} />
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileNavOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        style={{
          position: "fixed",
          left: mobileNavOpen ? 0 : "-300px",
          top: 0,
          bottom: 0,
          zIndex: 51,
          width: "300px",
          background: "#fff",
          boxShadow: mobileNavOpen ? "4px 0 24px rgba(0,0,0,0.15)" : "none",
          transition: "left 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              }}
            >
              <Shield size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>SafeMotor</div>
              <div style={{ fontSize: "11px", color: "#6B7280" }}>{garageName}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "none",
              background: "#F3F4F6",
              cursor: "pointer",
            }}
          >
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Quick Actions Mobile */}
        <div style={{ padding: "12px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "10px 4px",
                  borderRadius: "10px",
                  background: "#F3F4F6",
                  textDecoration: "none",
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

        {/* Mobile Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
          {NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin).map((section) => {
            const sectionItems = getItemsByGroup(visibleNavItems, section.id);
            if (sectionItems.length === 0) return null;

            const isCollapsed = collapsedSections.has(section.id);
            const isAdminSection = section.id === "admin";

            return (
              <div key={section.id} style={{ marginBottom: "8px" }}>
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

                {!isCollapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {sectionItems.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
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
              </div>
            );
          })}
        </nav>

        {/* Upgrade CTA Mobile */}
        {!isPro && !isAdmin && (
          <div style={{ padding: "12px", borderTop: "1px solid #E5E7EB" }}>
            <Link href="/parametres?tab=abonnement" onClick={() => setMobileNavOpen(false)} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                }}
              >
                <Sparkles size={20} color="#FCD34D" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Passez Pro</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>Essai gratuit 14j</div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Pro badge mobile */}
        {isPro && !isAdmin && (
          <div style={{ padding: "12px", borderTop: "1px solid #E5E7EB" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
              }}
            >
              <Crown size={18} color="#059669" />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#059669" }}>Plan Pro actif</span>
            </div>
          </div>
        )}

        {/* User profile mobile */}
        <div style={{ padding: "12px", borderTop: "1px solid #E5E7EB" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              borderRadius: "10px",
              background: "#F9FAFB",
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
                background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
                fontSize: "14px",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
            </div>
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
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onLogout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "none",
                background: "#FEE2E2",
                color: "#EF4444",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        style={{
          marginLeft: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
        className="lg:ml-[260px]"
      >
        <MaintenanceBanner />

        {/* Mobile Topbar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "0 16px",
            height: "56px",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #E5E7EB",
          }}
          className="lg:hidden"
        >
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: "none",
              background: "#F3F4F6",
              cursor: "pointer",
            }}
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} color="#374151" />
          </button>

          {/* Brand center */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              }}
            >
              <Shield size={16} color="#fff" />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>SafeMotor</span>
          </div>

          <button
            type="button"
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: "none",
              background: "#F3F4F6",
              cursor: "pointer",
            }}
            aria-label="Rechercher"
          >
            <Search size={18} color="#374151" />
          </button>
        </header>

        {/* Content */}
        <div
          style={{
            flex: 1,
            width: "100%",
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            padding: "24px",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

