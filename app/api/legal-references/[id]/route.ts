import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  isActive: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise", undefined, "UNAUTHORIZED"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      throw new RouteError(403, "FORBIDDEN", "Acces reserve a l'administration.");
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(failure("ID invalide", undefined, "BAD_REQUEST"), { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        failure("Payload invalide", parsed.error.flatten(), "BAD_REQUEST"),
        { status: 400 }
      );
    }

    const updated = await prisma.legalReference.update({
      where: { id },
      data: {
        ...(parsed.data.isActive === undefined ? {} : { isActive: parsed.data.isActive }),
      },
      include: { assignments: { select: { interventionType: true } } },
    });

    return NextResponse.json(success(updated), { status: 200 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise", undefined, "UNAUTHORIZED"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      throw new RouteError(403, "FORBIDDEN", "Acces reserve a l'administration.");
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(failure("ID invalide", undefined, "BAD_REQUEST"), { status: 400 });
    }

    await prisma.legalReference.delete({ where: { id } });
    return NextResponse.json(success(true), { status: 200 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
