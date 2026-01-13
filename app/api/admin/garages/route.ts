import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
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

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const withStats = url.searchParams.get("withStats") === "true";

    const where: Prisma.GarageWhereInput =
      status === "pending"
        ? { status: "PENDING" }
        : status === "active"
        ? { status: "ACTIVE" }
        : status === "rejected"
        ? { status: "REJECTED" }
        : {};

    const garages = await prisma.garage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        siret: true,
        status: true,
        plan: true,
        reviewNote: true,
        reviewedAt: true,
        createdAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        users: {
          select: { id: true, email: true, role: true, createdAt: true },
        },
        ...(withStats
          ? {
              _count: {
                select: {
                  clients: true,
                  vehicles: true,
                  interventions: true,
                  quotes: true,
                  invoices: true,
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json(success(garages));
  } catch (err) {
    console.error("Erreur API GET /api/admin/garages :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
