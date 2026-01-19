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

// ============================================
// Types
// ============================================

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

// ============================================
// Constants
// ============================================

const STATUS_CONFIG: Record<ServiceStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  OK: { 
    color: "text-green-600", 
    bg: "bg-green-100", 
    icon: <CheckCircle size={20} />,
    label: "Opérationnel",
  },
  DELAYED: { 
    color: "text-yellow-600", 
    bg: "bg-yellow-100", 
    icon: <Clock size={20} />,
    label: "Ralenti",
  },
  DOWN: { 
    color: "text-red-600", 
    bg: "bg-red-100", 
    icon: <XCircle size={20} />,
    label: "Indisponible",
  },
  UNKNOWN: { 
    color: "text-gray-500", 
    bg: "bg-gray-100", 
    icon: <AlertTriangle size={20} />,
    label: "Inconnu",
  },
};

const SERVICE_INFO = {
  stripe: { name: "Paiements", icon: CreditCard, description: "Traitement des paiements et abonnements" },
  email: { name: "Emails", icon: Mail, description: "Envoi des notifications et emails de signature" },
  storage: { name: "Stockage", icon: HardDrive, description: "Stockage des documents et fichiers" },
  lookup: { name: "Recherche véhicule", icon: Search, description: "Recherche automatique des données véhicule" },
};

// ============================================
// Component
// ============================================

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

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div className="flex items-center gap-3">
          <Activity size={28} className="text-[var(--ms-primary)]" />
          <div>
            <h1 className="ms-page-title">État des services</h1>
            <p className="ms-page-subtitle">Statut en temps réel des services SafeMotor</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadStatus()}
          disabled={loading}
          className="ms-btn ms-btn-secondary"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {loading && !status ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
        </div>
      ) : error ? (
        <div className="ms-card">
          <div className="ms-card-body text-center py-8">
            <AlertTriangle size={32} className="mx-auto mb-4 text-yellow-500" />
            <p className="text-[var(--ms-text-muted)]">{error}</p>
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="ms-btn ms-btn-primary mt-4"
            >
              Réessayer
            </button>
          </div>
        </div>
      ) : status ? (
        <>
          {/* Overall Status */}
          <div className="mb-6">
            {(() => {
              const cfg = STATUS_CONFIG[status.overall];
              return (
                <div className={`rounded-xl border-2 p-6 ${
                  status.overall === "OK" ? "border-green-200 bg-green-50" :
                  status.overall === "DELAYED" ? "border-yellow-200 bg-yellow-50" :
                  status.overall === "DOWN" ? "border-red-200 bg-red-50" :
                  "border-gray-200 bg-gray-50"
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${cfg.color}`}>
                        {status.overall === "OK" ? "Tous les systèmes sont opérationnels" :
                         status.overall === "DELAYED" ? "Certains services peuvent être ralentis" :
                         status.overall === "DOWN" ? "Des incidents sont en cours" :
                         "Pas assez de données encore"}
                      </h2>
                      <p className="text-sm text-[var(--ms-text-muted)]">
                        Dernière mise à jour: {formatLastCheck(status.lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Services Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.entries(status.services) as [keyof typeof SERVICE_INFO, ServiceInfo][]).map(([key, service]) => {
              const info = SERVICE_INFO[key];
              const cfg = STATUS_CONFIG[service.status];
              const Icon = info.icon;
              
              return (
                <div key={key} className="ms-card">
                  <div className="ms-card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ms-bg)]">
                          <Icon size={20} className="text-[var(--ms-text-muted)]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--ms-text)]">{info.name}</h3>
                          <p className="text-xs text-[var(--ms-text-muted)]">{info.description}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-[var(--ms-text-muted)]">{service.message}</span>
                      <span className="text-xs text-[var(--ms-text-muted)]">
                        {formatLastCheck(service.lastCheck)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="mt-8 ms-card">
            <div className="ms-card-body">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ms-text)]">Besoin d'aide ?</h3>
                  <p className="mt-1 text-sm text-[var(--ms-text-muted)]">
                    Si vous rencontrez un problème avec l'un de nos services, n'hésitez pas à contacter notre support.
                    Nous ferons notre maximum pour vous aider rapidement.
                  </p>
                  <a href="/support" className="ms-btn ms-btn-primary mt-4">
                    Contacter le support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
