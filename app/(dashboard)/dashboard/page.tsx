import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/common/StatCard";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/pending");

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

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Vue generale</p>
        <h1 className="mt-3 text-3xl font-semibold">Pilotage temps reel</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Suivi des operations et de la conformite. Chaque carte synthese les flux clients,
          vehicules et interventions sur 30 jours.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard label="Clients actifs" value={clientsCount} badge="Stable" />
        <StatCard label="Vehicules suivis" value={vehiclesCount} badge="Stable" />
        <StatCard label="Interventions totales" value={interventionsCount} badge="Stable" />
        <StatCard label="Interventions aujourd'hui" value={interventionsToday} badge={`7j: ${interventionsWeek}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Derniers clients</p>
              <h2 className="mt-2 text-xl font-semibold">Nouveaux dossiers</h2>
            </div>
            <Badge variant="accent">{recentClients.length}</Badge>
          </div>
          <div className="mt-6 grid gap-3">
            {recentClients.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Aucun client enregistre.</p>
            ) : (
              recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-[var(--muted)]">ID #{client.id}</p>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {client.createdAt.toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Dernieres interventions</p>
              <h2 className="mt-2 text-xl font-semibold">Trafic atelier</h2>
            </div>
            <Badge variant="accent">{recentInterventions.length}</Badge>
          </div>
          <div className="mt-6 grid gap-3">
            {recentInterventions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Aucune intervention recente.</p>
            ) : (
              recentInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {intervention.vehicle.plate} - {intervention.type}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {intervention.createdAt.toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
