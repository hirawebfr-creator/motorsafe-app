import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  CreditCard,
  ShieldCheck,
  Receipt,
  FileCheck,
} from "lucide-react";
import type React from "react";

export type NavGroup = "main" | "admin";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  group?: NavGroup;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Clients", href: "/clients", icon: Users, group: "main" },
  { label: "Véhicules", href: "/vehicules", icon: Car, group: "main" },
  { label: "Interventions", href: "/interventions", icon: Wrench, group: "main" },
  { label: "Devis", href: "/devis", icon: FileCheck, group: "main" },
  { label: "Factures", href: "/factures", icon: Receipt, group: "main" },
  { label: "Documents", href: "/documents", icon: FileText, group: "main" },
  { label: "Messages", href: "/messages", icon: MessageSquare, group: "main" },
  { label: "Notifications", href: "/notifications", icon: Bell, group: "main" },
  { label: "Paramètres", href: "/parametres", icon: Settings, group: "main" },
  { label: "Facturation", href: "/billing", icon: CreditCard, group: "main" },
  { label: "Demandes pro", href: "/admin/pro-demandes", icon: ShieldCheck, adminOnly: true, group: "admin" },
  { label: "Références légales", href: "/admin/references", icon: ShieldCheck, adminOnly: true, group: "admin" },
];
