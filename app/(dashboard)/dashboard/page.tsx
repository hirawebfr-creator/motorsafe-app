import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";

import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
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
        title="Tableau de bord"
        description="Vue d’ensemble de votre activité : clients, véhicules et interventions."
        level={1}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link href="/clients">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Nouveau client
              </Button>
            </Link>
            <Link href="/interventions">
              <Button size="sm" className="w-full sm:w-auto">
                Nouvelle intervention
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients actifs" value={clientsCount} />
        <StatCard label="Véhicules suivis" value={vehiclesCount} />
        <StatCard label="Interventions totales" value={interventionsCount} />
        <StatCard label="Aujourd’hui" value={interventionsToday} badge={`7j: ${interventionsWeek}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="ms-kicker">Derniers clients</p>
              <p className="mt-1 text-sm text-muted2">Ajouts récents</p>
            </div>
            <Link href="/clients">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          {recentClients.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="Aucun client"
                description="Créez votre premier client pour démarrer."
                action={
                  <Link href="/clients">
                    <Button size="sm">Créer un client</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <DataTable variant="plain">
              <DataTableHead>
                <tr>
                  <th>Client</th>
                  <th>Créé</th>
                </tr>
              </DataTableHead>
              <tbody>
                {recentClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link
                        href={`/clients?selected=${client.id}`}
                        className="block min-w-0"
                      >
                        <p className="truncate text-sm font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-xs text-muted2">ID #{client.id}</p>
                      </Link>
                    </td>
                    <td className="text-xs text-muted2" title={new Date(client.createdAt).toLocaleString("fr-FR")}>
                      {getRelativeDate(client.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="ms-kicker">Dernières interventions</p>
              <p className="mt-1 text-sm text-muted2">Trafic atelier</p>
            </div>
            <Link href="/interventions">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          {recentInterventions.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="Aucune intervention" description="Les interventions récentes apparaîtront ici." />
            </div>
          ) : (
            <DataTable variant="plain">
              <DataTableHead>
                <tr>
                  <th>Véhicule</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Créée</th>
                </tr>
              </DataTableHead>
              <tbody>
                {recentInterventions.map((intervention) => (
                  <tr key={intervention.id}>
                    <td>
                      <Link
                        href={`/interventions/${intervention.id}`}
                        className="text-sm font-medium"
                      >
                        {intervention.vehicle.plate}
                      </Link>
                    </td>
                    <td className="text-sm text-muted2">
                      {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                    </td>
                    <td className="text-sm">
                      {intervention.type}
                    </td>
                    <td className="text-xs text-muted2" title={new Date(intervention.createdAt).toLocaleString("fr-FR")}>
                      {getRelativeDate(intervention.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </div>
  );
}
