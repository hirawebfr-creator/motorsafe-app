import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";

import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import Skeleton from "@/components/common/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export const runtime = "nodejs";


export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");

  const baseWhere = user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 };
  const weekSince = new Date();
  weekSince.setDate(weekSince.getDate() - 7);
  const todaySince = new Date();
  todaySince.setHours(0, 0, 0, 0);

  // Simulate loading for skeletons (replace with real loading state if needed)
  const loading = false;

  const [clientsCount, vehiclesCount, interventionsCount, interventionsWeek, interventionsToday] =
    await Promise.all([
    prisma.client.count({ where: baseWhere }),
    prisma.vehicle.count({ where: baseWhere }),
    prisma.intervention.count({ where: baseWhere }),
    prisma.intervention.count({ where: { ...baseWhere, createdAt: { gte: weekSince } } }),
    prisma.intervention.count({ where: { ...baseWhere, createdAt: { gte: todaySince } } }),
  ]);

  const [recentClients, recentInterventions] = await Promise.all([
    prisma.client.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.intervention.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { vehicle: { include: { client: true } } },
    }),
  ]);

  // Helper for relative date
  const getRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Pilotage temps réel</p>
        <h1 className="text-3xl font-semibold">Dashboard premium</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Vision globale des clients, véhicules et interventions avec un suivi pro en temps réel.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : (
          <>
            <Tooltip content="Nombre total de clients actifs">
              <StatCard label="Clients actifs" value={clientsCount} />
            </Tooltip>
            <Tooltip content="Nombre de véhicules suivis">
              <StatCard label="Véhicules suivis" value={vehiclesCount} />
            </Tooltip>
            <Tooltip content="Nombre total d'interventions">
              <StatCard label="Interventions totales" value={interventionsCount} />
            </Tooltip>
            <Tooltip content="Interventions aujourd'hui et sur 7 jours">
              <StatCard label="Aujourd'hui" value={interventionsToday} badge={`7j: ${interventionsWeek}`} />
            </Tooltip>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Derniers dossiers</p>
              <h2 className="mt-2 text-xl font-semibold">Nouveaux clients</h2>
            </div>
            <Tooltip content="Nombre de nouveaux clients récemment ajoutés">
              <span className="badge badge-accent">{recentClients.length}</span>
            </Tooltip>
          </div>
          <div className="mt-4 grid gap-3 animate-fade-in">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : recentClients.length === 0 ? (
              <EmptyState title="Aucun client enregistré" description="Aucun client n'a été ajouté récemment." />
            ) : (
              recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 transition-all animate-fade-in"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-[var(--muted)]">ID #{client.id}</p>
                  </div>
                  <span className="text-xs text-[var(--muted)]" title={new Date(client.createdAt).toLocaleString("fr-FR")}>{getRelativeDate(client.createdAt)}</span>
                </div>
              ))
            )}
          </div>
          {/* Floating add button */}
          <a href="/clients" className="absolute bottom-6 right-6 bg-[var(--accent)] text-white rounded-full p-3 shadow-lg hover:scale-105 transition" title="Ajouter un client">
            <Plus size={20} />
          </a>
        </div>

        <div className="card p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Dernières interventions</p>
              <h2 className="mt-2 text-xl font-semibold">Trafic atelier</h2>
            </div>
            <Tooltip content="Nombre d'interventions récentes">
              <span className="badge badge-accent">{recentInterventions.length}</span>
            </Tooltip>
          </div>
          <div className="mt-4 grid gap-3 animate-fade-in">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : recentInterventions.length === 0 ? (
              <EmptyState title="Aucune intervention récente" description="Aucune intervention n'a été ajoutée récemment." />
            ) : (
              recentInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 transition-all animate-fade-in"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {intervention.vehicle.plate} - {intervention.type}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--muted)]" title={new Date(intervention.createdAt).toLocaleString("fr-FR")}>{getRelativeDate(intervention.createdAt)}</span>
                </div>
              ))
            )}
          </div>
          {/* Floating add button */}
          <a href="/interventions" className="absolute bottom-6 right-6 bg-[var(--accent)] text-white rounded-full p-3 shadow-lg hover:scale-105 transition" title="Ajouter une intervention">
            <Plus size={20} />
          </a>
        </div>
      </div>
    </div>
  );
}
