"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  CreditCard,
  Mail,
  Brain,
  HardDrive,
  RefreshCw,
  Clock,
  Server,
  Play,
  RotateCcw,
  XCircle,
  Users,
  Sparkles,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";

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

type ServiceStatus = "ok" | "degraded" | "down";

interface ServiceHealth {
  service: string;
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

interface SystemEvent {
  id: string;
  type: string;
  service: string;
  status: string;
  message: string | null;
  createdAt: string;
}

interface HealthData {
  overall: ServiceStatus;
  services: ServiceHealth[];
  checkedAt: string;
  env: { nodeEnv: string; vercelEnv?: string };
  metrics: { totalGarages: number; activeSubscriptions: number; pendingApprovals: number };
  recentEvents: SystemEvent[];
}

const SERVICE_ICONS: Record<string, typeof Database> = {
  db: Database,
  stripe: CreditCard,
  email: Mail,
  ai: Brain,
  storage: HardDrive,
  system: Server,
};

const SERVICE_LABELS: Record<string, string> = {
  db: "Base de données",
  stripe: "Paiements (Stripe)",
  email: "Emails (Resend)",
  ai: "IA / Assistant",
  storage: "Stockage fichiers",
  system: "Système",
};

const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bg: string }> = {
  ok: { label: "OK", color: "#059669", bg: "#D1FAE5" },
  degraded: { label: "Dégradé", color: "#D97706", bg: "#FEF3C7" },
  down: { label: "Down", color: "#DC2626", bg: "#FEE2E2" },
};

function formatDate(input: string) {
  const d = new Date(input);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default function SystemStatusPage() {
  const { isMobile, isTablet } = useResponsive();
  const user = useUser();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [demoStatus, setDemoStatus] = useState<{ canAccess: boolean; enabled: boolean; demoGarage: { id: number; name: string; slug: string } | null } | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const fetchDemoStatus = async () => {
    try {
      const result = await fetcher<{ canAccess: boolean; enabled: boolean; demoGarage: { id: number; name: string; slug: string } | null }>("/api/admin/demo/toggle");
      setDemoStatus(result);
    } catch {}
  };

  const toggleDemoMode = async () => {
    if (!demoStatus) return;
    setDemoLoading(true);
    try {
      const result = await requestJson<{ success: boolean; enabled: boolean; message: string }>("/api/admin/demo/toggle", {
        method: "POST",
        body: { enabled: !demoStatus.enabled },
      });
      setDemoStatus((prev) => (prev ? { ...prev, enabled: result.enabled } : null));
      toast.success(result.enabled ? "Mode démo activé" : "Mode démo désactivé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setDemoLoading(false);
    }
  };

  const resetDemo = async () => {
    setDemoLoading(true);
    try {
      const result = await fetcher<{ success: boolean; message: string; stats: Record<string, number> }>("/api/admin/demo/reset", { method: "POST" });
      toast.success(`Démo réinitialisée: ${result.stats.interventions} interventions, ${result.stats.signatures} signatures reset`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setDemoLoading(false);
    }
  };

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher<HealthData>("/api/admin/health");
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void fetchHealth();
      void fetchDemoStatus();
      const interval = setInterval(() => void fetchHealth(), 60000);
      return () => clearInterval(interval);
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

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={24} color="#6366F1" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>État du système</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Monitoring en temps réel des services</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {lastRefresh && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6B7280" }}>
              <Clock size={12} /> Mis à jour: {formatDate(lastRefresh.toISOString())}
            </span>
          )}
          <button onClick={() => void fetchHealth()} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
            <RefreshCw size={16} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: "24px" }}>
          <AlertTriangle size={20} color="#DC2626" />
          <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
        </div>
      )}

      {data && (
        <>
          {/* Overall Status Banner */}
          <div style={{ padding: "24px", borderRadius: "16px", marginBottom: "24px", background: data.overall === "ok" ? "#ECFDF5" : data.overall === "degraded" ? "#FFFBEB" : "#FEF2F2", border: `1px solid ${data.overall === "ok" ? "#A7F3D0" : data.overall === "degraded" ? "#FDE68A" : "#FECACA"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {data.overall === "ok" ? <CheckCircle size={48} color="#059669" /> : data.overall === "degraded" ? <AlertTriangle size={48} color="#D97706" /> : <XCircle size={48} color="#DC2626" />}
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: data.overall === "ok" ? "#065F46" : data.overall === "degraded" ? "#92400E" : "#991B1B", margin: 0 }}>
                  {data.overall === "ok" ? "Tous les systèmes opérationnels" : data.overall === "degraded" ? "Fonctionnement dégradé" : "Système indisponible"}
                </h2>
                <p style={{ fontSize: "14px", color: data.overall === "ok" ? "#059669" : data.overall === "degraded" ? "#D97706" : "#DC2626", marginTop: "4px", opacity: 0.8 }}>
                  Environnement: {data.env.nodeEnv}{data.env.vercelEnv && ` (${data.env.vercelEnv})`}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { title: "Garages total", value: data.metrics.totalGarages, icon: Users, color: "#6B7280" },
              { title: "Abonnements actifs", value: data.metrics.activeSubscriptions, icon: CreditCard, color: "#059669" },
              { title: "En attente approbation", value: data.metrics.pendingApprovals, icon: Clock, color: "#D97706" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{stat.title}</p>
                    <p style={{ fontSize: "28px", fontWeight: 700, color: stat.color, margin: "4px 0 0" }}>{stat.value}</p>
                  </div>
                  <stat.icon size={24} color={stat.color} />
                </div>
              </div>
            ))}
          </div>

          {/* Demo Mode */}
          {demoStatus?.canAccess && (
            <div style={{ padding: "20px", borderRadius: "16px", marginBottom: "24px", background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Play size={24} color="#fff" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Mode Démo</h3>
                    <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0" }}>
                      {demoStatus.demoGarage ? `Garage: ${demoStatus.demoGarage.name}` : "Aucun garage démo configuré"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {demoStatus.enabled && demoStatus.demoGarage && (
                    <>
                      <a href={`/app/${demoStatus.demoGarage.slug}`} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", textDecoration: "none" }}>
                        <Play size={16} /> Ouvrir Démo
                      </a>
                      <button onClick={() => void resetDemo()} disabled={demoLoading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                        <RotateCcw size={16} style={demoLoading ? { animation: "spin 1s linear infinite" } : {}} /> Reset
                      </button>
                    </>
                  )}
                  <button onClick={() => void toggleDemoMode()} disabled={demoLoading || !demoStatus.demoGarage} style={{ padding: "10px 16px", borderRadius: "10px", border: demoStatus.enabled ? "1px solid #E5E7EB" : "none", background: demoStatus.enabled ? "#fff" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: demoStatus.enabled ? "#374151" : "#fff", cursor: "pointer", opacity: demoLoading || !demoStatus.demoGarage ? 0.5 : 1 }}>
                    {demoStatus.enabled ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services Grid */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Services</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, 1fr)", gap: "16px" }}>
              {data.services.map((svc) => {
                const Icon = SERVICE_ICONS[svc.service] || Server;
                const cfg = STATUS_CONFIG[svc.status];
                return (
                  <div key={svc.service} style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={20} color={cfg.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{SERVICE_LABELS[svc.service] || svc.service}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: cfg.bg, color: cfg.color }}>
                            {svc.status === "ok" ? <CheckCircle size={12} /> : svc.status === "degraded" ? <AlertTriangle size={12} /> : <XCircle size={12} />}
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
                          {svc.latencyMs !== undefined && <div>Latence: {svc.latencyMs}ms</div>}
                          {svc.message && <div>{svc.message}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Événements récents</h3>
            <div style={{ borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", overflow: "hidden" }}>
              {data.recentEvents.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", textAlign: "center" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <Sparkles size={24} color="#9CA3AF" />
                  </div>
                  <p style={{ fontSize: "16px", fontWeight: 500, color: "#111827", margin: "0 0 4px" }}>Aucun événement</p>
                  <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Les événements système apparaîtront ici</p>
                </div>
              ) : (
                <div>
                  {data.recentEvents.slice(0, 10).map((event, idx) => {
                    const cfg = STATUS_CONFIG[event.status as ServiceStatus] || STATUS_CONFIG.ok;
                    return (
                      <div key={event.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", borderBottom: idx < Math.min(data.recentEvents.length, 10) - 1 ? "1px solid #F3F4F6" : "none", background: hoveredEvent === event.id ? "#F9FAFB" : "transparent", transition: "background 0.15s" }} onMouseEnter={() => setHoveredEvent(event.id)} onMouseLeave={() => setHoveredEvent(null)}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{SERVICE_LABELS[event.service] || event.service}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>
                            {event.type}{event.message && ` • ${event.message}`}
                          </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "#6B7280" }}>{formatDate(event.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {loading && !data && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px" }}>
          <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
