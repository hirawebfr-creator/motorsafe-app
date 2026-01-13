"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Car,
  Wrench,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
  Loader2,
  RefreshCw,
  Shield,
  Crown,
  Star,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type AdminStats = {
  totals: {
    garages: number;
    activeGarages: number;
    pendingGarages: number;
    rejectedGarages: number;
    users: number;
    clients: number;
    vehicles: number;
    interventions: number;
    quotes: number;
    invoices: number;
  };
  thisWeek: {
    newGarages: number;
    newClients: number;
    newVehicles: number;
    newInterventions: number;
    newQuotes: number;
    newInvoices: number;
  };
  today: {
    newGarages: number;
  };
  thisMonth: {
    newGarages: number;
  };
  finances: {
    totalRevenue: number;
    pendingRevenue: number;
    paidInvoices: number;
    unpaidInvoices: number;
  };
  plans: {
    FREE: number;
    STARTER: number;
    PRO: number;
  };
  topGarages: Array<{
    id: number;
    name: string;
    email: string;
    plan: string;
    createdAt: string;
    stats: {
      clients: number;
      vehicles: number;
      interventions: number;
      quotes: number;
      invoices: number;
    };
  }>;
  recentGarages: Array<{
    id: number;
    name: string;
    email: string;
    status: string;
    plan: string;
    createdAt: string;
    usersCount: number;
  }>;
};

function fmtDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function fmtEur(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  ACTIVE: { bg: "bg-green-100", text: "text-green-700" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700" },
};

const PLAN_COLORS: Record<string, { bg: string; text: string; icon: typeof Star }> = {
  FREE: { bg: "bg-gray-100", text: "text-gray-700", icon: Shield },
  STARTER: { bg: "bg-blue-100", text: "text-blue-700", icon: Star },
  PRO: { bg: "bg-purple-100", text: "text-purple-700", icon: Crown },
};

export default function AdminDashboardPage() {
  const user = useUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<AdminStats>("/api/admin/stats", { noStore: true });
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadStats();
    }
  }, [isAdmin, loadStats]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h2 className="mb-2 text-xl font-bold">Accès refusé</h2>
          <p className="text-muted2">Cette page est réservée aux administrateurs.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Dashboard Admin" description="Vue globale de la plateforme" />
        <Card className="border-red-200 bg-red-50 p-6 text-red-700">
          {error || "Erreur de chargement"}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Dashboard Admin"
        description="Vue globale de toute la plateforme SafeMotor"
        action={
          <Button variant="ghost" onClick={() => void loadStats()}>
            <RefreshCw size={16} />
            Rafraîchir
          </Button>
        }
      />

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totals.garages}</p>
              <p className="text-xs text-muted2">Garages</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totals.users}</p>
              <p className="text-xs text-muted2">Utilisateurs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totals.clients}</p>
              <p className="text-xs text-muted2">Clients</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totals.vehicles}</p>
              <p className="text-xs text-muted2">Véhicules</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Wrench className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totals.interventions}</p>
              <p className="text-xs text-muted2">Interventions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totals.invoices}</p>
              <p className="text-xs text-muted2">Factures</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Garages */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5 text-indigo-500" />
            Statut des Garages
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Actifs</span>
              </div>
              <span className="font-bold text-green-600">{stats.totals.activeGarages}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>En attente</span>
              </div>
              <span className="font-bold text-yellow-600">{stats.totals.pendingGarages}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Refusés</span>
              </div>
              <span className="font-bold text-red-600">{stats.totals.rejectedGarages}</span>
            </div>
          </div>
          {stats.totals.pendingGarages > 0 && (
            <Link
              href="/admin/pro-demandes"
              className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
            >
              Voir les demandes en attente →
            </Link>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Crown className="h-5 w-5 text-purple-500" />
            Distribution des Plans
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span>FREE</span>
              </div>
              <span className="font-bold">{stats.plans.FREE}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-500" />
                <span>STARTER</span>
              </div>
              <span className="font-bold text-blue-600">{stats.plans.STARTER}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <span>PRO</span>
              </div>
              <span className="font-bold text-purple-600">{stats.plans.PRO}</span>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
            {(() => {
              const total = stats.plans.FREE + stats.plans.STARTER + stats.plans.PRO;
              if (total === 0) return null;
              const freePct = (stats.plans.FREE / total) * 100;
              const starterPct = (stats.plans.STARTER / total) * 100;
              const proPct = (stats.plans.PRO / total) * 100;
              return (
                <div className="flex h-full">
                  <div className="bg-gray-400" style={{ width: `${freePct}%` }} />
                  <div className="bg-blue-500" style={{ width: `${starterPct}%` }} />
                  <div className="bg-purple-500" style={{ width: `${proPct}%` }} />
                </div>
              );
            })()}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Finances Globales
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted2">CA Total (payé)</span>
              <span className="font-bold text-emerald-600">{fmtEur(stats.finances.totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted2">En attente</span>
              <span className="font-bold text-yellow-600">{fmtEur(stats.finances.pendingRevenue)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted2">Factures payées</span>
              <span className="text-green-600">{stats.finances.paidInvoices}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted2">Factures en cours</span>
              <span className="text-yellow-600">{stats.finances.unpaidInvoices}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Activité cette semaine */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          Activité cette semaine
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg bg-surface2 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">+{stats.thisWeek.newGarages}</p>
            <p className="text-xs text-muted2">Garages</p>
          </div>
          <div className="rounded-lg bg-surface2 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">+{stats.thisWeek.newClients}</p>
            <p className="text-xs text-muted2">Clients</p>
          </div>
          <div className="rounded-lg bg-surface2 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">+{stats.thisWeek.newVehicles}</p>
            <p className="text-xs text-muted2">Véhicules</p>
          </div>
          <div className="rounded-lg bg-surface2 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">+{stats.thisWeek.newInterventions}</p>
            <p className="text-xs text-muted2">Interventions</p>
          </div>
          <div className="rounded-lg bg-surface2 p-4 text-center">
            <p className="text-2xl font-bold text-cyan-600">+{stats.thisWeek.newQuotes}</p>
            <p className="text-xs text-muted2">Devis</p>
          </div>
          <div className="rounded-lg bg-surface2 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">+{stats.thisWeek.newInvoices}</p>
            <p className="text-xs text-muted2">Factures</p>
          </div>
        </div>
      </Card>

      {/* Top Garages & Récents */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-surface2 px-5 py-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Top Garages (par interventions)
            </h3>
          </div>
          <div className="divide-y divide-border">
            {stats.topGarages.slice(0, 5).map((garage, idx) => {
              const planCfg = PLAN_COLORS[garage.plan] || PLAN_COLORS.FREE;
              const PlanIcon = planCfg.icon;
              return (
                <div key={garage.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{garage.name}</p>
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${planCfg.bg} ${planCfg.text}`}>
                        <PlanIcon className="h-3 w-3" />
                        {garage.plan}
                      </span>
                    </div>
                    <p className="text-xs text-muted2">{garage.email}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{garage.stats.interventions}</p>
                    <p className="text-xs text-muted2">interventions</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border bg-surface2 px-5 py-3">
            <Link href="/admin/garages" className="text-sm text-indigo-600 hover:underline">
              Voir tous les garages →
            </Link>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-surface2 px-5 py-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Clock className="h-5 w-5 text-orange-500" />
              Dernières inscriptions
            </h3>
          </div>
          <div className="divide-y divide-border">
            {stats.recentGarages.slice(0, 5).map((garage) => {
              const statusCfg = STATUS_COLORS[garage.status] || STATUS_COLORS.PENDING;
              return (
                <div key={garage.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{garage.name}</p>
                      <span className={`rounded px-1.5 py-0.5 text-xs ${statusCfg.bg} ${statusCfg.text}`}>
                        {garage.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted2">{fmtDate(garage.createdAt)}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{garage.usersCount}</p>
                    <p className="text-xs text-muted2">users</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border bg-surface2 px-5 py-3">
            <Link href="/admin" className="text-sm text-indigo-600 hover:underline">
              Voir demandes en attente →
            </Link>
          </div>
        </Card>
      </div>

      {/* Navigation rapide */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Navigation Admin</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface2"
          >
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="font-medium">Demandes Pro</p>
              <p className="text-xs text-muted2">{stats.totals.pendingGarages} en attente</p>
            </div>
          </Link>
          <Link
            href="/admin/garages"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface2"
          >
            <Building2 className="h-6 w-6 text-indigo-500" />
            <div>
              <p className="font-medium">Tous les Garages</p>
              <p className="text-xs text-muted2">{stats.totals.garages} total</p>
            </div>
          </Link>
          <Link
            href="/admin/clients"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface2"
          >
            <Users className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-medium">Tous les Clients</p>
              <p className="text-xs text-muted2">{stats.totals.clients} total</p>
            </div>
          </Link>
          <Link
            href="/admin/references"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface2"
          >
            <FileText className="h-6 w-6 text-purple-500" />
            <div>
              <p className="font-medium">Références légales</p>
              <p className="text-xs text-muted2">Gérer les références</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
