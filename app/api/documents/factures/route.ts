/**
 * API: List invoices (factures)
 * GET /api/documents/factures
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
    const status = url.searchParams.get("status") || "";

    const where: any = {
      deletedAt: null,
    };

    // Admin sans garage émulé = toutes les factures
    if (garageId) {
      where.organisationId = garageId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { client: { firstName: { contains: search, mode: "insensitive" } } },
        { client: { lastName: { contains: search, mode: "insensitive" } } },
        { vehicle: { plate: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              plate: true,
              brand: true,
              model: true,
            },
          },
          lines: {
            where: { deletedAt: null },
            select: {
              id: true,
              description: true,
              qty: true,
              unitPriceExcl: true,
              lineTotalIncl: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json(success({
      items: invoices,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
