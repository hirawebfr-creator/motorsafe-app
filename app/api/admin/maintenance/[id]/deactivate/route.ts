/**
 * IN-APP-STATUS-AND-CHANGES-01: Admin Maintenance Deactivate API
 * POST /api/admin/maintenance/[id]/deactivate - Deactivate a maintenance window
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const { id } = await params;

    const existing = await prisma.maintenanceWindow.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Maintenance non trouvée" }, { status: 404 });
    }

    const maintenance = await prisma.maintenanceWindow.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        title: true,
        isActive: true,
      },
    });

    console.log(`[API:Admin:Maintenance] Deactivated window ${maintenance.id} by admin ${user.id}`);

    return NextResponse.json({ maintenance });
  } catch (err) {
    console.error("[API:Admin:Maintenance:Deactivate] Error:", err);
    return toErrorResponse(err);
  }
}
