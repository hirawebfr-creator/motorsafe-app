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
  Receipt,
  FileCheck,
  Building2,
  BarChart3,
  UserCheck,
  Scale,
  Store,
  CalendarDays,
  UsersRound,
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
  // ===== Section Garage (main) =====
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Clients", href: "/clients", icon: Users, group: "main" },
  { label: "Véhicules", href: "/vehicules", icon: Car, group: "main" },
  { label: "Interventions", href: "/interventions", icon: Wrench, group: "main" },
  { label: "Planning", href: "/planning", icon: CalendarDays, group: "main" },
  { label: "Devis", href: "/devis", icon: FileCheck, group: "main" },
  { label: "Factures", href: "/factures", icon: Receipt, group: "main" },
  { label: "Documents", href: "/documents", icon: FileText, group: "main" },
  { label: "Équipe", href: "/equipe", icon: UsersRound, group: "main" },
  { label: "Messages", href: "/messages", icon: MessageSquare, group: "main" },
  { label: "Notifications", href: "/notifications", icon: Bell, group: "main" },
  { label: "Paramètres", href: "/parametres", icon: Settings, group: "main" },
  { label: "Mon garage", href: "/garage", icon: Store, group: "main" },
  { label: "Facturation", href: "/billing", icon: CreditCard, group: "main" },
  
  // ===== Section Admin (admin only) =====
  { label: "Vue globale", href: "/admin/dashboard", icon: BarChart3, adminOnly: true, group: "admin" },
  { label: "Garages", href: "/admin/garages", icon: Building2, adminOnly: true, group: "admin" },
  { label: "Demandes pro", href: "/admin/pro-demandes", icon: UserCheck, adminOnly: true, group: "admin" },
  { label: "Tous les clients", href: "/admin/clients", icon: Users, adminOnly: true, group: "admin" },
  { label: "Références légales", href: "/admin/references", icon: Scale, adminOnly: true, group: "admin" },
];
