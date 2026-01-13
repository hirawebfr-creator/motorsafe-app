import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json(failure("Acces reserve a l'administration."), { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Compteurs globaux
    const [
      totalGarages,
      activeGarages,
      pendingGarages,
      rejectedGarages,
      totalUsers,
      totalClients,
      totalVehicles,
      totalInterventions,
      totalQuotes,
      totalInvoices,
      // Stats temporelles
      newGaragesToday,
      newGaragesWeek,
      newGaragesMonth,
      newClientsWeek,
      newVehiclesWeek,
      newInterventionsWeek,
      newQuotesWeek,
      newInvoicesWeek,
      // Stats financières
      paidInvoices,
      unpaidInvoices,
    ] = await Promise.all([
      // Garages
      prisma.garage.count(),
      prisma.garage.count({ where: { status: "ACTIVE" } }),
      prisma.garage.count({ where: { status: "PENDING" } }),
      prisma.garage.count({ where: { status: "REJECTED" } }),
      // Users
      prisma.user.count(),
      // Clients
      prisma.client.count({ where: { deletedAt: null } }),
      // Vehicles
      prisma.vehicle.count({ where: { deletedAt: null } }),
      // Interventions
      prisma.intervention.count({ where: { deletedAt: null } }),
      // Quotes
      prisma.quote.count({ where: { deletedAt: null } }),
      // Invoices
      prisma.invoice.count({ where: { deletedAt: null } }),
      // Stats temporelles - garages
      prisma.garage.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.garage.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.garage.count({ where: { createdAt: { gte: monthStart } } }),
      // Stats temporelles - autres
      prisma.client.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
      prisma.vehicle.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
      prisma.intervention.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
      prisma.quote.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
      prisma.invoice.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
      // Stats financières
      prisma.invoice.count({ where: { status: "PAID", deletedAt: null } }),
      prisma.invoice.count({ where: { status: { in: ["DRAFT", "SENT"] }, deletedAt: null } }),
    ]);

    // Calculs financiers
    const invoiceRevenue = await prisma.invoice.aggregate({
      where: { status: "PAID", deletedAt: null },
      _sum: { totalIncl: true },
    });

    const pendingRevenue = await prisma.invoice.aggregate({
      where: { status: "SENT", deletedAt: null },
      _sum: { totalIncl: true },
    });

    // Plans distribution
    const planCounts = await prisma.garage.groupBy({
      by: ["plan"],
      _count: { plan: true },
      where: { status: "ACTIVE" },
    });

    const plans = {
      FREE: 0,
      STARTER: 0,
      PRO: 0,
    };
    for (const p of planCounts) {
      if (p.plan && p.plan in plans) {
        plans[p.plan as keyof typeof plans] = p._count.plan;
      }
    }

    // Top garages par activité
    const topGarages = await prisma.garage.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            clients: true,
            vehicles: true,
            interventions: true,
            quotes: true,
            invoices: true,
          },
        },
      },
      orderBy: { interventions: { _count: "desc" } },
      take: 10,
    });

    // Derniers garages inscrits
    const recentGarages = await prisma.garage.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        plan: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json(
      success({
        // Compteurs globaux
        totals: {
          garages: totalGarages,
          activeGarages,
          pendingGarages,
          rejectedGarages,
          users: totalUsers,
          clients: totalClients,
          vehicles: totalVehicles,
          interventions: totalInterventions,
          quotes: totalQuotes,
          invoices: totalInvoices,
        },
        // Stats temporelles
        thisWeek: {
          newGarages: newGaragesWeek,
          newClients: newClientsWeek,
          newVehicles: newVehiclesWeek,
          newInterventions: newInterventionsWeek,
          newQuotes: newQuotesWeek,
          newInvoices: newInvoicesWeek,
        },
        today: {
          newGarages: newGaragesToday,
        },
        thisMonth: {
          newGarages: newGaragesMonth,
        },
        // Finances
        finances: {
          totalRevenue: invoiceRevenue._sum.totalIncl || 0,
          pendingRevenue: pendingRevenue._sum.totalIncl || 0,
          paidInvoices,
          unpaidInvoices,
        },
        // Plans
        plans,
        // Tops
        topGarages: topGarages.map((g) => ({
          id: g.id,
          name: g.name,
          email: g.email,
          plan: g.plan,
          createdAt: g.createdAt,
          stats: g._count,
        })),
        recentGarages: recentGarages.map((g) => ({
          id: g.id,
          name: g.name,
          email: g.email,
          status: g.status,
          plan: g.plan,
          createdAt: g.createdAt,
          usersCount: g._count.users,
        })),
      })
    );
  } catch (err) {
    console.error("Erreur API GET /api/admin/stats :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
