import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, PLAN_LIMITS, FREE_UPGRADE_MESSAGE, type Plan } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { encrypt, decryptClients } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(120).optional(),
});

const CreateSchema = z.union([
  z.object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(60),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
    phone: z.string().trim().min(2).max(40).optional().or(z.literal("")),
    address: z.string().trim().min(2).max(200).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    garageId: z.coerce.number().int().positive().optional(),
    vatMode: z.enum(["STANDARD", "REDUCED_10", "REDUCED_55", "EXEMPT", "CUSTOM"]).optional(),
    vatRate: z.coerce.number().min(0).max(1).optional(),
  }),
  z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
    phone: z.string().trim().min(2).max(40).optional().or(z.literal("")),
    garageId: z.coerce.number().int().positive().optional(),
    vatMode: z.enum(["STANDARD", "REDUCED_10", "REDUCED_55", "EXEMPT", "CUSTOM"]).optional(),
    vatRate: z.coerce.number().min(0).max(1).optional(),
  }),
]);

function parseNameToFirstLast(name: string) {
  const parts = name
    .trim()
    .split(/\s+/g)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  if (firstName.length < 2 || lastName.length < 2) return null;
  return { firstName, lastName };
}

function cleanOptional(value: string | undefined) {
  const v = (value ?? "").trim();
  return v.length ? v : null;
}

function resolveClientVat(input: { vatMode?: unknown; vatRate?: unknown } | null | undefined): {
  vatProfile: string;
  vatRateOverride: number | null;
} {
  const mode = String(input?.vatMode ?? "STANDARD").toUpperCase();
  if (mode === "EXEMPT") return { vatProfile: "EXONERE", vatRateOverride: 0 };
  if (mode === "REDUCED_10") return { vatProfile: "PARTICULIER", vatRateOverride: 0.1 };
  if (mode === "REDUCED_55") return { vatProfile: "PARTICULIER", vatRateOverride: 0.055 };
  if (mode === "CUSTOM") {
    const rate = Number(input?.vatRate);
    const safe = Number.isFinite(rate) ? Math.min(1, Math.max(0, rate)) : 0;
    return { vatProfile: "PARTICULIER", vatRateOverride: safe };
  }
  // STANDARD
  return { vatProfile: "PARTICULIER", vatRateOverride: 0.2 };
}

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
      q: getNonEmpty("q"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Query invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { page, pageSize, q } = parsed.data;

    const baseWhere: any = {
      deletedAt: null,
      ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
    };

    if (q) {
      baseWhere.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { vehicles: { some: { plate: { contains: q, mode: "insensitive" } } } },
        { vehicles: { some: { brand: { contains: q, mode: "insensitive" } } } },
        { vehicles: { some: { model: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, rawItems] = await Promise.all([
      prisma.client.count({ where: baseWhere }),
      prisma.client.findMany({
        where: baseWhere,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { garage: { select: { id: true, name: true } } },
      }),
    ]);

    // Décrypter les données sensibles avant de retourner
    const items = decryptClients(rawItems as Record<string, unknown>[]);

    return NextResponse.json(success({ items, page, pageSize, total }));
  } catch (err) {
    console.error("Erreur API GET /api/clients :", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const json = await req.json().catch(() => null);
    
    console.log("[API:clients:POST] Input:", JSON.stringify(json));
    
    const parsed = CreateSchema.safeParse(json);
    if (!parsed.success) {
      console.log("[API:clients:POST] Validation error:", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const input = parsed.data as any;
    let targetGarageId = user.role === "ADMIN" ? input.garageId : user.garageId;
    
    // Pour les ADMINs sans garageId spécifié, utiliser le premier garage actif
    if (user.role === "ADMIN" && !targetGarageId) {
      const firstGarage = await prisma.garage.findFirst({
        where: { status: "ACTIVE" },
        select: { id: true },
        orderBy: { id: "asc" }
      });
      targetGarageId = firstGarage?.id;
    }
    
    console.log("[API:clients:POST] targetGarageId:", targetGarageId, "user.garageId:", user.garageId, "user.role:", user.role);
    
    if (!targetGarageId) {
      return NextResponse.json(
        { ok: false, error: { code: "TENANT_REQUIRED", message: "Garage invalide." } },
        { status: 400 }
      );
    }

    const vat = resolveClientVat(input);

    const nameMode = typeof input?.name === "string" && input.name.trim().length > 0;
    const firstLast = nameMode ? parseNameToFirstLast(String(input.name)) : null;
    if (nameMode && !firstLast) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Nom invalide. Saisissez au minimum 'Prénom Nom'.",
          },
        },
        { status: 400 }
      );
    }

    // Plan limits (backend-enforced) - utilise les limites définies dans PLAN_LIMITS
    if (user.role !== "ADMIN") {
      const plan = (user.garage?.plan as Plan) || "FREE";
      const limit = PLAN_LIMITS[plan].clients;
      if (limit !== Infinity) {
        const count = await prisma.client.count({ where: { garageId: targetGarageId, deletedAt: null } });
        if (count >= limit) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "LIMIT_REACHED",
                message: `Vous avez atteint la limite de ${limit} clients sur le plan Gratuit. ${FREE_UPGRADE_MESSAGE}`,
              },
            },
            { status: 403 }
          );
        }
      }
    }

    const client = await prisma.$transaction(async (tx) => {
      // Chiffrer les données sensibles
      const firstName = encrypt(nameMode ? firstLast!.firstName : input.firstName);
      const lastName = encrypt(nameMode ? firstLast!.lastName : input.lastName);
      const email = cleanOptional(input.email) ? encrypt(cleanOptional(input.email)!) : null;
      const phone = cleanOptional(input.phone) ? encrypt(cleanOptional(input.phone)!) : null;
      const address = cleanOptional(input.address) ? encrypt(cleanOptional(input.address)!) : null;
      const notes = cleanOptional(input.notes) ? encrypt(cleanOptional(input.notes)!) : null;

      const created = await tx.client.create({
        data: {
          garageId: targetGarageId,
          firstName,
          lastName,
          email,
          phone,
          address,
          notes,
          vatProfile: vat.vatProfile,
          vatRateOverride: vat.vatRateOverride,
        },
      });

      await tx.auditLog.create({
        data: {
          garageId: targetGarageId,
          userId: user.id,
          action: "CLIENT_CREATE",
          entityType: "Client",
          entityId: String(created.id),
          metadata: { email: created.email ?? null },
        },
      });

      return created;
    });

    return NextResponse.json(success(client), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/clients :", err);
    return toErrorResponse(err);
  }
}
