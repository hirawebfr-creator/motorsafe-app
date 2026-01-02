import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";

import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDistance } from "date-fns/formatDistance";
import { fr } from "date-fns/locale/fr";
import Link from "next/link";

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
    return formatDistance(d, new Date(), { addSuffix: true, locale: fr });
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Dashboard"
        description="Vue d’ensemble de votre activité : clients, véhicules, interventions et documents."
        level={1}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients actifs" value={clientsCount} />
        <StatCard label="Véhicules suivis" value={vehiclesCount} />
        <StatCard label="Interventions totales" value={interventionsCount} />
        <StatCard label="Aujourd’hui" value={interventionsToday} badge={`7j: ${interventionsWeek}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-5 py-4">
            <div>
              <p className="ms-kicker">Derniers clients</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">Ajouts récents</p>
            </div>
            <Link href="/clients">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          <div className="grid gap-2 px-5 py-4">
            {recentClients.length === 0 ? (
              <EmptyState title="Aucun client" description="Créez votre premier client pour démarrer." />
            ) : (
              recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients?selected=${client.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface2)] px-4 py-3 hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-[color:var(--textMuted)]">ID #{client.id}</p>
                  </div>
                  <p className="shrink-0 text-xs text-[color:var(--textMuted)]" title={new Date(client.createdAt).toLocaleString("fr-FR")}>
                    {getRelativeDate(client.createdAt)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-5 py-4">
            <div>
              <p className="ms-kicker">Dernières interventions</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">Trafic atelier</p>
            </div>
            <Link href="/interventions">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          <div className="grid gap-2 px-5 py-4">
            {recentInterventions.length === 0 ? (
              <EmptyState title="Aucune intervention" description="Les interventions récentes apparaîtront ici." />
            ) : (
              recentInterventions.map((intervention) => (
                <Link
                  key={intervention.id}
                  href={`/interventions/${intervention.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface2)] px-4 py-3 hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {intervention.vehicle.plate} · {intervention.type}
                    </p>
                    <p className="text-xs text-[color:var(--textMuted)]">
                      {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-[color:var(--textMuted)]" title={new Date(intervention.createdAt).toLocaleString("fr-FR")}>
                    {getRelativeDate(intervention.createdAt)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
