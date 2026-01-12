"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Car,
  ChevronRight,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";

type KpisResponse = {
  clientsCount: number;
  vehiclesCount: number;
  interventionsCount: number;
  revenueTotalCents: number;
};

type ReportsResponse = { labels: string[]; values: number[] };
type AnalyticsResponse = { done: number; inProgress: number; cancelled: number };

type RecentIntervention = {
  id: string;
  ref: string;
  vehicleLabel: string;
  priceCents: number;
  totalCents: number;
  status: "DRAFT" | "OPEN" | "DONE" | "CANCELED";
};

type RecentVehicle = {
  id: string;
  label: string;
  plate: string;
  rating: number;
  priceCents: number;
  imageUrl: string | null;
};

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  DRAFT: {
    bg: "var(--ms-warning-light)",
    text: "var(--ms-warning)",
    label: "Brouillon",
  },
  OPEN: {
    bg: "var(--ms-info-light)",
    text: "var(--ms-info)",
    label: "En cours",
  },
  DONE: {
    bg: "var(--ms-success-light)",
    text: "var(--ms-success)",
    label: "Terminé",
  },
  CANCELED: {
    bg: "var(--ms-error-light)",
    text: "var(--ms-error)",
    label: "Annulé",
  },
};

function formatEUR(cents: number) {
  const amount = cents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultFromISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [fromISO, setFromISO] = useState(defaultFromISO);
  const [toISO, setToISO] = useState(todayISO);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [kpis, setKpis] = useState<KpisResponse | null>(null);
  const [reports, setReports] = useState<ReportsResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [recentInterventions, setRecentInterventions] = useState<RecentIntervention[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<RecentVehicle[]>([]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("from", fromISO);
    sp.set("to", toISO);
    return sp.toString();
  }, [fromISO, toISO]);

  const loadAll = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [k, r, a, ri, rv] = await Promise.all([
        fetcher<KpisResponse>(`/api/dashboard/kpis?${queryString}`, { noStore: true }),
        fetcher<ReportsResponse>(`/api/dashboard/reports?${queryString}`, { noStore: true }),
        fetcher<AnalyticsResponse>(`/api/dashboard/analytics?${queryString}`, { noStore: true }),
        fetcher<RecentIntervention[]>(`/api/dashboard/recent-interventions?${queryString}&limit=5`, { noStore: true }),
        fetcher<RecentVehicle[]>(`/api/dashboard/recent-vehicles?${queryString}&limit=4`, { noStore: true }),
      ]);
      setKpis(k);
      setReports(r);
      setAnalytics(a);
      setRecentInterventions(ri ?? []);
      setRecentVehicles(rv ?? []);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Chart data
  const chart = useMemo(() => {
    const labels = reports?.labels ?? [];
    const values = reports?.values ?? [];
    const max = Math.max(1, ...values);
    return { labels, values, max };
  }, [reports]);

  // Analytics donut
  const donut = useMemo(() => {
    const done = analytics?.done ?? 0;
    const inProgress = analytics?.inProgress ?? 0;
    const cancelled = analytics?.cancelled ?? 0;
    const total = done + inProgress + cancelled;
    const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
    const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const cancelledPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    return { done, inProgress, cancelled, total, donePct, inProgressPct, cancelledPct };
  }, [analytics]);

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Dashboard</h1>
          <p className="ms-page-subtitle">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--ms-border)] bg-white px-3 py-2">
            <Calendar size={16} className="text-[var(--ms-text-muted)]" />
            <input
              type="date"
              value={fromISO}
              onChange={(e) => setFromISO(e.target.value)}
              className="border-none bg-transparent text-sm text-[var(--ms-text)] outline-none"
            />
            <span className="text-[var(--ms-text-muted)]">→</span>
            <input
              type="date"
              value={toISO}
              onChange={(e) => setToISO(e.target.value)}
              className="border-none bg-transparent text-sm text-[var(--ms-text)] outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadAll(true)}
            disabled={refreshing}
            className="ms-btn ms-btn-secondary"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ms-stat-card ms-animate-slide-up ms-delay-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Clients</div>
              <div className="ms-stat-value">
                {loading ? "—" : kpis?.clientsCount ?? 0}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]">
              <Users size={24} className="text-white" />
            </div>
          </div>
          <Link
            href="/clients"
            className="mt-3 flex items-center gap-1 text-sm text-[var(--ms-primary)] hover:underline"
          >
            Voir tous
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="ms-stat-card ms-animate-slide-up ms-delay-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Véhicules</div>
              <div className="ms-stat-value">
                {loading ? "—" : kpis?.vehiclesCount ?? 0}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EAB308]">
              <Car size={24} className="text-white" />
            </div>
          </div>
          <Link
            href="/vehicules"
            className="mt-3 flex items-center gap-1 text-sm text-[var(--ms-primary)] hover:underline"
          >
            Voir tous
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="ms-stat-card ms-animate-slide-up ms-delay-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Interventions</div>
              <div className="ms-stat-value">
                {loading ? "—" : kpis?.interventionsCount ?? 0}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F97316] to-[#FB923C]">
              <Wrench size={24} className="text-white" />
            </div>
          </div>
          <Link
            href="/interventions"
            className="mt-3 flex items-center gap-1 text-sm text-[var(--ms-primary)] hover:underline"
          >
            Voir toutes
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="ms-stat-card ms-animate-slide-up ms-delay-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Chiffre d'affaires</div>
              <div className="ms-stat-value">
                {loading ? "—" : formatEUR(kpis?.revenueTotalCents ?? 0)}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981] to-[#34D399]">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
          <div className="ms-stat-trend ms-stat-trend-up mt-3">
            <TrendingUp size={14} />
            Sur la période sélectionnée
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Reports Chart */}
        <div className="ms-card lg:col-span-3">
          <div className="ms-card-header">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ms-text)]">Rapports</h2>
              <p className="text-sm text-[var(--ms-text-muted)]">Évolution des interventions</p>
            </div>
          </div>
          <div className="ms-card-body">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="ms-skeleton h-48 w-full" />
              </div>
            ) : chart.values.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-[var(--ms-text-muted)]">
                Aucune donnée pour cette période
              </div>
            ) : (
              <div className="relative h-64">
                {/* Simple bar chart */}
                <div className="flex h-full items-end justify-between gap-2">
                  {chart.values.map((v, idx) => {
                    const pct = (v / chart.max) * 100;
                    return (
                      <div
                        key={`${idx}-${chart.labels[idx]}`}
                        className="group relative flex flex-1 flex-col items-center"
                      >
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-[var(--ms-primary)] to-[#8B5CF6] transition-all duration-300 hover:opacity-80"
                          style={{ height: `${Math.max(4, pct)}%` }}
                        />
                        <span className="mt-2 text-xs text-[var(--ms-text-muted)]">
                          {chart.labels[idx]}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-md bg-[var(--ms-text)] px-2 py-1 text-xs text-white group-hover:block">
                          {v}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Donut */}
        <div className="ms-card lg:col-span-2">
          <div className="ms-card-header">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ms-text)]">Analytics</h2>
              <p className="text-sm text-[var(--ms-text-muted)]">Répartition des interventions</p>
            </div>
          </div>
          <div className="ms-card-body">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="ms-skeleton h-32 w-32 rounded-full" />
              </div>
            ) : donut.total === 0 ? (
              <div className="flex h-48 items-center justify-center text-[var(--ms-text-muted)]">
                Aucune donnée
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Donut Chart */}
                <div className="relative h-40 w-40">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="var(--ms-success)"
                      strokeWidth="4"
                      strokeDasharray={`${donut.donePct} ${100 - donut.donePct}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="var(--ms-warning)"
                      strokeWidth="4"
                      strokeDasharray={`${donut.inProgressPct} ${100 - donut.inProgressPct}`}
                      strokeDashoffset={`-${donut.donePct}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="var(--ms-error)"
                      strokeWidth="4"
                      strokeDasharray={`${donut.cancelledPct} ${100 - donut.cancelledPct}`}
                      strokeDashoffset={`-${donut.donePct + donut.inProgressPct}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--ms-text)]">{donut.total}</div>
                      <div className="text-xs text-[var(--ms-text-muted)]">Total</div>
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[var(--ms-success)]" />
                    <span className="text-sm text-[var(--ms-text-secondary)]">Terminé ({donut.done})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[var(--ms-warning)]" />
                    <span className="text-sm text-[var(--ms-text-secondary)]">En cours ({donut.inProgress})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[var(--ms-error)]" />
                    <span className="text-sm text-[var(--ms-text-secondary)]">Annulé ({donut.cancelled})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Items Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Interventions */}
        <div className="ms-card">
          <div className="ms-card-header flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ms-text)]">Interventions récentes</h2>
              <p className="text-sm text-[var(--ms-text-muted)]">Dernières interventions créées</p>
            </div>
            <Link
              href="/interventions"
              className="flex items-center gap-1 text-sm text-[var(--ms-primary)] hover:underline"
            >
              Voir tout
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="ms-card-body p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="ms-skeleton h-14 w-full" />
                ))}
              </div>
            ) : recentInterventions.length === 0 ? (
              <div className="py-8 text-center text-[var(--ms-text-muted)]">
                Aucune intervention récente
              </div>
            ) : (
              <div className="divide-y divide-[var(--ms-border)]">
                {recentInterventions.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.DRAFT;
                  return (
                    <Link
                      key={item.id}
                      href={`/interventions/${item.id}`}
                      className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--ms-bg)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ms-primary-light)]">
                          <Wrench size={18} className="text-[var(--ms-primary)]" />
                        </div>
                        <div>
                          <div className="font-medium text-[var(--ms-text)]">{item.ref}</div>
                          <div className="text-sm text-[var(--ms-text-muted)]">{item.vehicleLabel}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className="ms-badge"
                          style={{
                            backgroundColor: cfg.bg,
                            color: cfg.text,
                          }}
                        >
                          {cfg.label}
                        </span>
                        <span className="font-semibold text-[var(--ms-text)]">
                          {formatEUR(item.totalCents)}
                        </span>
                        <ChevronRight size={16} className="text-[var(--ms-text-muted)]" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Vehicles */}
        <div className="ms-card">
          <div className="ms-card-header flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ms-text)]">Véhicules récents</h2>
              <p className="text-sm text-[var(--ms-text-muted)]">Derniers véhicules ajoutés</p>
            </div>
            <Link
              href="/vehicules"
              className="flex items-center gap-1 text-sm text-[var(--ms-primary)] hover:underline"
            >
              Voir tout
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="ms-card-body p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="ms-skeleton h-14 w-full" />
                ))}
              </div>
            ) : recentVehicles.length === 0 ? (
              <div className="py-8 text-center text-[var(--ms-text-muted)]">
                Aucun véhicule récent
              </div>
            ) : (
              <div className="divide-y divide-[var(--ms-border)]">
                {recentVehicles.map((item) => (
                  <Link
                    key={item.id}
                    href={`/vehicules/${item.id}`}
                    className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--ms-bg)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#EAB308]">
                        <Car size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-[var(--ms-text)]">{item.label}</div>
                        <div className="text-sm text-[var(--ms-text-muted)]">{item.plate}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Star rating */}
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < item.rating ? "bg-[#F59E0B]" : "bg-[var(--ms-border)]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-[var(--ms-text)]">
                        {formatEUR(item.priceCents)}
                      </span>
                      <ChevronRight size={16} className="text-[var(--ms-text-muted)]" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
