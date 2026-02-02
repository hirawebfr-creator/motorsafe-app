import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { z } from "zod";
import { computeLinesWithTotals, normalizeVatMode } from "@/lib/quoteInvoice";
import type { Prisma } from "@prisma/client";
import { decryptClientData } from "@/lib/encryption";

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
  dueAt: z.string().trim().optional().or(z.literal("")),
  lines: z.array(LineSchema).min(1).optional(),
});

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);
    
    // Feature gate: DEVIS_FACTURES required
    if (!isAdmin && organisationId) {
      await requireFeature(organisationId, FeatureKey.DEVIS_FACTURES);
    }

    const { id } = await ctx.params;
    const invoice = await prisma.invoice.findFirst({
      where: { id: String(id), ...(isAdmin ? {} : { organisationId }), deletedAt: null },
      include: {
        lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        client: true,
        vehicle: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!invoice) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

    // Decrypt client data for display and map line field names for frontend
    const decryptedInvoice = {
      ...invoice,
      client: invoice.client ? decryptClientData(invoice.client as Record<string, unknown>) : invoice.client,
      lines: invoice.lines.map((line) => ({
        ...line,
        // Map database field names to frontend expected names
        totalExcl: line.lineTotalExcl,
        totalVat: line.lineVatAmount,
        totalIncl: line.lineTotalIncl,
      })),
    };

    return NextResponse.json({ ok: true, data: decryptedInvoice });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);

    const { id } = await ctx.params;
    const invoiceId = String(id);

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide", parsed.error.flatten());
    }

    const input = parsed.data;
    const vehicleId = input.vehicleId ? input.vehicleId.trim() : undefined;

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.invoice.findFirst({
        where: { id: invoiceId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
        include: { lines: { where: { deletedAt: null } } },
      });
      if (!existing) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

      if (existing.status === "PAID" || existing.status === "CANCELED") {
        throw new RouteError(409, "CONFLICT", "Facture non modifiable");
      }

      // For ADMIN, use the invoice's organisationId for org lookup
      const effectiveOrgId = isAdmin ? existing.organisationId : organisationId!;

      const org = await tx.garage.findFirst({
        where: { id: effectiveOrgId },
        select: { defaultVatRate: true, defaultVatMode: true },
      });
      if (!org) throw new RouteError(404, "NOT_FOUND", "Organisation introuvable");

      const clientId = input.clientId ?? existing.clientId;

      const client = await tx.client.findFirst({
        where: { id: clientId, garageId: effectiveOrgId, deletedAt: null },
        select: { id: true, vatProfile: true, vatNumber: true, countryCode: true },
      });
      if (!client) throw new RouteError(404, "NOT_FOUND", "Client introuvable");

      const nextVehicleId = vehicleId === undefined ? existing.vehicleId : vehicleId || null;
      if (nextVehicleId) {
        const vehicle = await tx.vehicle.findFirst({
          where: { id: nextVehicleId, garageId: effectiveOrgId, deletedAt: null },
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

      const dueAt = input.dueAt ? new Date(input.dueAt) : undefined;
      if (dueAt && Number.isNaN(dueAt.getTime())) {
        throw new RouteError(400, "BAD_REQUEST", "dueAt invalide");
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          clientId,
          vehicleId: nextVehicleId,
          ...(input.currency ? { currency: input.currency } : {}),
          ...(dueAt !== undefined ? { dueAt: input.dueAt ? dueAt : null } : {}),
          vatMode,
          subtotalExcl: totals.subtotalExcl,
          totalVat: totals.totalVat,
          totalIncl: totals.totalIncl,
        },
      });

      if (input.lines) {
        await tx.invoiceLine.updateMany({
          where: { invoiceId, deletedAt: null },
          data: { deletedAt: new Date() },
        });

        await tx.invoiceLine.createMany({
          data: lines.map((l) => ({
            invoiceId,
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
          garageId: effectiveOrgId,
          userId: user.id,
          action: "INVOICE_UPDATE",
          entityType: "Invoice",
          entityId: invoiceId,
        },
      });

      return tx.invoice.findFirst({
        where: { id: invoiceId },
        include: {
          lines: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
          client: true,
          vehicle: true,
          payments: { orderBy: { createdAt: "desc" } },
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
    const isAdmin = user.role === "ADMIN";
    const organisationId = isAdmin ? undefined : (user.garageId ?? -1);

    const { id } = await ctx.params;
    const invoiceId = String(id);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.invoice.findFirst({
        where: { id: invoiceId, ...(isAdmin ? {} : { organisationId }), deletedAt: null },
        select: { id: true, organisationId: true },
      });
      if (!existing) throw new RouteError(404, "NOT_FOUND", "Facture introuvable");

      const effectiveOrgId = isAdmin ? existing.organisationId : organisationId!;

      await tx.invoice.update({ where: { id: invoiceId }, data: { deletedAt: new Date() } });
      await tx.invoiceLine.updateMany({ where: { invoiceId, deletedAt: null }, data: { deletedAt: new Date() } });

      await tx.auditLog.create({
        data: {
          garageId: effectiveOrgId,
          userId: user.id,
          action: "INVOICE_DELETE",
          entityType: "Invoice",
          entityId: invoiceId,
        },
      });
    });

    return NextResponse.json({ ok: true, data: { id: invoiceId } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
