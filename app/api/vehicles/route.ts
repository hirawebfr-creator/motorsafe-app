import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { decrypt } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  clientId: z.string().trim().min(1).optional(),
});

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    const url = new URL(req.url);

    const getNonEmpty = (key: string) => {
      const v = url.searchParams.get(key);
      if (v === null) return undefined;
      const trimmed = v.trim();
      return trimmed.length ? trimmed : undefined;
    };

    const parsed = QuerySchema.safeParse({
      page: getNonEmpty("page"),
      pageSize: getNonEmpty("pageSize"),
      limit: getNonEmpty("limit"),
      q: getNonEmpty("q"),
      search: getNonEmpty("search"),
      clientId: getNonEmpty("clientId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Query invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { page, pageSize, limit, q, search, clientId } = parsed.data;
    const effectivePageSize = limit || pageSize;
    const effectiveQuery = search || q;

    const baseWhere: any = {
      deletedAt: null,
      ...(user.role === "ADMIN" ? {} : { client: { garageId: user.garageId ?? -1 } }),
      ...(clientId ? { clientId } : {}),
    };

    if (effectiveQuery) {
      baseWhere.OR = [
        { plate: { contains: effectiveQuery, mode: "insensitive" } },
        { brand: { contains: effectiveQuery, mode: "insensitive" } },
        { model: { contains: effectiveQuery, mode: "insensitive" } },
        { vin: { contains: effectiveQuery, mode: "insensitive" } },
        { client: { firstName: { contains: effectiveQuery, mode: "insensitive" } } },
        { client: { lastName: { contains: effectiveQuery, mode: "insensitive" } } },
      ];
    }

    const [total, rawItems] = await Promise.all([
      prisma.vehicle.count({ where: baseWhere }),
      prisma.vehicle.findMany({
        where: baseWhere,
        orderBy: [{ plate: "asc" }, { id: "desc" }],
        skip: (page - 1) * effectivePageSize,
        take: effectivePageSize,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    // Format vehicles for response
    const vehicles = rawItems.map((v) => {
      // Decrypt client data if encrypted
      let clientFirstName = v.client?.firstName || "";
      let clientLastName = v.client?.lastName || "";

      try {
        if (clientFirstName && clientFirstName.includes(":")) {
          clientFirstName = decrypt(clientFirstName) || clientFirstName;
        }
        if (clientLastName && clientLastName.includes(":")) {
          clientLastName = decrypt(clientLastName) || clientLastName;
        }
      } catch {
        // Keep original if decryption fails
      }

      return {
        id: v.id,
        brand: v.brand,
        model: v.model,
        registration: v.plate,
        vin: v.vin,
        year: v.year,
        clientId: v.clientId,
        clientName: `${clientFirstName} ${clientLastName}`.trim(),
      };
    });

    return NextResponse.json(success({ vehicles, items: vehicles, page, pageSize: effectivePageSize, total }));
  } catch (err) {
    console.error("Erreur API GET /api/vehicles :", err);
    return toErrorResponse(err);
  }
}
