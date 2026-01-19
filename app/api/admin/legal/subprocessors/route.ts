/**
 * LEGAL-PACK-01: Subprocessors Management (GDPR DPA)
 * GET /api/admin/legal/subprocessors - List all subprocessors
 * POST /api/admin/legal/subprocessors - Add subprocessor
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SubprocessorSchema = z.object({
  name: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500),
  region: z.string().min(1).max(100),
  linkUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const subprocessors = await prisma.subprocessor.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(success(subprocessors));
  } catch (err) {
    console.error("[Subprocessors GET] Error:", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const parsed = SubprocessorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure(parsed.error.issues[0].message), { status: 400 });
    }

    const subprocessor = await prisma.subprocessor.create({
      data: parsed.data,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "Subprocessor",
        entityId: subprocessor.id,
        action: "CREATED",
        userId: user.id,
        metadata: { name: subprocessor.name },
      },
    });

    return NextResponse.json(success(subprocessor), { status: 201 });
  } catch (err) {
    console.error("[Subprocessor POST] Error:", err);
    return toErrorResponse(err);
  }
}
