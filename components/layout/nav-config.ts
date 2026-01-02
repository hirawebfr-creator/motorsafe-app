import {
  LayoutGrid,
  Users,
  Car,
  Wrench,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  group?: "main" | "admin";
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, group: "main" },
  { label: "Clients", href: "/clients", icon: Users, group: "main" },
  { label: "Véhicules", href: "/vehicules", icon: Car, group: "main" },
  { label: "Interventions", href: "/interventions", icon: Wrench, group: "main" },
  { label: "Documents PDF", href: "/documents", icon: FileText, group: "main" },
  { label: "Paramètres", href: "/parametres", icon: Settings, group: "main" },
  { label: "Demandes pro", href: "/admin/pro-demandes", icon: ShieldCheck, adminOnly: true, group: "admin" },
  { label: "Références légales", href: "/admin/references", icon: ShieldCheck, adminOnly: true, group: "admin" },
];
