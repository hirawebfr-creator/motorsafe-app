/**
 * PATCH /api/admin/garages/[id]/partner-badge
 * Admin-only: Set partner badge override for a garage
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  override: z.enum(["NONE", "FORCE_ON", "FORCE_OFF"]),
});

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(failure("Non autorisé"), { status: 401 });
    }
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json(failure("Accès réservé à l'administration"), { status: 403 });
    }

    const { id } = await ctx.params;
    const garageId = parseInt(id, 10);
    if (isNaN(garageId)) {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(failure("Override invalide"), { status: 400 });
    }

    const garage = await prisma.garage.update({
      where: { id: garageId },
      data: { partnerBadgeAdminOverride: parsed.data.override },
      select: {
        id: true,
        name: true,
        partnerBadgeEnabled: true,
        partnerBadgeAdminOverride: true,
      },
    });

    // Compute effective
    const partnerBadgeEffective =
      garage.partnerBadgeAdminOverride === "FORCE_ON"
        ? true
        : garage.partnerBadgeAdminOverride === "FORCE_OFF"
        ? false
        : garage.partnerBadgeEnabled;

    return NextResponse.json(success({ ...garage, partnerBadgeEffective }));
  } catch (err) {
    console.error("Erreur API PATCH /api/admin/garages/[id]/partner-badge :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
