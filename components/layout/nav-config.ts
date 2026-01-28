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
  Target,
  LifeBuoy,
  BookOpen,
  Activity,
  Newspaper,
  Calendar,
  HelpCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// NAV CONFIGURATION - SafeMotor
// ============================================================

export type NavGroup = "main" | "gestion" | "communication" | "parametres" | "admin";

export type NavSection = {
  id: NavGroup;
  label: string;
  adminOnly?: boolean;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  group: NavGroup;
  badge?: string;
  isNew?: boolean;
};

// Sections de navigation (ordre d'affichage)
export const NAV_SECTIONS: NavSection[] = [
  { id: "main", label: "" }, // Dashboard - pas de label
  { id: "gestion", label: "Gestion" },
  { id: "communication", label: "Communication" },
  { id: "parametres", label: "Paramètres" },
  { id: "admin", label: "Administration", adminOnly: true },
];

// Items de navigation organisés par section
export const NAV_ITEMS: NavItem[] = [
  // ===== MAIN - Dashboard =====
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },

  // ===== GESTION - Coeur de métier =====
  { label: "Clients", href: "/clients", icon: Users, group: "gestion" },
  { label: "Véhicules", href: "/vehicules", icon: Car, group: "gestion" },
  { label: "Interventions", href: "/interventions", icon: Wrench, group: "gestion" },
  { label: "Comparateur E85/Stage", href: "/comparateur", icon: Zap, group: "gestion", isNew: true },
  { label: "Planning", href: "/planning", icon: CalendarDays, group: "gestion" },
  { label: "Devis", href: "/devis", icon: FileCheck, group: "gestion" },
  { label: "Factures", href: "/factures", icon: Receipt, group: "gestion" },
  { label: "Documents", href: "/documents", icon: FileText, group: "gestion" },
  { label: "Équipe", href: "/equipe", icon: UsersRound, group: "gestion" },

  // ===== COMMUNICATION =====
  { label: "Messages", href: "/messages", icon: MessageSquare, group: "communication" },
  { label: "Notifications", href: "/notifications", icon: Bell, group: "communication" },

  // ===== PARAMETRES =====
  { label: "Mon garage", href: "/garage", icon: Store, group: "parametres" },
  { label: "Paramètres", href: "/parametres", icon: Settings, group: "parametres" },
  { label: "Facturation", href: "/billing", icon: CreditCard, group: "parametres" },
  { label: "Nouveautés", href: "/nouveautes", icon: Newspaper, group: "parametres", isNew: true },
  { label: "Aide / FAQ", href: "/aide", icon: HelpCircle, group: "parametres" },
  { label: "Support", href: "/support", icon: LifeBuoy, group: "parametres" },

  // ===== ADMIN =====
  { label: "Vue globale", href: "/admin/dashboard", icon: BarChart3, adminOnly: true, group: "admin" },
  { label: "Leads", href: "/admin/leads", icon: Target, adminOnly: true, group: "admin" },
  { label: "Garages", href: "/admin/garages", icon: Building2, adminOnly: true, group: "admin" },
  { label: "Demandes pro", href: "/admin/pro-demandes", icon: UserCheck, adminOnly: true, group: "admin" },
  { label: "Tous les clients", href: "/admin/clients", icon: Users, adminOnly: true, group: "admin" },
  { label: "Références légales", href: "/admin/references", icon: Scale, adminOnly: true, group: "admin" },
  { label: "Base de connaissance", href: "/admin/kb", icon: BookOpen, adminOnly: true, group: "admin" },
  { label: "Support Tickets", href: "/admin/support", icon: LifeBuoy, adminOnly: true, group: "admin" },
  { label: "Support Ops", href: "/admin/support-ops", icon: Activity, adminOnly: true, group: "admin" },
  { label: "Changelog", href: "/admin/changelog", icon: Newspaper, adminOnly: true, group: "admin" },
  { label: "Maintenance", href: "/admin/maintenance", icon: Calendar, adminOnly: true, group: "admin" },
];

// Helper: obtenir les items par groupe
export function getItemsByGroup(items: NavItem[], group: NavGroup): NavItem[] {
  return items.filter((item) => item.group === group);
}

// Helper: filtrer les items admin
export function filterNavItems(items: NavItem[], isAdmin: boolean): NavItem[] {
  return items.filter((item) => !item.adminOnly || isAdmin);
}

// Quick actions pour la palette de commandes
export const QUICK_ACTIONS = [
  { label: "Nouveau client", href: "/clients/nouveau", icon: Users },
  { label: "Nouvelle intervention", href: "/interventions/nouvelle", icon: Wrench },
  { label: "Nouveau devis", href: "/devis/nouveau", icon: FileCheck },
  { label: "Nouvelle facture", href: "/factures/nouvelle", icon: Receipt },
];
