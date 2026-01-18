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
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";

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

const STATUS_COLORS: Record<string, string> = {
  ok: "bg-green-100 text-green-700",
  degraded: "bg-yellow-100 text-yellow-700",
  down: "bg-red-100 text-red-700",
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
      fetchEvents();
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

  // Count errors/warnings
  const errorCount = events.filter((e) => e.status === "down").length;
  const warningCount = events.filter((e) => e.status === "degraded").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            Erreurs système
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Suivi des erreurs et alertes récentes
          </p>
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{events.length}</div>
          <div className="text-sm text-gray-500">Événements récents</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          <div className="text-sm text-gray-500">Erreurs critiques</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          <div className="text-sm text-gray-500">Avertissements</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Filtres:</span>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5"
        >
          <option value="all">Tous les services</option>
          {services.map((svc) => (
            <option key={svc} value={svc}>
              {SERVICE_LABELS[svc] || svc}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5"
        >
          <option value="all">Tous les types</option>
          <option value="errors">Erreurs seulement</option>
          <option value="warnings">Warnings seulement</option>
        </select>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {events.length === 0
              ? "Aucun événement enregistré"
              : "Aucun événement correspondant aux filtres"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredEvents.map((event) => {
              const Icon = SERVICE_ICONS[event.service] || Server;
              const metadata = event.metadata as Record<string, unknown> | undefined;
              const sentryEventId = metadata?.sentryEventId as string | undefined;

              return (
                <div
                  key={event.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        event.status === "ok"
                          ? "bg-green-100"
                          : event.status === "degraded"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          event.status === "ok"
                            ? "text-green-600"
                            : event.status === "degraded"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {SERVICE_LABELS[event.service] || event.service}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            STATUS_COLORS[event.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {event.status === "ok"
                            ? "OK"
                            : event.status === "degraded"
                            ? "Warning"
                            : "Erreur"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {event.type}
                        </span>
                      </div>
                      {event.message && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {event.message}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(event.createdAt)}
                        </span>
                        {sentryEventId && (
                          <a
                            href={`https://sentry.io/issues/?query=event.id:${sentryEventId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3" />
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

      {/* Sentry Link */}
      <div className="text-center text-sm text-gray-500">
        <a
          href="https://sentry.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir le dashboard Sentry complet
        </a>
      </div>
    </div>
  );
}
