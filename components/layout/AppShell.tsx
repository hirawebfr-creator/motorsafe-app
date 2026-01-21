"use client";

import type { SessionUser } from "@/lib/auth";
import type { NavItem } from "@/components/layout/nav-config";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { useMemo, useState } from "react";
import { Menu, Search, LogOut, Car } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  navItems = [],
  onLogout = () => {},
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  const visibleNavItems = useMemo(
    () => navItems.filter((n) => !n.adminOnly || user?.role === "ADMIN"),
    [navItems, user?.role]
  );

  return (
    <div className="min-h-screen bg-[var(--ms-bg)]">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopSidebar user={user} navItems={visibleNavItems} onLogout={onLogout} />
      </div>
      
      {/* Mobile Navigation Drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="px-4 py-4 border-b border-[var(--ms-border)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
                <Car size={20} className="text-white" />
              </div>
              <SheetTitle className="text-lg font-bold">MotorSafe</SheetTitle>
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <nav className="p-3 space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = typeof window !== "undefined" && 
                  (window.location.pathname === item.href || 
                   window.location.pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--ms-primary)] text-white"
                        : "text-[var(--ms-text-secondary)] hover:bg-[var(--ms-surface-hover)] hover:text-[var(--ms-text)]"
                    }`}
                  >
                    {Icon && <Icon size={20} />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Logout button */}
            <div className="p-3 border-t border-[var(--ms-border-light)] mt-auto">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ms-error)] hover:bg-[var(--ms-error-light)] transition-colors"
              >
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      
      {/* Main Content Area */}
      <main className="lg:ml-[260px] min-h-screen flex flex-col">
        <MaintenanceBanner />
        
        {/* Simple Topbar for mobile with search trigger */}
        <header className="sticky top-0 z-30 flex lg:hidden items-center justify-between gap-4 border-b border-[var(--ms-border)] bg-white/95 backdrop-blur-sm px-4 h-14">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ms-text-secondary)] hover:bg-[var(--ms-surface-hover)] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          
          <button
            type="button"
            onClick={() => {
              // Trigger command palette via keyboard event
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="flex-1 max-w-xs flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-subtle)] text-sm text-[var(--ms-text-muted)]"
          >
            <Search size={16} />
            <span className="truncate">Rechercher...</span>
          </button>
          
          <div className="w-10" /> {/* Spacer for symmetry */}
        </header>
        
        <div 
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '24px',
            paddingBottom: '24px',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
