"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Car,
  ChevronRight,
  Euro,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useUser } from "@/components/user-context";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  BarChart,
  DonutChart,
  DashboardCard,
  ActivityItem,
} from "@/components/dashboard";

type KpisResponse = {
  clientsCount: number;
  vehiclesCount: number;
  interventionsCount: number;
  revenueTotalCents: number;
  clientsVariation: number;
  vehiclesVariation: number;
  interventionsVariation: number;
  revenueVariation: number;
};

type GarageOption = { id: number; name: string; status: "PENDING" | "ACTIVE" | "REJECTED" };

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

function formatEUR(cents: number) {
  const amount = cents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const user = useUser();
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
  const [garages, setGarages] = useState<GarageOption[]>([]);
  const [selectedGarageId, setSelectedGarageId] = useState<string>("");

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("from", fromISO);
    sp.set("to", toISO);
    if (user.role === "ADMIN" && selectedGarageId) {
      sp.set("garageId", selectedGarageId);
    }
    return sp.toString();
  }, [fromISO, toISO, selectedGarageId, user.role]);

  useEffect(() => {
    if (user.role !== "ADMIN") return;
    const loadGarages = async () => {
      try {
        const data = await fetcher<GarageOption[]>("/api/admin/garages?status=active", { noStore: true });
        const items = data ?? [];
        setGarages(items);
        if (!selectedGarageId && items.length > 0) {
          setSelectedGarageId(String(items[0].id));
        }
        if (items.length === 0) {
          setLoading(false);
          setRefreshing(false);
        }
      } catch (e) {
        console.error("Dashboard garages load error:", e);
        setGarages([]);
        setLoading(false);
        setRefreshing(false);
      }
    };
    void loadGarages();
  }, [selectedGarageId, user.role]);

  const loadAll = useCallback(async (isRefresh = false) => {
    try {
      if (user.role === "ADMIN" && !selectedGarageId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
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
  }, [queryString, selectedGarageId, user.role]);

  useEffect(() => {
    if (user.role === "ADMIN" && !selectedGarageId) return;
    void loadAll();
  }, [loadAll, selectedGarageId, user.role]);

  // Chart data
  const chart = useMemo(() => {
    const labels = reports?.labels ?? [];
    const values = reports?.values ?? [];
    return { labels, values };
  }, [reports]);

  // Analytics donut data
  const donutData = useMemo(() => {
    const done = analytics?.done ?? 0;
    const inProgress = analytics?.inProgress ?? 0;
    const cancelled = analytics?.cancelled ?? 0;
    return [
      { label: "Terminé", value: done, color: "var(--ms-success)" },
      { label: "En cours", value: inProgress, color: "var(--ms-warning)" },
      { label: "Annulé", value: cancelled, color: "var(--ms-error)" },
    ];
  }, [analytics]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Vue d'ensemble de votre activité"
        action={
          <div className="flex items-center gap-3">
            {user.role === "ADMIN" && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--ms-border)] bg-white px-3 py-2 shadow-sm">
                <span className="text-sm font-medium text-[var(--ms-text-muted)]">Garage</span>
                <select
                  value={selectedGarageId}
                  onChange={(e) => setSelectedGarageId(e.target.value)}
                  className="border-none bg-transparent text-sm font-medium text-[var(--ms-text)] outline-none"
                >
                  {garages.length === 0 ? (
                    <option value="">Aucun garage</option>
                  ) : (
                    garages.map((garage) => (
                      <option key={garage.id} value={garage.id}>
                        {garage.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-[var(--ms-border)] bg-white px-3 py-2 shadow-sm">
              <Calendar size={16} className="text-[var(--ms-text-muted)]" />
              <input
                type="date"
                value={fromISO}
                onChange={(e) => setFromISO(e.target.value)}
                className="border-none bg-transparent text-sm font-medium text-[var(--ms-text)] outline-none"
              />
              <span className="text-[var(--ms-text-muted)]">→</span>
              <input
                type="date"
                value={toISO}
                onChange={(e) => setToISO(e.target.value)}
                className="border-none bg-transparent text-sm font-medium text-[var(--ms-text)] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadAll(true)}
              disabled={refreshing || (user.role === "ADMIN" && !selectedGarageId)}
              className="ms-btn ms-btn-secondary"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div 
        className="mb-8"
        style={{ 
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' 
        }}
      >
        <KpiCard
          title="Clients"
          value={loading ? "—" : kpis?.clientsCount ?? 0}
          variation={kpis?.clientsVariation}
          icon={Users}
        />
        <KpiCard
          title="Véhicules"
          value={loading ? "—" : kpis?.vehiclesCount ?? 0}
          variation={kpis?.vehiclesVariation}
          icon={Car}
        />
        <KpiCard
          title="Interventions"
          value={loading ? "—" : kpis?.interventionsCount ?? 0}
          variation={kpis?.interventionsVariation}
          icon={Wrench}
        />
        <KpiCard
          title="Chiffre d'affaires"
          value={loading ? "—" : formatEUR(kpis?.revenueTotalCents ?? 0)}
          variation={kpis?.revenueVariation}
          icon={Euro}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Reports Chart */}
        <DashboardCard
          title="Rapports"
          subtitle="Évolution des interventions"
          className="lg:col-span-3"
        >
          <BarChart
            labels={chart.labels}
            values={chart.values}
            loading={loading}
            emptyMessage="Aucune donnée pour cette période"
          />
        </DashboardCard>

        {/* Analytics Donut */}
        <DashboardCard
          title="Analytics"
          subtitle="Répartition des interventions"
          className="lg:col-span-2"
        >
          <DonutChart data={donutData} loading={loading} />
        </DashboardCard>
      </div>

      {/* Recent Items Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Interventions */}
        <DashboardCard
          title="Interventions récentes"
          subtitle="Dernières interventions créées"
          headerAction={{ href: "/interventions", label: "Voir tout" }}
          noPadding
        >
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-[var(--ms-bg)]" />
              ))}
            </div>
          ) : recentInterventions.length === 0 ? (
            <div className="py-8 text-center text-[var(--ms-text-muted)]">
              Aucune intervention récente
            </div>
          ) : (
            <div className="divide-y divide-[var(--ms-border)]">
              {recentInterventions.map((item) => (
                <ActivityItem
                  key={item.id}
                  icon={Wrench}
                  iconGradient="from-[var(--ms-primary)] to-[#8B5CF6]"
                  title={item.ref}
                  subtitle={item.vehicleLabel}
                  href={`/interventions/${item.id}`}
                  rightContent={
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        status={item.status === "OPEN" ? "info" : item.status === "DONE" ? "success" : item.status === "CANCELED" ? "error" : "warning"}
                        label={item.status === "OPEN" ? "En cours" : item.status === "DONE" ? "Terminé" : item.status === "CANCELED" ? "Annulé" : "Brouillon"}
                      />
                      <span className="font-semibold text-[var(--ms-text)]">
                        {formatEUR(item.totalCents)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[var(--ms-text-muted)]" />
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </DashboardCard>

        {/* Recent Vehicles */}
        <DashboardCard
          title="Véhicules récents"
          subtitle="Derniers véhicules ajoutés"
          headerAction={{ href: "/vehicules", label: "Voir tout" }}
          noPadding
        >
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-[var(--ms-bg)]" />
              ))}
            </div>
          ) : recentVehicles.length === 0 ? (
            <div className="py-8 text-center text-[var(--ms-text-muted)]">
              Aucun véhicule récent
            </div>
          ) : (
            <div className="divide-y divide-[var(--ms-border)]">
              {recentVehicles.map((item) => (
                <ActivityItem
                  key={item.id}
                  icon={Car}
                  iconGradient="from-[#F59E0B] to-[#EAB308]"
                  title={item.label}
                  subtitle={item.plate}
                  href={`/vehicules/${item.id}`}
                  rightContent={
                    <div className="flex items-center gap-3">
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
                      <ChevronRight className="h-4 w-4 text-[var(--ms-text-muted)]" />
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
