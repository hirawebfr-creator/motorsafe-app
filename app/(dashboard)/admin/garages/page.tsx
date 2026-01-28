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
  Crown,
  Star,
  Shield,
  Award,
  Gift,
  Search,
  RefreshCw,
  Key,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
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

type GarageItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  plan?: string | null;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  partnerBadgeEnabled?: boolean;
  partnerBadgeAdminOverride?: string;
  referralCode?: string | null;
  referredByGarageId?: number | null;
  referralStatus?: string | null;
  referralRewardMonths?: number;
  referredByGarage?: { id: number; name: string } | null;
  users: Array<{ id: string; email: string; role: string; createdAt: string }>;
  _count?: {
    clients: number;
    vehicles: number;
    interventions: number;
    quotes: number;
    invoices: number;
  };
};

const PLAN_CONFIG: Record<string, { bg: string; color: string; icon: typeof Star }> = {
  FREE: { bg: "#F3F4F6", color: "#6B7280", icon: Shield },
  STARTER: { bg: "#DBEAFE", color: "#2563EB", icon: Star },
  PRO: { bg: "#EDE9FE", color: "#7C3AED", icon: Crown },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: "Actif", bg: "#D1FAE5", color: "#059669", icon: CheckCircle },
  PENDING: { label: "En attente", bg: "#FEF3C7", color: "#D97706", icon: Clock },
  REJECTED: { label: "Refusé", bg: "#FEE2E2", color: "#DC2626", icon: XCircle },
};

export default function AdminGaragesPage() {
  const user = useUser();
  const { isMobile, isTablet } = useResponsive();

  const [garages, setGarages] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(false);
  const [updatingBadge, setUpdatingBadge] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadGarages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<GarageItem[]>("/api/admin/garages?withStats=true", {
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      setGarages(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, isAdmin]);

  const updateBadgeOverride = async (garageId: number, override: "NONE" | "FORCE_ON" | "FORCE_OFF") => {
    setUpdatingBadge(garageId);
    try {
      const res = await fetch(`/api/admin/garages/${garageId}/partner-badge`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(!isAdmin && adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({ override }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour badge");
      await loadGarages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUpdatingBadge(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      setKeyReady(true);
      loadGarages();
      return;
    }
    if (keyReady) loadGarages();
  }, [isAdmin, keyReady, loadGarages, user]);

  // Filter garages
  const filteredGarages = garages.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.siret?.toLowerCase().includes(q)
    );
  });

  // Stats
  const stats = {
    total: garages.length,
    active: garages.filter((g) => g.status === "ACTIVE").length,
    pending: garages.filter((g) => g.status === "PENDING").length,
    pro: garages.filter((g) => g.plan === "PRO").length,
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr));
  };

  if (!user) return null;

  // Admin key prompt
  if (!keyReady && !isAdmin) {
    return (
      <div style={{ padding: isMobile ? "16px" : "32px", maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #E5E7EB", padding: isMobile ? "24px" : "32px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Key size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Administration</h1>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px" }}>Entrez votre clé pour accéder au panneau admin</p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="ADMIN_KEY"
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={() => {
              if (!adminKey.trim()) return;
              window.localStorage.setItem("ms_admin_key", adminKey.trim());
              setKeyReady(true);
            }}
            style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Shield size={18} />
            Déverrouiller
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: isMobile ? "24px" : "32px", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "#111827", margin: 0 }}>Tous les garages</h1>
          <p style={{ fontSize: isMobile ? "13px" : "15px", color: "#6B7280", marginTop: "4px" }}>Liste complète des garages inscrits sur la plateforme</p>
        </div>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            <ArrowLeft size={18} />
            Retour validations
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? "12px" : "16px", marginBottom: isMobile ? "24px" : "32px" }}>
        <div style={{ padding: isMobile ? "16px" : "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "14px" }}>
            <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={isMobile ? 20 : 24} color="#6366F1" />
            </div>
            <div>
              <p style={{ fontSize: isMobile ? "11px" : "13px", color: "#6B7280", margin: 0 }}>Total</p>
              <p style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{stats.total}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: isMobile ? "16px" : "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "14px" }}>
            <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", borderRadius: "12px", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={isMobile ? 20 : 24} color="#059669" />
            </div>
            <div>
              <p style={{ fontSize: isMobile ? "11px" : "13px", color: "#6B7280", margin: 0 }}>Actifs</p>
              <p style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#059669", margin: 0 }}>{stats.active}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: isMobile ? "16px" : "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "14px" }}>
            <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", borderRadius: "12px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={isMobile ? 20 : 24} color="#D97706" />
            </div>
            <div>
              <p style={{ fontSize: isMobile ? "11px" : "13px", color: "#6B7280", margin: 0 }}>En attente</p>
              <p style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#D97706", margin: 0 }}>{stats.pending}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: isMobile ? "16px" : "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "14px" }}>
            <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={isMobile ? 20 : 24} color="#7C3AED" />
            </div>
            <div>
              <p style={{ fontSize: isMobile ? "11px" : "13px", color: "#6B7280", margin: 0 }}>Pro</p>
              <p style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#7C3AED", margin: 0 }}>{stats.pro}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ position: "relative", maxWidth: isMobile ? "100%" : "400px" }}>
          <Search size={20} color="#9CA3AF" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un garage..."
            style={{ width: "100%", padding: "14px 14px 14px 48px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: "24px", color: "#DC2626", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Garages List */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
            <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filteredGarages.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <Building2 size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0, marginBottom: "8px" }}>Aucun garage</h3>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Les garages apparaîtront ici</p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card view */
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredGarages.map((garage, index) => {
              const planCfg = PLAN_CONFIG[garage.plan || "FREE"] || PLAN_CONFIG.FREE;
              const statusCfg = STATUS_CONFIG[garage.status] || STATUS_CONFIG.PENDING;
              return (
                <div
                  key={garage.id}
                  style={{ padding: "16px", borderBottom: index < filteredGarages.length - 1 ? "1px solid #F3F4F6" : "none" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={24} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>{garage.name}</span>
                        <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: planCfg.bg, color: planCfg.color }}>{garage.plan || "FREE"}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px" }}>{garage.email}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                        {garage._count && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#6B7280" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Users size={12} /> {garage._count.clients}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Car size={12} /> {garage._count.vehicles}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Wrench size={12} /> {garage._count.interventions}</span>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>Créé le {formatDate(garage.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop/Tablet: Table view */
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Garage</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Plan</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Statut</th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Badge</th>
                {!isTablet && <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Parrainage</th>}
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Stats</th>
                {!isTablet && <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Responsable</th>}
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Création</th>
              </tr>
            </thead>
            <tbody>
              {filteredGarages.map((garage, index) => {
                const planCfg = PLAN_CONFIG[garage.plan || "FREE"] || PLAN_CONFIG.FREE;
                const statusCfg = STATUS_CONFIG[garage.status] || STATUS_CONFIG.PENDING;
                const PlanIcon = planCfg.icon;
                const override = garage.partnerBadgeAdminOverride || "NONE";
                const enabled = garage.partnerBadgeEnabled ?? false;
                const badgeEffective = override === "FORCE_ON" ? true : override === "FORCE_OFF" ? false : enabled;

                return (
                  <tr
                    key={garage.id}
                    style={{ borderBottom: index < filteredGarages.length - 1 ? "1px solid #F3F4F6" : "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Building2 size={20} color="#fff" />
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{garage.name}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>{garage.email}</div>
                          {garage.siret && <div style={{ fontSize: "11px", color: "#9CA3AF" }}>SIRET: {garage.siret}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: planCfg.bg, color: planCfg.color }}>
                        <PlanIcon size={12} />
                        {garage.plan || "FREE"}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: statusCfg.bg, color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <Award size={16} color={badgeEffective ? "#10B981" : "#D1D5DB"} />
                        <select
                          value={override}
                          onChange={(e) => updateBadgeOverride(garage.id, e.target.value as "NONE" | "FORCE_ON" | "FORCE_OFF")}
                          disabled={updatingBadge === garage.id}
                          style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #E5E7EB", fontSize: "11px", cursor: "pointer", background: "#fff" }}
                        >
                          <option value="NONE">Auto ({enabled ? "ON" : "OFF"})</option>
                          <option value="FORCE_ON">Forcer ON</option>
                          <option value="FORCE_OFF">Forcer OFF</option>
                        </select>
                      </div>
                    </td>
                    {!isTablet && (
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", fontSize: "11px" }}>
                          {garage.referredByGarage ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10B981" }}>
                              <Gift size={12} /> {garage.referredByGarage.name.slice(0, 12)}
                            </span>
                          ) : null}
                          {garage.referralCode && (
                            <span style={{ color: "#9CA3AF", fontFamily: "monospace" }}>{garage.referralCode}</span>
                          )}
                          {(garage.referralRewardMonths ?? 0) > 0 && (
                            <span style={{ color: "#F59E0B" }}>+{garage.referralRewardMonths} mois</span>
                          )}
                          {!garage.referredByGarage && !garage.referralCode && <span style={{ color: "#D1D5DB" }}>-</span>}
                        </div>
                      </td>
                    )}
                    <td style={{ padding: "16px" }}>
                      {garage._count ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "12px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#F97316" }} title="Clients"><Users size={14} /> {garage._count.clients}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#3B82F6" }} title="Véhicules"><Car size={14} /> {garage._count.vehicles}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#8B5CF6" }} title="Interventions"><Wrench size={14} /> {garage._count.interventions}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#06B6D4" }} title="Devis"><FileText size={14} /> {garage._count.quotes}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#10B981" }} title="Factures"><Receipt size={14} /> {garage._count.invoices}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#D1D5DB" }}>—</span>
                      )}
                    </td>
                    {!isTablet && (
                      <td style={{ padding: "16px", fontSize: "13px", color: "#6B7280" }}>
                        {garage.users[0]?.email ?? "-"}
                      </td>
                    )}
                    <td style={{ padding: "16px 20px", textAlign: "right", fontSize: "13px", color: "#6B7280" }}>
                      {formatDate(garage.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
