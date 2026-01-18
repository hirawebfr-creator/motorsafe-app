import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PutSchema = z.object({
  defaultVatRate: z.coerce.number().min(0).max(1),
  defaultVatMode: z.enum(["EXCL", "INCL"]),
  vatRatesAllowed: z.array(z.coerce.number().min(0).max(1)).min(1),
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
      select: { defaultVatRate: true, defaultVatMode: true, vatRatesAllowed: true },
    });

    if (!org) throw new RouteError(404, "NOT_FOUND", "Organisation introuvable");

    return NextResponse.json({ ok: true, data: org });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
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

    const updated = await prisma.garage.update({
      where: { id: organisationId },
      data: {
        defaultVatRate: parsed.data.defaultVatRate,
        defaultVatMode: parsed.data.defaultVatMode,
        vatRatesAllowed: parsed.data.vatRatesAllowed,
      },
      select: { defaultVatRate: true, defaultVatMode: true, vatRatesAllowed: true },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
