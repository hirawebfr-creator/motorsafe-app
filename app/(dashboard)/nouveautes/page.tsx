"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Newspaper,
  RefreshCw,
  Loader2,
  Sparkles,
  Bug,
  Shield,
  Scale,
  Filter,
  ChevronRight,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CreditCard,
  Mail,
  HardDrive,
  Search,
  Wrench,
  Calendar,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";

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

type ChangelogType = "FEATURE" | "FIX" | "SECURITY" | "LEGAL";

interface ChangelogEntry {
  id: string;
  title: string;
  type: ChangelogType;
  version: string | null;
  publishedAt: string;
}

type ServiceStatus = "OK" | "DELAYED" | "DOWN" | "UNKNOWN";

interface ServiceInfo {
  status: ServiceStatus;
  lastCheck: string | null;
  message: string;
}

interface IncidentsStatus {
  overall: ServiceStatus;
  services: {
    stripe: ServiceInfo;
    email: ServiceInfo;
    storage: ServiceInfo;
    lookup: ServiceInfo;
  };
  lastUpdated: string;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
  severity: "INFO" | "WARNING";
}

interface MaintenanceResponse {
  current: MaintenanceWindow | null;
  upcoming: MaintenanceWindow[];
  hasActive: boolean;
  hasUpcoming: boolean;
}

const TYPE_CONFIG: Record<ChangelogType, { color: string; bg: string; label: string }> = {
  FEATURE: { color: "#2563EB", bg: "#DBEAFE", label: "Nouveauté" },
  FIX: { color: "#EA580C", bg: "#FFEDD5", label: "Correction" },
  SECURITY: { color: "#DC2626", bg: "#FEE2E2", label: "Sécurité" },
  LEGAL: { color: "#7C3AED", bg: "#EDE9FE", label: "Légal" },
};

const STATUS_CONFIG: Record<ServiceStatus, { color: string; bg: string; label: string }> = {
  OK: { color: "#059669", bg: "#D1FAE5", label: "Opérationnel" },
  DELAYED: { color: "#D97706", bg: "#FEF3C7", label: "Ralenti" },
  DOWN: { color: "#DC2626", bg: "#FEE2E2", label: "Indisponible" },
  UNKNOWN: { color: "#6B7280", bg: "#F3F4F6", label: "Inconnu" },
};

const SERVICE_INFO = {
  stripe: { name: "Paiements", Icon: CreditCard },
  email: { name: "Emails", Icon: Mail },
  storage: { name: "Stockage", Icon: HardDrive },
  lookup: { name: "Recherche véhicule", Icon: Search },
};

const FILTER_OPTIONS: { value: ChangelogType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "FEATURE", label: "Nouveautés" },
  { value: "FIX", label: "Corrections" },
  { value: "SECURITY", label: "Sécurité" },
  { value: "LEGAL", label: "Légal" },
];

// ============================================
// Component
// ============================================

export default function NouveautesPage() {
  const { isMobile, isTablet } = useResponsive();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [filter, setFilter] = useState<ChangelogType | "ALL">("ALL");
  const [status, setStatus] = useState<IncidentsStatus | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const typeParam = filter !== "ALL" ? `?type=${filter}` : "";
      const [entriesRes, statusRes, maintenanceRes] = await Promise.all([
        fetcher<{ entries: ChangelogEntry[] }>(`/api/changelog${typeParam}`),
        fetcher<IncidentsStatus>("/api/incidents/status").catch(() => null),
        fetcher<MaintenanceResponse>("/api/maintenance/active").catch(() => null),
      ]);
      setEntries(entriesRes.entries);
      setStatus(statusRes);
      setMaintenance(maintenanceRes);
    } catch (err) {
      toast.error("Erreur de chargement des nouveautés");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const formatDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return "Date inconnue";
    }
  };

  const formatMaintenanceTime = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const cardStyle: React.CSSProperties = { borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" };
  const cardBodyStyle: React.CSSProperties = { padding: "20px" };

  const getTypeIcon = (type: ChangelogType) => {
    switch (type) {
      case "FEATURE": return <Sparkles size={14} color={TYPE_CONFIG.FEATURE.color} />;
      case "FIX": return <Bug size={14} color={TYPE_CONFIG.FIX.color} />;
      case "SECURITY": return <Shield size={14} color={TYPE_CONFIG.SECURITY.color} />;
      case "LEGAL": return <Scale size={14} color={TYPE_CONFIG.LEGAL.color} />;
    }
  };

  const getStatusIcon = (s: ServiceStatus) => {
    switch (s) {
      case "OK": return <CheckCircle size={14} color={STATUS_CONFIG.OK.color} />;
      case "DELAYED": return <Clock size={14} color={STATUS_CONFIG.DELAYED.color} />;
      case "DOWN": return <XCircle size={14} color={STATUS_CONFIG.DOWN.color} />;
      case "UNKNOWN": return <AlertTriangle size={14} color={STATUS_CONFIG.UNKNOWN.color} />;
    }
  };

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Newspaper size={24} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Nouveautés</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Changelog et statut de la plateforme SafeMotor</p>
          </div>
        </div>
        <button onClick={() => void loadData()} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
          <RefreshCw size={16} style={loading ? { animation: "spin 1s linear infinite" } : {}} /> Actualiser
        </button>
      </div>

      {/* Maintenance Banner */}
      {maintenance?.current && (
        <div style={{ marginBottom: "24px", padding: "16px", borderRadius: "12px", border: `2px solid ${maintenance.current.severity === "WARNING" ? "#FDBA74" : "#93C5FD"}`, background: maintenance.current.severity === "WARNING" ? "#FFF7ED" : "#EFF6FF", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <Wrench size={24} color={maintenance.current.severity === "WARNING" ? "#EA580C" : "#2563EB"} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontWeight: 600, color: maintenance.current.severity === "WARNING" ? "#9A3412" : "#1E40AF" }}>Maintenance en cours : {maintenance.current.title}</h3>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6B7280" }}>{maintenance.current.message}</p>
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#9CA3AF" }}>Fin prévue : {formatMaintenanceTime(maintenance.current.endsAt)}</p>
          </div>
        </div>
      )}

      {/* Upcoming Maintenance */}
      {maintenance?.upcoming && maintenance.upcoming.length > 0 && !maintenance.current && (
        <div style={{ marginBottom: "24px", padding: "16px", borderRadius: "12px", border: "2px solid #FDE68A", background: "#FFFBEB", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <Calendar size={24} color="#D97706" />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontWeight: 600, color: "#92400E" }}>Maintenance planifiée</h3>
            {maintenance.upcoming.map((m) => (
              <div key={m.id} style={{ marginTop: "8px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#B45309" }}>{m.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9CA3AF" }}>{formatMaintenanceTime(m.startsAt)} → {formatMaintenanceTime(m.endsAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: "24px" }}>
        {/* Changelog Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <Filter size={16} color="#6B7280" />
            {FILTER_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setFilter(opt.value)} style={{ padding: "6px 12px", borderRadius: "9999px", border: "none", fontSize: "13px", fontWeight: 500, background: filter === opt.value ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6", color: filter === opt.value ? "#fff" : "#6B7280", cursor: "pointer" }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Entries List */}
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
              <Loader2 size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : entries.length === 0 ? (
            <div style={{ ...cardStyle, ...cardBodyStyle, textAlign: "center", padding: "48px" }}>
              <Newspaper size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
              <p style={{ color: "#6B7280" }}>Aucune nouveauté pour le moment</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {entries.map((entry) => {
                const cfg = TYPE_CONFIG[entry.type];
                return (
                  <Link key={entry.id} href={`/nouveautes/${entry.id}`} style={{ ...cardStyle, display: "block", textDecoration: "none" }}>
                    <div style={cardBodyStyle}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 500, background: cfg.bg, color: cfg.color }}>
                              {getTypeIcon(entry.type)} {cfg.label}
                            </span>
                            {entry.version && <span style={{ fontSize: "12px", color: "#9CA3AF" }}>v{entry.version}</span>}
                          </div>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</h3>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9CA3AF" }}>{formatDate(entry.publishedAt)}</p>
                        </div>
                        <ChevronRight size={20} color="#9CA3AF" style={{ flexShrink: 0 }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Platform Status */}
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={18} color="#6B7280" /> Statut plateforme
              </h3>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {status ? (
                <>
                  <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "10px", background: STATUS_CONFIG[status.overall].bg }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, color: STATUS_CONFIG[status.overall].color }}>
                      {getStatusIcon(status.overall)}
                      {status.overall === "OK" ? "Tout fonctionne" : status.overall === "DELAYED" ? "Ralentissements" : status.overall === "DOWN" ? "Incidents en cours" : "En attente de données"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(Object.entries(status.services) as [keyof typeof SERVICE_INFO, ServiceInfo][]).map(([key, service]) => {
                      const info = SERVICE_INFO[key];
                      const cfg = STATUS_CONFIG[service.status];
                      const Icon = info.Icon;
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Icon size={16} color="#6B7280" />
                            <span style={{ fontSize: "14px", color: "#374151" }}>{info.name}</span>
                          </div>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 500, color: cfg.color }}>{getStatusIcon(service.status)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/incidents" style={{ display: "block", marginTop: "16px", textAlign: "center", fontSize: "14px", color: "#6366F1", textDecoration: "none" }}>
                    Voir les détails →
                  </Link>
                </>
              ) : (
                <div style={{ padding: "16px", textAlign: "center" }}>
                  <Loader2 size={20} color="#9CA3AF" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                <Wrench size={18} color="#6B7280" /> Maintenances
              </h3>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {maintenance?.current ? (
                <div style={{ padding: "12px", borderRadius: "10px", background: "#FFF7ED" }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#EA580C" }}>En cours</p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>{maintenance.current.title}</p>
                </div>
              ) : maintenance?.upcoming && maintenance.upcoming.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {maintenance.upcoming.slice(0, 2).map((m) => (
                    <div key={m.id} style={{ padding: "12px", borderRadius: "10px", background: "#FFFBEB" }}>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#D97706" }}>{m.title}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>{formatMaintenanceTime(m.startsAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ padding: "16px", textAlign: "center", fontSize: "14px", color: "#6B7280" }}>Aucune maintenance prévue</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
