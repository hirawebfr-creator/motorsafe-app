import {
  LayoutGrid,
  Users,
  Car,
  Wrench,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Vehicules", href: "/vehicules", icon: Car },
  { label: "Interventions", href: "/interventions", icon: Wrench },
  { label: "Documents PDF", href: "/documents", icon: FileText },
  { label: "Parametres", href: "/parametres", icon: Settings },
  { label: "Pro demandes", href: "/admin/pro-demandes", icon: ShieldCheck, adminOnly: true },
  { label: "References legales", href: "/admin/references", icon: ShieldCheck, adminOnly: true },
];