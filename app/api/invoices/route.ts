import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { computeLinesWithTotals, normalizeVatMode } from "@/lib/quoteInvoice";
import type { Prisma } from "@prisma/client";
import { allocateNumberTx } from "@/lib/numbering";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional().or(z.literal("")),
});

const LineSchema = z.object({
  description: z.string().trim().min(1).max(240),
  qty: z.coerce.number().positive().default(1),
  unitPriceExcl: z.coerce.number().min(0),
  vatRate: z.coerce.number().min(0).max(1).optional(),
});

const CreateSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  vehicleId: z.string().trim().optional().or(z.literal("")),
  vatMode: z.enum(["EXCL", "INCL"]).optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  dueAt: z.string().trim().optional(),
  lines: z.array(LineSchema).min(1),
});

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);

    const url = new URL(req.url);
    const parsed = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Query invalide", parsed.error.flatten());
    }

    const { page, pageSize, q } = parsed.data;
    const skip = (page - 1) * pageSize;
    const query = (q ?? "").trim();

    const where: any = {
      organisationId,
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { invoiceNumber: { contains: query, mode: "insensitive" } },
              { client: { firstName: { contains: query, mode: "insensitive" } } },
              { client: { lastName: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { client: true, vehicle: true },
      }),
    ]);

    return NextResponse.json({ ok: true, data: { items, page, pageSize, total } });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);

    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide", parsed.error.flatten());
    }

    const input = parsed.data;
    const vehicleId = input.vehicleId ? input.vehicleId.trim() : undefined;

    const org = await prisma.garage.findFirst({
      where: { id: organisationId },
      select: {
        id: true,
        defaultVatRate: true,
        defaultVatMode: true,
        invoicePrefix: true,
        numberPadding: true,
      },
    });
    if (!org) throw new RouteError(404, "NOT_FOUND", "Organisation introuvable");

    const client = await prisma.client.findFirst({
      where: { id: input.clientId, garageId: organisationId, deletedAt: null },
      select: { id: true, vatProfile: true, vatNumber: true, countryCode: true },
    });
    if (!client) throw new RouteError(404, "NOT_FOUND", "Client introuvable");

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, garageId: organisationId, deletedAt: null },
        select: { id: true, clientId: true },
      });
      if (!vehicle) throw new RouteError(404, "NOT_FOUND", "Vehicule introuvable");
      if (vehicle.clientId !== input.clientId) {
        throw new RouteError(409, "CONFLICT", "Vehicule non associe au client");
      }
    }

    const vatMode = normalizeVatMode(input.vatMode, org.defaultVatMode);

    const { lines, totals } = computeLinesWithTotals({
      org: { defaultVatRate: org.defaultVatRate },
      client,
      lines: input.lines,
    });

    const now = new Date();
    const year = now.getFullYear();

    const dueAt = input.dueAt ? new Date(input.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      throw new RouteError(400, "BAD_REQUEST", "dueAt invalide");
    }

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const allocation = await allocateNumberTx(tx, {
        organisationId,
        type: "INVOICE",
        year,
        prefix: org.invoicePrefix,
        padding: org.numberPadding,
      });

      const invoice = await tx.invoice.create({
        data: {
          organisationId,
          clientId: input.clientId,
          vehicleId: vehicleId || null,
          status: "DRAFT",
          invoiceNumber: allocation.number,
          invoiceYear: allocation.year,
          invoiceSeq: allocation.seq,
          currency: input.currency ?? "EUR",
          vatMode,
          subtotalExcl: totals.subtotalExcl,
          totalVat: totals.totalVat,
          totalIncl: totals.totalIncl,
          ...(dueAt ? { dueAt } : {}),
          lines: {
            createMany: {
              data: lines.map((l) => ({
                description: l.description,
                qty: l.qty,
                unitPriceExcl: l.unitPriceExcl,
                vatRate: l.vatRate,
                lineTotalExcl: l.lineTotalExcl,
                lineVatAmount: l.lineVatAmount,
                lineTotalIncl: l.lineTotalIncl,
              })),
            },
          },
        },
        include: { lines: { where: { deletedAt: null } }, client: true, vehicle: true },
      });

      await tx.auditLog.create({
        data: {
          garageId: organisationId,
          userId: user.id,
          action: "INVOICE_CREATE",
          entityType: "Invoice",
          entityId: invoice.id,
        },
      });

      return invoice;
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
