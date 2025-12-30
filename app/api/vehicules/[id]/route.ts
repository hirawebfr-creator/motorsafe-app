import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        client: true,
        interventions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!vehicle) {
      return NextResponse.json(failure("Véhicule introuvable"), { status: 404 });
    }

    console.log("API /api/vehicules/[id] returning vehicle:", JSON.stringify(vehicle));

    return NextResponse.json(success(vehicle));
  } catch (err) {
    console.error("Erreur API GET /api/vehicules/[id] :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
