import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { z } from "zod";
import { computeLinesWithTotals, ensureEditableQuoteStatus, normalizeVatMode } from "@/lib/quoteInvoice";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const LineSchema = z.object({
  description: z.string().trim().min(1).max(240),
  qty: z.coerce.number().positive().default(1),
  unitPriceExcl: z.coerce.number().min(0),
  vatRate: z.coerce.number().min(0).max(1).optional(),
});

const PatchSchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  vehicleId: z.string().trim().optional().or(z.literal("")),
  vatMode: z.enum(["EXCL", "INCL"]).optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  lines: z.array(LineSchema).min(1).optional(),
});

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);
    
    // Feature gate: DEVIS_FACTURES required
    if (user.role !== "ADMIN") {
      await requireFeature(organisationId, FeatureKey.DEVIS_FACTURES);
    }

    const { id } = await ctx.params;

    const quote = await prisma.quote.findFirst({
      where: { id: String(id), organisationId, deletedAt: null },
      include: {
        lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        client: true,
        vehicle: true,
      },
    });

    if (!quote) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");

    return NextResponse.json({ ok: true, data: quote });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);

    const { id } = await ctx.params;
    const quoteId = String(id);

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide", parsed.error.flatten());
    }

    const input = parsed.data;
    const vehicleId = input.vehicleId ? input.vehicleId.trim() : undefined;

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.quote.findFirst({
        where: { id: quoteId, organisationId, deletedAt: null },
        include: { lines: { where: { deletedAt: null } } },
      });
      if (!existing) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");

      ensureEditableQuoteStatus(existing.status);

      const org = await tx.garage.findFirst({
        where: { id: organisationId },
        select: { defaultVatRate: true, defaultVatMode: true },
      });
      if (!org) throw new RouteError(404, "NOT_FOUND", "Organisation introuvable");

      const clientId = input.clientId ?? existing.clientId;

      const client = await tx.client.findFirst({
        where: { id: clientId, garageId: organisationId, deletedAt: null },
        select: { id: true, vatProfile: true, vatNumber: true, countryCode: true },
      });
      if (!client) throw new RouteError(404, "NOT_FOUND", "Client introuvable");

      const nextVehicleId = vehicleId === undefined ? existing.vehicleId : vehicleId || null;
      if (nextVehicleId) {
        const vehicle = await tx.vehicle.findFirst({
          where: { id: nextVehicleId, garageId: organisationId, deletedAt: null },
          select: { id: true, clientId: true },
        });
        if (!vehicle) throw new RouteError(404, "NOT_FOUND", "Vehicule introuvable");
        if (vehicle.clientId !== clientId) {
          throw new RouteError(409, "CONFLICT", "Vehicule non associe au client");
        }
      }

      const vatMode = input.vatMode
        ? normalizeVatMode(input.vatMode, org.defaultVatMode)
        : (existing.vatMode as any);

      const nextLinesInput = input.lines ?? existing.lines.map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPriceExcl: l.unitPriceExcl,
        vatRate: l.vatRate,
      }));

      const { lines, totals } = computeLinesWithTotals({
        org: { defaultVatRate: org.defaultVatRate },
        client,
        lines: nextLinesInput,
      });

      await tx.quote.update({
        where: { id: quoteId },
        data: {
          clientId,
          vehicleId: nextVehicleId,
          ...(input.currency ? { currency: input.currency } : {}),
          vatMode,
          subtotalExcl: totals.subtotalExcl,
          totalVat: totals.totalVat,
          totalIncl: totals.totalIncl,
        },
      });

      if (input.lines) {
        await tx.quoteLine.updateMany({
          where: { quoteId, deletedAt: null },
          data: { deletedAt: new Date() },
        });

        await tx.quoteLine.createMany({
          data: lines.map((l) => ({
            quoteId,
            description: l.description,
            qty: l.qty,
            unitPriceExcl: l.unitPriceExcl,
            vatRate: l.vatRate,
            lineTotalExcl: l.lineTotalExcl,
            lineVatAmount: l.lineVatAmount,
            lineTotalIncl: l.lineTotalIncl,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          garageId: organisationId,
          userId: user.id,
          action: "QUOTE_UPDATE",
          entityType: "Quote",
          entityId: quoteId,
        },
      });

      return tx.quote.findFirst({
        where: { id: quoteId },
        include: {
          lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
          client: true,
          vehicle: true,
        },
      });
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const organisationId = getTenantId(user);

    const { id } = await ctx.params;
    const quoteId = String(id);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.quote.findFirst({
        where: { id: quoteId, organisationId, deletedAt: null },
        select: { id: true },
      });
      if (!existing) throw new RouteError(404, "NOT_FOUND", "Devis introuvable");

      await tx.quote.update({ where: { id: quoteId }, data: { deletedAt: new Date() } });
      await tx.quoteLine.updateMany({ where: { quoteId, deletedAt: null }, data: { deletedAt: new Date() } });

      await tx.auditLog.create({
        data: {
          garageId: organisationId,
          userId: user.id,
          action: "QUOTE_DELETE",
          entityType: "Quote",
          entityId: quoteId,
        },
      });
    });

    return NextResponse.json({ ok: true, data: { id: quoteId } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
