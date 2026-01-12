import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    if (user.role === "ADMIN") {
      const items = await prisma.garage.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ items });
    }

    requireApprovedTenant(user);

    if (!user.garageId) {
      return NextResponse.json({ items: [] });
    }

    const g = await prisma.garage.findUnique({
      where: { id: user.garageId },
      select: { id: true, name: true },
    });

    return NextResponse.json({ items: g ? [g] : [] });
  } catch (err) {
    return toErrorResponse(err);
  }
}
