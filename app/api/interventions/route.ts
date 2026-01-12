import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedTypes = new Set(["E85", "Reprog", "Diag", "Autre"]);

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  return realIp ?? null;
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  vehicleId: z.string().trim().min(1).optional(),
  status: z.enum(["DRAFT", "OPEN", "DONE", "CANCELED"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const CreateSchema = z.object({
  vehicleId: z.string().trim().min(1),
  type: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["DRAFT", "OPEN", "DONE", "CANCELED"]).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  performedAt: z.string().optional().or(z.literal("")),
  odometerKm: z.union([z.number(), z.string()]).optional(),
  ecuType: z.string().trim().max(80).optional().or(z.literal("")),
  softwareVersion: z.string().trim().max(80).optional().or(z.literal("")),
  checksum: z.string().trim().max(128).optional().or(z.literal("")),
  amountCents: z.coerce.number().int().min(0).optional(),
  garageId: z.coerce.number().int().positive().optional(),
  createdBy: z.string().trim().max(120).optional(),
});

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      vehicleId: url.searchParams.get("vehicleId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Query invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { page, pageSize, vehicleId, status, from, to } = parsed.data;

    const where: any = {
      deletedAt: null,
      ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
      ...(vehicleId ? { vehicleId } : {}),
      ...(status ? { status } : {}),
    };

    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [total, items] = await Promise.all([
      prisma.intervention.count({ where }),
      prisma.intervention.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { vehicle: { include: { client: true } } },
      }),
    ]);

    return NextResponse.json(success({ items, page, pageSize, total }));
  } catch (err) {
    console.error("Erreur API GET /api/interventions :", err);
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
    const type = normalizeText(input.type);
    if (!allowedTypes.has(type)) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Type d'intervention invalide." } },
        { status: 400 }
      );
    }

    const performedAt = input.performedAt ? new Date(input.performedAt) : null;
    if (performedAt && Number.isNaN(performedAt.getTime())) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Date d'intervention invalide." } },
        { status: 400 }
      );
    }

    const odometerKmRaw = input.odometerKm;
    const odometerKm =
      odometerKmRaw === undefined || odometerKmRaw === null || odometerKmRaw === ""
        ? null
        : Number(odometerKmRaw);
    if (odometerKm !== null && (!Number.isFinite(odometerKm) || odometerKm < 0)) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Kilometrage invalide." } },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findFirst({
      where:
        user.role === "ADMIN"
          ? { id: input.vehicleId, deletedAt: null }
          : { id: input.vehicleId, garageId: user.garageId ?? -1, deletedAt: null },
      select: { id: true, garageId: true },
    });
    if (!vehicle) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Vehicule introuvable." } },
        { status: 404 }
      );
    }

    const targetGarageId = user.role === "ADMIN" ? (input.garageId ?? vehicle.garageId) : user.garageId;
    if (!targetGarageId) {
      return NextResponse.json(
        { ok: false, error: { code: "TENANT_REQUIRED", message: "Garage invalide." } },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") ?? null;
    const clientIp = getClientIp(req);
    const createdBy = input.createdBy ? normalizeText(input.createdBy) : user.email;

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdIntervention = await tx.intervention.create({
        data: {
          garageId: targetGarageId,
          vehicleId: input.vehicleId,
          type,
          title: input.title ? normalizeText(input.title) : null,
          status: (input.status as any) ?? "OPEN",
          notes: input.notes ? normalizeText(input.notes) : null,
          performedAt: performedAt ?? undefined,
          odometerKm: odometerKm ?? undefined,
          ecuType: input.ecuType ? normalizeText(input.ecuType) : null,
          softwareVersion: input.softwareVersion ? normalizeText(input.softwareVersion) : null,
          checksum: input.checksum ? normalizeText(input.checksum) : null,
          amountCents: input.amountCents ?? undefined,
          createdBy,
          clientIp,
          userAgent,
        },
      });

      const payloadObj: Record<string, unknown> = {
        interventionId: createdIntervention.id,
        vehicleId: input.vehicleId,
        type,
        title: input.title ?? null,
        status: (input.status as any) ?? "OPEN",
        notes: input.notes ?? null,
        performedAt: performedAt ? performedAt.toISOString() : null,
        odometerKm,
        ecuType: input.ecuType ?? null,
        softwareVersion: input.softwareVersion ?? null,
        checksum: input.checksum ?? null,
        amountCents: input.amountCents ?? null,
        userAgent,
        clientIp,
        createdAt: createdIntervention.createdAt.toISOString(),
      };

      const payload = JSON.stringify(payloadObj);
      const hash = createHash("sha256").update(payload).digest("hex");

      const updated = await tx.intervention.update({
        where: { id: createdIntervention.id },
        data: { payload, hash },
        include: { vehicle: { include: { client: true } } },
      });

      await tx.interventionRevision.create({
        data: {
          interventionId: createdIntervention.id,
          payload,
          hash,
          createdBy,
          clientIp,
          userAgent,
        },
      });

      await tx.auditLog.create({
        data: {
          garageId: targetGarageId,
          userId: user.id,
          action: "INTERVENTION_CREATE",
          entityType: "Intervention",
          entityId: createdIntervention.id,
        },
      });

      return updated;
    });

    return NextResponse.json(success(created), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/interventions :", err);
    return toErrorResponse(err);
  }
}
