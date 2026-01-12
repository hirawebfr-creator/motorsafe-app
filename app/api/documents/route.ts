import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  vehicleId: z.string().trim().min(1).optional(),
  interventionId: z.string().trim().min(1).optional(),
  type: z.enum(["INTERVENTION_REPORT", "UPLOAD"]).optional(),
});

const CreateSchema = z.object({
  vehicleId: z.string().trim().min(1).optional(),
  interventionId: z.string().trim().min(1).optional(),
  type: z.enum(["INTERVENTION_REPORT", "UPLOAD"]),
  fileUrl: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(120),
  size: z.coerce.number().int().min(0),
});

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const url = new URL(req.url);

    const parsed = QuerySchema.safeParse({
      page: url.searchParams.get("page"),
      pageSize: url.searchParams.get("pageSize"),
      vehicleId: url.searchParams.get("vehicleId") ?? undefined,
      interventionId: url.searchParams.get("interventionId") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Query invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { page, pageSize, vehicleId, interventionId, type } = parsed.data;

    const where: any = {
      deletedAt: null,
      ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
      ...(vehicleId ? { vehicleId } : {}),
      ...(interventionId ? { interventionId } : {}),
      ...(type ? { type } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json(success({ items, page, pageSize, total }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const targetGarageId = user.role === "ADMIN" ? null : user.garageId;
    if (user.role !== "ADMIN" && !targetGarageId) {
      return NextResponse.json(
        { ok: false, error: { code: "TENANT_REQUIRED", message: "Garage invalide." } },
        { status: 400 }
      );
    }

    // Ownership checks (vehicle/intervention must belong to tenant)
    if (user.role !== "ADMIN" && input.vehicleId) {
      const v = await prisma.vehicle.findFirst({
        where: { id: input.vehicleId, garageId: targetGarageId ?? -1, deletedAt: null },
        select: { id: true },
      });
      if (!v) {
        return NextResponse.json(
          { ok: false, error: { code: "FORBIDDEN", message: "Vehicule hors-tenant." } },
          { status: 403 }
        );
      }
    }

    if (user.role !== "ADMIN" && input.interventionId) {
      const itv = await prisma.intervention.findFirst({
        where: { id: input.interventionId, garageId: targetGarageId ?? -1, deletedAt: null },
        select: { id: true },
      });
      if (!itv) {
        return NextResponse.json(
          { ok: false, error: { code: "FORBIDDEN", message: "Intervention hors-tenant." } },
          { status: 403 }
        );
      }
    }

    const document = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.document.create({
        data: {
          garageId: targetGarageId,
          vehicleId: input.vehicleId ?? null,
          interventionId: input.interventionId ?? null,
          type: input.type,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          mime: input.mime,
          size: input.size,
        },
      });

      await tx.auditLog.create({
        data: {
          garageId: targetGarageId,
          userId: user.id,
          action: "DOCUMENT_CREATE",
          entityType: "Document",
          entityId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json(success(document), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
