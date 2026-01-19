"use client";

import { useCallback, useEffect, useState } from "react";
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

// ============================================
// Types
// ============================================

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

// ============================================
// Constants
// ============================================

const TYPE_CONFIG: Record<ChangelogType, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  FEATURE: {
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: <Sparkles size={16} />,
    label: "Nouveauté",
  },
  FIX: {
    color: "text-orange-600",
    bg: "bg-orange-100",
    icon: <Bug size={16} />,
    label: "Correction",
  },
  SECURITY: {
    color: "text-red-600",
    bg: "bg-red-100",
    icon: <Shield size={16} />,
    label: "Sécurité",
  },
  LEGAL: {
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: <Scale size={16} />,
    label: "Légal",
  },
};

const STATUS_CONFIG: Record<ServiceStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  OK: { 
    color: "text-green-600", 
    bg: "bg-green-100", 
    icon: <CheckCircle size={16} />,
    label: "Opérationnel",
  },
  DELAYED: { 
    color: "text-yellow-600", 
    bg: "bg-yellow-100", 
    icon: <Clock size={16} />,
    label: "Ralenti",
  },
  DOWN: { 
    color: "text-red-600", 
    bg: "bg-red-100", 
    icon: <XCircle size={16} />,
    label: "Indisponible",
  },
  UNKNOWN: { 
    color: "text-gray-500", 
    bg: "bg-gray-100", 
    icon: <AlertTriangle size={16} />,
    label: "Inconnu",
  },
};

const SERVICE_INFO = {
  stripe: { name: "Paiements", icon: CreditCard },
  email: { name: "Emails", icon: Mail },
  storage: { name: "Stockage", icon: HardDrive },
  lookup: { name: "Recherche véhicule", icon: Search },
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
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const formatDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Date inconnue";
    }
  };

  const formatMaintenanceTime = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div className="flex items-center gap-3">
          <Newspaper size={28} className="text-[var(--ms-primary)]" />
          <div>
            <h1 className="ms-page-title">Nouveautés</h1>
            <p className="ms-page-subtitle">Changelog et statut de la plateforme SafeMotor</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="ms-btn ms-btn-secondary"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Maintenance Banner */}
      {maintenance?.current && (
        <div className={`mb-6 rounded-xl border-2 p-4 ${
          maintenance.current.severity === "WARNING" 
            ? "border-orange-300 bg-orange-50" 
            : "border-blue-300 bg-blue-50"
        }`}>
          <div className="flex items-start gap-3">
            <Wrench size={24} className={maintenance.current.severity === "WARNING" ? "text-orange-600" : "text-blue-600"} />
            <div className="flex-1">
              <h3 className={`font-semibold ${maintenance.current.severity === "WARNING" ? "text-orange-800" : "text-blue-800"}`}>
                Maintenance en cours : {maintenance.current.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--ms-text-muted)]">
                {maintenance.current.message}
              </p>
              <p className="mt-2 text-xs text-[var(--ms-text-muted)]">
                Fin prévue : {formatMaintenanceTime(maintenance.current.endsAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Maintenance */}
      {maintenance?.upcoming && maintenance.upcoming.length > 0 && !maintenance.current && (
        <div className="mb-6 rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <Calendar size={24} className="text-yellow-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">
                Maintenance planifiée
              </h3>
              {maintenance.upcoming.map((m) => (
                <div key={m.id} className="mt-2">
                  <p className="text-sm font-medium text-yellow-700">{m.title}</p>
                  <p className="text-xs text-[var(--ms-text-muted)]">
                    {formatMaintenanceTime(m.startsAt)} → {formatMaintenanceTime(m.endsAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Changelog Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-[var(--ms-text-muted)]" />
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  filter === opt.value
                    ? "bg-[var(--ms-primary)] text-white"
                    : "bg-[var(--ms-bg)] text-[var(--ms-text-muted)] hover:bg-[var(--ms-bg-hover)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Entries List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
            </div>
          ) : entries.length === 0 ? (
            <div className="ms-card">
              <div className="ms-card-body text-center py-12">
                <Newspaper size={48} className="mx-auto mb-4 text-[var(--ms-text-muted)] opacity-30" />
                <p className="text-[var(--ms-text-muted)]">Aucune nouveauté pour le moment</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const cfg = TYPE_CONFIG[entry.type];
                return (
                  <Link
                    key={entry.id}
                    href={`/nouveautes/${entry.id}`}
                    className="ms-card block transition-shadow hover:shadow-md"
                  >
                    <div className="ms-card-body">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                            {entry.version && (
                              <span className="text-xs text-[var(--ms-text-muted)]">
                                v{entry.version}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-[var(--ms-text)] truncate">
                            {entry.title}
                          </h3>
                          <p className="text-xs text-[var(--ms-text-muted)] mt-1">
                            {formatDate(entry.publishedAt)}
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-[var(--ms-text-muted)] flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Sidebar */}
        <div className="space-y-4">
          {/* Platform Status */}
          <div className="ms-card">
            <div className="ms-card-header">
              <h3 className="ms-card-title flex items-center gap-2">
                <Activity size={18} />
                Statut plateforme
              </h3>
            </div>
            <div className="ms-card-body pt-0">
              {status ? (
                <>
                  {/* Overall */}
                  <div className={`mb-4 rounded-lg p-3 ${
                    status.overall === "OK" ? "bg-green-50" :
                    status.overall === "DELAYED" ? "bg-yellow-50" :
                    status.overall === "DOWN" ? "bg-red-50" :
                    "bg-gray-50"
                  }`}>
                    {(() => {
                      const cfg = STATUS_CONFIG[status.overall];
                      return (
                        <div className={`flex items-center gap-2 font-medium ${cfg.color}`}>
                          {cfg.icon}
                          {status.overall === "OK" ? "Tout fonctionne" :
                           status.overall === "DELAYED" ? "Ralentissements" :
                           status.overall === "DOWN" ? "Incidents en cours" :
                           "En attente de données"}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    {(Object.entries(status.services) as [keyof typeof SERVICE_INFO, ServiceInfo][]).map(([key, service]) => {
                      const info = SERVICE_INFO[key];
                      const cfg = STATUS_CONFIG[service.status];
                      const Icon = info.icon;
                      
                      return (
                        <div key={key} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className="text-[var(--ms-text-muted)]" />
                            <span className="text-sm">{info.name}</span>
                          </div>
                          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                            {cfg.icon}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href="/incidents"
                    className="mt-4 block text-center text-sm text-[var(--ms-primary)] hover:underline"
                  >
                    Voir les détails →
                  </Link>
                </>
              ) : (
                <div className="py-4 text-center">
                  <Loader2 size={20} className="mx-auto animate-spin text-[var(--ms-text-muted)]" />
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="ms-card">
            <div className="ms-card-header">
              <h3 className="ms-card-title flex items-center gap-2">
                <Wrench size={18} />
                Maintenances
              </h3>
            </div>
            <div className="ms-card-body pt-0">
              {maintenance?.current ? (
                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-sm font-medium text-orange-700">En cours</p>
                  <p className="text-xs text-[var(--ms-text-muted)] mt-1">{maintenance.current.title}</p>
                </div>
              ) : maintenance?.upcoming && maintenance.upcoming.length > 0 ? (
                <div className="space-y-2">
                  {maintenance.upcoming.slice(0, 2).map((m) => (
                    <div key={m.id} className="rounded-lg bg-yellow-50 p-3">
                      <p className="text-sm font-medium text-yellow-700">{m.title}</p>
                      <p className="text-xs text-[var(--ms-text-muted)]">
                        {formatMaintenanceTime(m.startsAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-[var(--ms-text-muted)]">
                  Aucune maintenance prévue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
