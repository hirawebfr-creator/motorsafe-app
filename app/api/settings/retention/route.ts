/**
 * LEGAL-RETENTION-01: Retention settings API
 * GET/PUT /api/settings/retention
 * Manage data retention policy for the garage
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { requirePermission, Permission } from "@/lib/permissions";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PutSchema = z.object({
  retentionSignedDocsYears: z.coerce.number().int().min(5).max(30),
  retentionAccountingYears: z.coerce.number().int().min(10).max(30),
  retentionOperationalDays: z.coerce.number().int().min(90).max(3650),
});

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // ADMIN cannot access garage-specific settings
    if (user.role === "ADMIN") {
      throw new RouteError(403, "FORBIDDEN", "Accès réservé aux gestionnaires de garage");
    }
    
    const organisationId = user.garageId ?? -1;

    const org = await prisma.garage.findFirst({
      where: { id: organisationId },
      select: {
        retentionSignedDocsYears: true,
        retentionAccountingYears: true,
        retentionOperationalDays: true,
      },
    });

    if (!org) throw new RouteError(404, "NOT_FOUND", "Organisation introuvable");

    return NextResponse.json({
      ok: true,
      data: {
        retentionSignedDocsYears: org.retentionSignedDocsYears,
        retentionAccountingYears: org.retentionAccountingYears,
        retentionOperationalDays: org.retentionOperationalDays,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // MULTI-USER-ROLES-01: Only OWNER can manage retention settings
    await requirePermission(user, Permission.RETENTION_MANAGE);
    
    // ADMIN cannot modify garage-specific settings
    if (user.role === "ADMIN") {
      throw new RouteError(403, "FORBIDDEN", "Accès réservé aux gestionnaires de garage");
    }
    
    const organisationId = user.garageId ?? -1;

    const body = await req.json().catch(() => null);
    const parsed = PutSchema.safeParse(body);
    if (!parsed.success) {
      throw new RouteError(400, "BAD_REQUEST", "Body invalide", parsed.error.flatten());
    }

    // Validate minimum retention for accounting (French law: 10 years)
    if (parsed.data.retentionAccountingYears < 10) {
      throw new RouteError(400, "BAD_REQUEST", "La conservation comptable minimale est de 10 ans (obligation légale)");
    }

    // Validate minimum retention for signed docs (French law: 5 years minimum)
    if (parsed.data.retentionSignedDocsYears < 5) {
      throw new RouteError(400, "BAD_REQUEST", "La conservation des documents signés minimale est de 5 ans (obligation légale)");
    }

    const updated = await prisma.garage.update({
      where: { id: organisationId },
      data: {
        retentionSignedDocsYears: parsed.data.retentionSignedDocsYears,
        retentionAccountingYears: parsed.data.retentionAccountingYears,
        retentionOperationalDays: parsed.data.retentionOperationalDays,
      },
      select: {
        retentionSignedDocsYears: true,
        retentionAccountingYears: true,
        retentionOperationalDays: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: organisationId,
        userId: user.id,
        action: "UPDATE",
        entityType: "settings_retention",
        entityId: String(organisationId),
        metadata: { ...parsed.data },
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
