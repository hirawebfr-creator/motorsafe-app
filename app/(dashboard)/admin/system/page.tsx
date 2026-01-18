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
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";

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
  env: {
    nodeEnv: string;
    vercelEnv?: string;
  };
  metrics: {
    totalGarages: number;
    activeSubscriptions: number;
    pendingApprovals: number;
  };
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

const STATUS_STYLES: Record<ServiceStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  ok: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  degraded: { bg: "bg-yellow-100", text: "text-yellow-700", icon: AlertTriangle },
  down: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle },
};

function formatDate(input: string) {
  const d = new Date(input);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="w-3 h-3" />
      {status === "ok" ? "OK" : status === "degraded" ? "Dégradé" : "Down"}
    </span>
  );
}

export default function SystemStatusPage() {
  const user = useUser();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const isAdmin = user?.role === "ADMIN";

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
      fetchHealth();
      // Auto-refresh every 60 seconds
      const interval = setInterval(fetchHealth, 60000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Accès réservé aux administrateurs
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            État du système
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitoring en temps réel des services
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Mis à jour: {formatDate(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Overall Status */}
          <div className={`p-6 rounded-xl ${STATUS_STYLES[data.overall].bg}`}>
            <div className="flex items-center gap-4">
              {data.overall === "ok" ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <AlertTriangle className={`w-12 h-12 ${data.overall === "down" ? "text-red-600" : "text-yellow-600"}`} />
              )}
              <div>
                <h2 className={`text-xl font-bold ${STATUS_STYLES[data.overall].text}`}>
                  {data.overall === "ok"
                    ? "Tous les systèmes opérationnels"
                    : data.overall === "degraded"
                    ? "Fonctionnement dégradé"
                    : "Système indisponible"}
                </h2>
                <p className="text-sm opacity-75">
                  Environnement: {data.env.nodeEnv}
                  {data.env.vercelEnv && ` (${data.env.vercelEnv})`}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="text-3xl font-bold text-gray-900">
                {data.metrics.totalGarages}
              </div>
              <div className="text-sm text-gray-500">Garages total</div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {data.metrics.activeSubscriptions}
              </div>
              <div className="text-sm text-gray-500">Abonnements actifs</div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="text-3xl font-bold text-yellow-600">
                {data.metrics.pendingApprovals}
              </div>
              <div className="text-sm text-gray-500">En attente approbation</div>
            </div>
          </div>

          {/* Services Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.services.map((svc) => {
                const Icon = SERVICE_ICONS[svc.service] || Server;
                return (
                  <div
                    key={svc.service}
                    className="bg-white p-4 rounded-xl border shadow-sm flex items-start gap-4"
                  >
                    <div className={`p-2 rounded-lg ${STATUS_STYLES[svc.status].bg}`}>
                      <Icon className={`w-5 h-5 ${STATUS_STYLES[svc.status].text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {SERVICE_LABELS[svc.service] || svc.service}
                        </span>
                        <StatusBadge status={svc.status} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        {svc.latencyMs !== undefined && (
                          <div>Latence: {svc.latencyMs}ms</div>
                        )}
                        {svc.message && <div>{svc.message}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Événements récents</h3>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {data.recentEvents.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Aucun événement enregistré
                </div>
              ) : (
                <div className="divide-y">
                  {data.recentEvents.slice(0, 10).map((event) => (
                    <div key={event.id} className="px-4 py-3 flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        event.status === "ok" ? "bg-green-500" :
                        event.status === "degraded" ? "bg-yellow-500" : "bg-red-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {SERVICE_LABELS[event.service] || event.service}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.type} {event.message && `• ${event.message}`}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(event.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
