import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { decryptClients } from "@/lib/encryption";

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
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "50", 10)));
    const garageId = url.searchParams.get("garageId");
    const search = url.searchParams.get("search") || "";

    const where = {
      deletedAt: null,
      ...(garageId ? { garageId: parseInt(garageId, 10) } : {}),
    };

    const [rawClients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          garageId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          createdAt: true,
          vatProfile: true,
          garage: {
            select: { id: true, name: true },
          },
          _count: {
            select: { vehicles: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    // Décrypter les données sensibles
    const clients = decryptClients(rawClients as unknown as Record<string, unknown>[]);

    // Filtrer par search après décryptage
    const filtered = search
      ? clients.filter((c: Record<string, unknown>) => {
          const firstName = String(c.firstName || "").toLowerCase();
          const lastName = String(c.lastName || "").toLowerCase();
          const email = String(c.email || "").toLowerCase();
          const q = search.toLowerCase();
          return firstName.includes(q) || lastName.includes(q) || email.includes(q);
        })
      : clients;

    return NextResponse.json(
      success({
        items: filtered,
        page,
        pageSize,
        total: search ? filtered.length : total,
        totalPages: Math.ceil((search ? filtered.length : total) / pageSize),
      })
    );
  } catch (err) {
    console.error("Erreur API GET /api/admin/clients :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
