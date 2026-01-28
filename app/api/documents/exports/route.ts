/**
 * API: List exports
 * GET /api/documents/exports
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantIdWithAdminOverride } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantIdWithAdminOverride(user, req);

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const search = url.searchParams.get("search") || "";

    // Exports are stored as documents with type EXPORT or similar
    // If there's no specific export table, we return documents of type export
    const where: any = {
      deletedAt: null,
      type: "INTERVENTION_REPORT", // Export packages are typically intervention reports
    };

    // Admin sans garage émulé = tous les exports
    if (garageId) {
      where.garageId = garageId;
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: {
            select: {
              id: true,
              plate: true,
              brand: true,
              model: true,
            },
          },
          intervention: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json(success({
      items: documents,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
