import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { requireApprovedTenant } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  type: z.string().trim().min(1).max(40).optional(),
});

const CreateSchema = z.object({
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().max(4000).nullable().optional(),
  sourceUrl: z.string().trim().url().nullable().optional(),
  code: z.string().trim().max(120).nullable().optional(),
  articleRef: z.string().trim().max(120).nullable().optional(),
  tags: z.string().trim().max(240).nullable().optional(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).default("INFO"),
  types: z.array(z.string().trim().min(1).max(40)).default([]),
});

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise", undefined, "UNAUTHORIZED"), { status: 401 });

    // Admin users are not tied to a tenant. Non-admins must be approved tenants.
    if (user.role !== "ADMIN") requireApprovedTenant(user);

    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({ type: url.searchParams.get("type") ?? undefined });
    if (!parsed.success) {
      return NextResponse.json(
        failure("Query invalide", parsed.error.flatten(), "BAD_REQUEST"),
        { status: 400 }
      );
    }

    const { type } = parsed.data;

    const items = await prisma.legalReference.findMany({
      where: {
        ...(type ? { isActive: true } : {}),
        ...(type ? { assignments: { some: { interventionType: type } } } : {}),
      },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      include: { assignments: { select: { interventionType: true } } },
    });

    return NextResponse.json(success(items), { status: 200 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise", undefined, "UNAUTHORIZED"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      throw new RouteError(403, "FORBIDDEN", "Acces reserve a l'administration.");
    }

    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        failure("Payload invalide", parsed.error.flatten(), "BAD_REQUEST"),
        { status: 400 }
      );
    }

    const { title, summary, sourceUrl, code, articleRef, tags, severity, types } = parsed.data;
    const uniqueTypes = Array.from(new Set(types.map((t) => t.trim()).filter(Boolean)));

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ref = await tx.legalReference.create({
        data: {
          title,
          summary: summary ?? null,
          sourceUrl: sourceUrl ?? null,
          code: code ?? null,
          articleRef: articleRef ?? null,
          tags: tags ?? null,
          severity,
        },
      });

      if (uniqueTypes.length) {
        await tx.legalReferenceAssignment.createMany({
          data: uniqueTypes.map((interventionType) => ({
            referenceId: ref.id,
            interventionType,
          })),
        });
      }

      return tx.legalReference.findUnique({
        where: { id: ref.id },
        include: { assignments: { select: { interventionType: true } } },
      });
    });

    return NextResponse.json(success(created), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
