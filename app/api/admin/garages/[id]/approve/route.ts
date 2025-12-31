import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json(failure("Acces reserve a l'administration."), { status: 403 });
    }

    const { id } = await params;
    const garageId = Number(id);
    if (!Number.isFinite(garageId)) {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const garage = await prisma.garage.update({
      where: { id: garageId },
      data: { status: "ACTIVE" },
    });

    return NextResponse.json(success(garage));
  } catch (err) {
    console.error("Erreur API POST /api/admin/garages/[id]/approve :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
