/**
 * LEGAL-PACK-01: Intervention Types Reference
 * GET /api/admin/legal/intervention-types - List all types
 * POST /api/admin/legal/intervention-types - Create type
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateTypeSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[A-Z0-9_]+$/),
  label: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const types = await prisma.interventionTypeRef.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        clauseSets: {
          where: { isActive: true },
          select: { id: true, name: true, isDefault: true },
        },
      },
    });

    return NextResponse.json(success(types));
  } catch (err) {
    console.error("[Intervention Types GET] Error:", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const parsed = CreateTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure(parsed.error.issues[0].message), { status: 400 });
    }

    const { key, label, description, sortOrder } = parsed.data;

    // Check uniqueness
    const existing = await prisma.interventionTypeRef.findUnique({ where: { key } });
    if (existing) {
      throw new RouteError(409, "CONFLICT", "Un type avec cette clé existe déjà");
    }

    const intType = await prisma.interventionTypeRef.create({
      data: { key, label, description, sortOrder },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "InterventionTypeRef",
        entityId: intType.id,
        action: "CREATED",
        userId: user.id,
        metadata: { key, label },
      },
    });

    return NextResponse.json(success(intType), { status: 201 });
  } catch (err) {
    console.error("[Intervention Type POST] Error:", err);
    return toErrorResponse(err);
  }
}
