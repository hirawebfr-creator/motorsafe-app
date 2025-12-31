
import ResponsiveSidebar from "@/components/layout/responsive/ResponsiveSidebar";
import ResponsiveTopbar from "@/components/layout/responsive/ResponsiveTopbar";
import Container from "@/components/ui/container/Container";
import BottomNav from "@/components/ui/navigation/BottomNav";
import type { SessionUser } from "@/lib/auth";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

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
  onToggleCreate?: () => void;
  createOpen?: boolean;
  onLogout?: () => void;
};

export function AppShell({
  children,
  user,
  navItems = [],
  activePath,
  sidebarOpen = false,
  onSidebarClose = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
  onMenu = () => {},
  onToggleCreate = () => {},
  createOpen = false,
  onLogout = () => {},
}: AppShellProps) {
  const pathname = usePathname?.() || activePath || "/";
  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-background-dark dark:text-foreground-dark pt-safe pb-safe">
      {/* Desktop/tablet layout */}
      <div className="hidden md:flex min-h-screen w-full" id="dashboard-desktop-layout">
        <ResponsiveSidebar>
          {/* TODO: Ajoute ici la logique de navigation ou de profil si besoin */}
          <></>
        </ResponsiveSidebar>
        <div className="flex flex-col flex-1 min-h-screen">
          <ResponsiveTopbar>
            {/* TODO: Ajoute ici les actions ou la recherche si besoin */}
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
      <div className="flex flex-col md:hidden min-h-screen w-full" id="dashboard-mobile-layout">
        <ResponsiveTopbar>
          {/* TODO: Ajoute ici les actions ou la recherche mobile si besoin */}
          <></>
        </ResponsiveTopbar>
        <Container>
          <main className="flex-1 w-full">
            {children}
          </main>
        </Container>
        <BottomNav>{/* TODO: Ajoute les items de navigation mobile ici */}<></></BottomNav>
      </div>
    </div>
  );
}
