"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  CreditCard,
  Mail,
  HardDrive,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";

// ============================================================================
// INCIDENTS PAGE - SafeMotor Design System (Responsive)
// ============================================================================

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

  return {
    isMobile: screen === "mobile",
    isTablet: screen === "tablet",
    screen,
  };
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

const STATUS_CONFIG: Record<ServiceStatus, { color: string; bg: string; border: string; label: string }> = {
  OK: { color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", label: "Opérationnel" },
  DELAYED: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", label: "Ralenti" },
  DOWN: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", label: "Indisponible" },
  UNKNOWN: { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", label: "Inconnu" },
};

const SERVICE_INFO = {
  stripe: { name: "Paiements", icon: CreditCard, description: "Traitement des paiements et abonnements" },
  email: { name: "Emails", icon: Mail, description: "Envoi des notifications et emails de signature" },
  storage: { name: "Stockage", icon: HardDrive, description: "Stockage des documents et fichiers" },
  lookup: { name: "Recherche véhicule", icon: Search, description: "Recherche automatique des données véhicule" },
};

export default function IncidentsPage() {
  const [status, setStatus] = useState<IncidentsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetcher<IncidentsStatus>("/api/incidents/status");
      setStatus(res);
    } catch (err) {
      console.error("Failed to load status:", err);
      setError("Impossible de charger le statut des services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const formatLastCheck = (isoDate: string | null): string => {
    if (!isoDate) return "Jamais";
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;

      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `Il y a ${diffHours}h`;

      const diffDays = Math.round(diffHours / 24);
      return `Il y a ${diffDays}j`;
    } catch {
      return "Date inconnue";
    }
  };

  const getStatusIcon = (s: ServiceStatus) => {
    switch (s) {
      case "OK": return <CheckCircle size={20} />;
      case "DELAYED": return <Clock size={20} />;
      case "DOWN": return <XCircle size={20} />;
      default: return <AlertTriangle size={20} />;
    }
  };

  // Responsive
  const { isMobile, isTablet } = useResponsive();
  const padding = isMobile ? "16px" : isTablet ? "24px" : "32px";
  const gridCols = isMobile ? "1fr" : "repeat(2, 1fr)";

  return (
    <div style={{ padding, maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "flex-start",
        marginBottom: isMobile ? "24px" : "32px",
        gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: isMobile ? "40px" : "48px",
            height: isMobile ? "40px" : "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Activity size={isMobile ? 20 : 24} color="#fff" />
          </div>
          <div>
            <h1 style={{
              fontSize: isMobile ? "20px" : "28px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}>
              État des services
            </h1>
            <p style={{
              fontSize: isMobile ? "13px" : "15px",
              color: "#6B7280",
              margin: "4px 0 0",
            }}>
              Statut en temps réel des services SafeMotor
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadStatus()}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            background: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Actualiser
        </button>
      </div>

      {/* Loading State */}
      {loading && !status && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 0",
        }}>
          <Loader2 size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          padding: "48px",
          textAlign: "center",
        }}>
          <AlertTriangle size={32} color="#F59E0B" style={{ marginBottom: "16px" }} />
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>{error}</p>
          <button
            type="button"
            onClick={() => void loadStatus()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Main Content */}
      {status && (
        <>
          {/* Overall Status */}
          <div style={{
            marginBottom: "24px",
          }}>
            {(() => {
              const cfg = STATUS_CONFIG[status.overall];
              const overallMessage = status.overall === "OK"
                ? "Tous les systèmes sont opérationnels"
                : status.overall === "DELAYED"
                ? "Certains services peuvent être ralentis"
                : status.overall === "DOWN"
                ? "Des incidents sont en cours"
                : "Pas assez de données encore";

              return (
                <div style={{
                  padding: "24px",
                  borderRadius: "16px",
                  background: cfg.bg,
                  border: `2px solid ${cfg.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: cfg.color,
                    }}>
                      {getStatusIcon(status.overall)}
                    </div>
                    <div>
                      <h2 style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: cfg.color,
                        margin: 0,
                      }}>
                        {overallMessage}
                      </h2>
                      <p style={{
                        fontSize: "14px",
                        color: "#6B7280",
                        margin: "4px 0 0",
                      }}>
                        Dernière mise à jour : {formatLastCheck(status.lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Services Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: "16px",
            marginBottom: isMobile ? "24px" : "32px",
          }}>
            {(Object.entries(status.services) as [keyof typeof SERVICE_INFO, ServiceInfo][]).map(([key, service]) => {
              const info = SERVICE_INFO[key];
              const cfg = STATUS_CONFIG[service.status];
              const Icon = info.icon;

              return (
                <div
                  key={key}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    border: "1px solid #E5E7EB",
                    padding: "20px",
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "#F3F4F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Icon size={20} color="#6B7280" />
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#111827",
                          margin: 0,
                        }}>
                          {info.name}
                        </h3>
                        <p style={{
                          fontSize: "12px",
                          color: "#9CA3AF",
                          margin: "2px 0 0",
                        }}>
                          {info.description}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: cfg.bg,
                      color: cfg.color,
                    }}>
                      {getStatusIcon(service.status)}
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #F3F4F6",
                  }}>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>
                      {service.message}
                    </span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                      {formatLastCheck(service.lastCheck)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help Section */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <MessageSquare size={22} color="#3B82F6" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                }}>
                  Besoin d'aide ?
                </h3>
                <p style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  margin: "8px 0 16px",
                }}>
                  Si vous rencontrez un problème avec l'un de nos services, n'hésitez pas à contacter notre support.
                  Nous ferons notre maximum pour vous aider rapidement.
                </p>
                <a
                  href="/support"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#fff",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  Contacter le support
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
