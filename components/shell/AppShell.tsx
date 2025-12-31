"use client";

import { ReactNode, useState } from "react";
import ResponsiveSidebar from "@/components/layout/responsive/ResponsiveSidebar";
import ResponsiveTopbar from "@/components/layout/responsive/ResponsiveTopbar";
import Container from "@/components/ui/container/Container";
import Drawer from "@/components/ui/navigation/Drawer";
import BottomNav from "@/components/ui/navigation/BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Responsive layout: desktop/tablet (md+) vs mobile (<md)
  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-background-dark dark:text-foreground-dark pt-safe pb-safe">
      {/* Desktop/tablet layout */}
      <div className="hidden md:flex min-h-screen w-full">
        <ResponsiveSidebar>
          {/* TODO: Pass navItems/user if needed */}
          <></>
        </ResponsiveSidebar>
        <div className="flex flex-col flex-1 min-h-screen">
          <ResponsiveTopbar>
            {/* TODO: Add actions/search if needed */}
            <></>
          </ResponsiveTopbar>
          <Container>
            <main className="flex-1 w-full">
              {children}
            </main>
          </Container>
        </div>
      </div>
      {/* Mobile layout */}
      <div className="flex flex-col md:hidden min-h-screen w-full">
        <ResponsiveTopbar>
          {/* TODO: Add mobile actions/search if needed */}
          <></>
        </ResponsiveTopbar>
        <Container>
          <main className="flex-1 w-full">
            {children}
          </main>
        </Container>
        <BottomNav>{/* TODO: Add nav items */}<></></BottomNav>
        {/* Drawer for mobile sidebar (optional) */}
        {/* <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>...</Drawer> */}
      </div>
    </div>
  );
}
