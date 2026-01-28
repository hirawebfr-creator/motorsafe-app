"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";
import {
  Building2,
  Users,
  Car,
  Wrench,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
  RefreshCw,
  Shield,
  Crown,
  Star,
  CreditCard,
  ChevronRight,
} from "lucide-react";

// Responsive hook
function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen };
}

type AdminStats = {
  totals: { garages: number; activeGarages: number; pendingGarages: number; rejectedGarages: number; users: number; clients: number; vehicles: number; interventions: number; quotes: number; invoices: number };
  thisWeek: { newGarages: number; newClients: number; newVehicles: number; newInterventions: number; newQuotes: number; newInvoices: number };
  today: { newGarages: number };
  thisMonth: { newGarages: number };
  finances: { totalRevenue: number; pendingRevenue: number; paidInvoices: number; unpaidInvoices: number };
  subscriptions: { active: number; trialing: number; mrr: number; arr: number };
  plans: { FREE: number; STARTER: number; PRO: number };
  topGarages: Array<{ id: number; name: string; email: string; plan: string; createdAt: string; stats: { clients: number; vehicles: number; interventions: number; quotes: number; invoices: number } }>;
  recentGarages: Array<{ id: number; name: string; email: string; status: string; plan: string; createdAt: string; usersCount: number }>;
};

function fmtDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function fmtEur(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#FEF3C7", color: "#D97706" },
  ACTIVE: { bg: "#D1FAE5", color: "#059669" },
  REJECTED: { bg: "#FEE2E2", color: "#DC2626" },
};

const PLAN_CONFIG: Record<string, { bg: string; color: string; icon: typeof Star }> = {
  FREE: { bg: "#F3F4F6", color: "#6B7280", icon: Shield },
  STARTER: { bg: "#DBEAFE", color: "#2563EB", icon: Star },
  PRO: { bg: "#EDE9FE", color: "#7C3AED", icon: Crown },
};

export default function AdminDashboardPage() {
  const user = useUser();
  const { isMobile, isTablet } = useResponsive();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<AdminStats>("/api/admin/stats", { noStore: true });
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadStats();
    }
  }, [isAdmin, loadStats]);

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <Shield size={32} color="#DC2626" />
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Accès refusé</h2>
        <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Cette page est réservée aux administrateurs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
        <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ padding: "32px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ padding: "24px", borderRadius: "16px", background: "#FEF2F2", border: "1px solid #FECACA", textAlign: "center" }}>
          <AlertCircle size={48} color="#DC2626" style={{ marginBottom: "16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#DC2626", margin: "0 0 8px" }}>Erreur de chargement</h2>
          <p style={{ fontSize: "14px", color: "#7F1D1D", margin: 0 }}>{error || "Impossible de charger les statistiques"}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard Admin</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "4px" }}>Vue globale de toute la plateforme SafeMotor</p>
        </div>
        <button
          onClick={() => void loadStats()}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#374151", cursor: "pointer" }}
        >
          <RefreshCw size={18} />
          Rafraîchir
        </button>
      </div>

      {/* KPIs principaux */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Garages", value: stats.totals.garages, icon: Building2, bg: "#EEF2FF", color: "#6366F1" },
          { label: "Utilisateurs", value: stats.totals.users, icon: Users, bg: "#D1FAE5", color: "#059669" },
          { label: "Clients", value: stats.totals.clients, icon: Users, bg: "#FEF3C7", color: "#F59E0B" },
          { label: "Véhicules", value: stats.totals.vehicles, icon: Car, bg: "#DBEAFE", color: "#3B82F6" },
          { label: "Interventions", value: stats.totals.interventions, icon: Wrench, bg: "#EDE9FE", color: "#7C3AED" },
          { label: "Factures", value: stats.totals.invoices, icon: Receipt, bg: "#D1FAE5", color: "#10B981" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ padding: "16px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={item.color} />
                </div>
                <div>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>{item.value}</p>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>{item.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats détaillées */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {/* Statut garages */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Building2 size={20} color="#6366F1" />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Statut des Garages</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151" }}><CheckCircle size={16} color="#10B981" /> Actifs</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#10B981" }}>{stats.totals.activeGarages}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151" }}><Clock size={16} color="#F59E0B" /> En attente</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#F59E0B" }}>{stats.totals.pendingGarages}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151" }}><XCircle size={16} color="#EF4444" /> Refusés</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#EF4444" }}>{stats.totals.rejectedGarages}</span>
            </div>
          </div>
          {stats.totals.pendingGarages > 0 && (
            <Link href="/admin" style={{ display: "block", marginTop: "16px", fontSize: "13px", color: "#6366F1", textDecoration: "none" }}>
              Voir les demandes →
            </Link>
          )}
        </div>

        {/* Plans */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Crown size={20} color="#7C3AED" />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Distribution Plans</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151" }}><Shield size={16} color="#6B7280" /> FREE</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#6B7280" }}>{stats.plans.FREE}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151" }}><Star size={16} color="#3B82F6" /> STARTER</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#3B82F6" }}>{stats.plans.STARTER}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151" }}><Crown size={16} color="#7C3AED" /> PRO</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#7C3AED" }}>{stats.plans.PRO}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: "16px", height: "8px", borderRadius: "4px", background: "#E5E7EB", overflow: "hidden", display: "flex" }}>
            {(() => {
              const total = stats.plans.FREE + stats.plans.STARTER + stats.plans.PRO;
              if (total === 0) return null;
              return (
                <>
                  <div style={{ width: `${(stats.plans.FREE / total) * 100}%`, background: "#9CA3AF" }} />
                  <div style={{ width: `${(stats.plans.STARTER / total) * 100}%`, background: "#3B82F6" }} />
                  <div style={{ width: `${(stats.plans.PRO / total) * 100}%`, background: "#7C3AED" }} />
                </>
              );
            })()}
          </div>
        </div>

        {/* Abonnements Stripe */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <CreditCard size={20} color="#06B6D4" />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Abonnements Stripe</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>MRR</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#06B6D4" }}>{fmtEur(stats.subscriptions.mrr)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>ARR</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#06B6D4" }}>{fmtEur(stats.subscriptions.arr)}</span>
            </div>
            <div style={{ height: "1px", background: "#E5E7EB" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#6B7280" }}>Abos actifs</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#10B981" }}>{stats.subscriptions.active}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#6B7280" }}>Essais en cours</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#3B82F6" }}>{stats.subscriptions.trialing}</span>
            </div>
          </div>
        </div>

        {/* Finances */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <DollarSign size={20} color="#10B981" />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Finances Globales</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>CA Total (payé)</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#10B981" }}>{fmtEur(stats.finances.totalRevenue)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>En attente</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#F59E0B" }}>{fmtEur(stats.finances.pendingRevenue)}</span>
            </div>
            <div style={{ height: "1px", background: "#E5E7EB" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#6B7280" }}>Factures payées</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#10B981" }}>{stats.finances.paidInvoices}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#6B7280" }}>Factures en cours</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#F59E0B" }}>{stats.finances.unpaidInvoices}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activité cette semaine */}
      <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <TrendingUp size={20} color="#6366F1" />
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Activité cette semaine</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: "12px" }}>
          {[
            { label: "Garages", value: stats.thisWeek.newGarages, color: "#6366F1" },
            { label: "Clients", value: stats.thisWeek.newClients, color: "#F59E0B" },
            { label: "Véhicules", value: stats.thisWeek.newVehicles, color: "#3B82F6" },
            { label: "Interventions", value: stats.thisWeek.newInterventions, color: "#7C3AED" },
            { label: "Devis", value: stats.thisWeek.newQuotes, color: "#06B6D4" },
            { label: "Factures", value: stats.thisWeek.newInvoices, color: "#10B981" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "16px", borderRadius: "12px", background: "#F9FAFB", textAlign: "center" }}>
              <p style={{ fontSize: "24px", fontWeight: 700, color: item.color, margin: 0 }}>+{item.value}</p>
              <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0 0" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Garages & Récents */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "24px", marginBottom: "24px" }}>
        {/* Top Garages */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={18} color="#6366F1" />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Top Garages (par interventions)</h3>
          </div>
          <div>
            {stats.topGarages.slice(0, 5).map((garage, idx) => {
              const planCfg = PLAN_CONFIG[garage.plan] || PLAN_CONFIG.FREE;
              const PlanIcon = planCfg.icon;
              return (
                <div key={garage.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: idx < 4 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#6366F1" }}>{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{garage.name}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: planCfg.bg, color: planCfg.color }}>
                        <PlanIcon size={10} /> {garage.plan}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>{garage.email}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>{garage.stats.interventions}</p>
                    <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>interventions</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
            <Link href="/admin/garages" style={{ fontSize: "13px", color: "#6366F1", textDecoration: "none" }}>Voir tous les garages →</Link>
          </div>
        </div>

        {/* Dernières inscriptions */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} color="#F59E0B" />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Dernières inscriptions</h3>
          </div>
          <div>
            {stats.recentGarages.slice(0, 5).map((garage, idx) => {
              const statusCfg = STATUS_CONFIG[garage.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={garage.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: idx < 4 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={20} color="#F59E0B" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{garage.name}</span>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 500, background: statusCfg.bg, color: statusCfg.color }}>{garage.status}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>{fmtDate(garage.createdAt)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>{garage.usersCount}</p>
                    <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>users</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
            <Link href="/admin" style={{ fontSize: "13px", color: "#6366F1", textDecoration: "none" }}>Voir demandes en attente →</Link>
          </div>
        </div>
      </div>

      {/* Navigation rapide */}
      <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Navigation Admin</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { href: "/admin", label: "Demandes Pro", sub: `${stats.totals.pendingGarages} en attente`, icon: AlertCircle, color: "#F59E0B" },
            { href: "/admin/garages", label: "Tous les Garages", sub: `${stats.totals.garages} total`, icon: Building2, color: "#6366F1" },
            { href: "/admin/clients", label: "Tous les Clients", sub: `${stats.totals.clients} total`, icon: Users, color: "#F97316" },
            { href: "/admin/references", label: "Références légales", sub: "Gérer les références", icon: FileText, color: "#7C3AED" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Link key={i} href={item.href} style={{ textDecoration: "none" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "12px", border: "1px solid #E5E7EB", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon size={24} color={item.color} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>{item.sub}</p>
                  </div>
                  <ChevronRight size={18} color="#D1D5DB" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
