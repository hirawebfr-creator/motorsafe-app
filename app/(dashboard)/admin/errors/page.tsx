"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Filter,
  ExternalLink,
  Clock,
  CreditCard,
  Mail,
  Brain,
  Car,
  FileText,
  Archive,
  PenTool,
  Server,
  Activity,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";
import { useUser } from "@/components/user-context";
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

interface SystemEvent {
  id: string;
  type: string;
  service: string;
  status: string;
  message: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface HealthData {
  recentEvents: SystemEvent[];
}

const SERVICE_ICONS: Record<string, typeof Server> = {
  db: Server,
  stripe: CreditCard,
  email: Mail,
  ai: Brain,
  lookup: Car,
  pdf: FileText,
  zip: Archive,
  sign: PenTool,
  general: Server,
  auth: Server,
  storage: Server,
  system: Server,
};

const SERVICE_LABELS: Record<string, string> = {
  db: "Base de données",
  stripe: "Paiements (Stripe)",
  email: "Emails",
  ai: "IA / Assistant",
  lookup: "Recherche plaque",
  pdf: "Génération PDF",
  zip: "Export ZIP",
  sign: "Signatures",
  general: "Général",
  auth: "Authentification",
  storage: "Stockage",
  system: "Système",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ok: { label: "OK", color: "#059669", bg: "#D1FAE5" },
  degraded: { label: "Dégradé", color: "#D97706", bg: "#FEF3C7" },
  down: { label: "Erreur", color: "#DC2626", bg: "#FEE2E2" },
};

function formatDate(input: string) {
  const d = new Date(input);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

export default function AdminErrorsPage() {
  const user = useUser();
  const { isMobile, isTablet } = useResponsive();
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const isAdmin = user?.role === "ADMIN";

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<HealthData>("/api/admin/health");
      setEvents(data.recentEvents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void fetchEvents();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <Shield size={32} color="#DC2626" />
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Accès refusé</h2>
        <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Accès réservé aux administrateurs</p>
      </div>
    );
  }

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (filter !== "all" && event.service !== filter) return false;
    if (typeFilter !== "all") {
      if (typeFilter === "errors" && event.status === "ok") return false;
      if (typeFilter === "warnings" && event.status !== "degraded") return false;
    }
    return true;
  });

  // Get unique services for filter
  const services = [...new Set(events.map((e) => e.service))];

  // Stats
  const errorCount = events.filter((e) => e.status === "down").length;
  const warningCount = events.filter((e) => e.status === "degraded").length;
  const okCount = events.filter((e) => e.status === "ok").length;

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    fontSize: "14px",
    color: "#111827",
    background: "#fff",
    outline: "none",
  };

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={24} color="#D97706" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Erreurs système</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Suivi des erreurs et alertes récentes</p>
          </div>
        </div>
        <button
          onClick={() => void fetchEvents()}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#374151", cursor: "pointer" }}
        >
          <RefreshCw size={18} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          Actualiser
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: "24px" }}>
          <AlertTriangle size={20} color="#DC2626" />
          <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total événements", value: events.length, icon: Activity, color: "#6366F1", bg: "#EEF2FF" },
          { label: "Erreurs critiques", value: errorCount, icon: XCircle, color: "#DC2626", bg: "#FEE2E2" },
          { label: "Avertissements", value: warningCount, icon: AlertTriangle, color: "#D97706", bg: "#FEF3C7" },
          { label: "OK", value: okCount, icon: CheckCircle, color: "#059669", bg: "#D1FAE5" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px" }}>{item.label}</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                </div>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={24} color={item.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ padding: "16px 20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} color="#6B7280" />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Filtres:</span>
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={inputStyle}>
            <option value="all">Tous les services</option>
            {services.map((svc) => (
              <option key={svc} value={svc}>{SERVICE_LABELS[svc] || svc}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={inputStyle}>
            <option value="all">Tous les types</option>
            <option value="errors">Erreurs seulement</option>
            <option value="warnings">Warnings seulement</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
          <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Events List */}
      {!loading && (
        <div style={{ borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {filteredEvents.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Activity size={32} color="#9CA3AF" />
              </div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
                {events.length === 0 ? "Aucun événement enregistré" : "Aucun événement correspondant"}
              </p>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
                {events.length === 0 ? "Les événements système apparaîtront ici" : "Essayez de modifier les filtres"}
              </p>
            </div>
          ) : (
            <div>
              {filteredEvents.map((event, idx) => {
                const Icon = SERVICE_ICONS[event.service] || Server;
                const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.ok;
                const metadata = event.metadata as Record<string, unknown> | undefined;
                const sentryEventId = metadata?.sentryEventId as string | undefined;

                return (
                  <div
                    key={event.id}
                    style={{ padding: "16px 20px", borderBottom: idx < filteredEvents.length - 1 ? "1px solid #F3F4F6" : "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: statusCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={22} color={statusCfg.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>{SERVICE_LABELS[event.service] || event.service}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: statusCfg.bg, color: statusCfg.color }}>
                            {event.status === "ok" && <CheckCircle size={12} />}
                            {event.status === "degraded" && <AlertTriangle size={12} />}
                            {event.status === "down" && <XCircle size={12} />}
                            {statusCfg.label}
                          </span>
                          <span style={{ fontSize: "12px", color: "#9CA3AF", fontFamily: "monospace" }}>{event.type}</span>
                        </div>
                        {event.message && (
                          <p style={{ fontSize: "14px", color: "#6B7280", margin: "8px 0 0", lineHeight: 1.5 }}>{event.message}</p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#9CA3AF" }}>
                            <Clock size={12} />
                            {formatDate(event.createdAt)}
                          </span>
                          {sentryEventId && (
                            <a
                              href={`https://sentry.io/issues/?query=event.id:${sentryEventId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6366F1", textDecoration: "none" }}
                            >
                              <ExternalLink size={12} />
                              Voir dans Sentry
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sentry Link */}
      <div style={{ textAlign: "center", marginTop: "24px" }}>
        <a
          href="https://sentry.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#6366F1", textDecoration: "none" }}
        >
          <ExternalLink size={16} />
          Ouvrir le dashboard Sentry complet
        </a>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
