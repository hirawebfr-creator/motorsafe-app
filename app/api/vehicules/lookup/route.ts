import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import {
  normalizePlate,
  lookupPlateFR,
  type VehiclePrefill,
} from "@/lib/vehicleLookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_DAYS = 30;

const LookupSchema = z.object({
  immatriculation: z.string().trim().min(1).max(20),
  forceRefresh: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Pour les admins sans garageId, on fait le lookup sans cache
    const garageId = user.garageId;

    const body = await req.json().catch(() => null);
    const parsed = LookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Plaque invalide",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { immatriculation, forceRefresh } = parsed.data;
    const plateNormalized = normalizePlate(immatriculation);

    if (!plateNormalized) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_PLATE", message: "Plaque vide ou invalide." } },
        { status: 400 }
      );
    }

    // Check cache first (unless forceRefresh or admin without garageId)
    if (!forceRefresh && garageId) {
      const cached = await prisma.vehicleLookupCache.findUnique({
        where: {
          garageId_plateNormalized_provider: {
            garageId,
            plateNormalized,
            provider: "apiplaqueimmatriculation",
          },
        },
      });

      if (cached && cached.expiresAt > new Date()) {
        // Log cache hit
        await prisma.vehicleLookupLog.create({
          data: {
            garageId,
            plateNormalized,
            provider: "apiplaqueimmatriculation",
            success: true,
            source: "cache",
          },
        });

        const data = JSON.parse(cached.dataJson) as VehiclePrefill;
        return NextResponse.json({
          ok: true,
          data: { source: "cache", data },
        });
      }
    }

    // Call external API
    const result = await lookupPlateFR(plateNormalized);

    // Log the lookup (only if garageId exists)
    if (garageId) {
      await prisma.vehicleLookupLog.create({
        data: {
          garageId,
          plateNormalized,
          provider: "apiplaqueimmatriculation",
          success: result.success,
          source: "api",
          errorCode: result.success ? null : result.error.code,
        },
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.code === "TOKEN_MISSING" ? 500 : 400 }
      );
    }

    // Update cache (only if garageId exists)
    if (garageId) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

      await prisma.vehicleLookupCache.upsert({
        where: {
          garageId_plateNormalized_provider: {
            garageId,
            plateNormalized,
            provider: "apiplaqueimmatriculation",
          },
        },
        create: {
          garageId,
          plateNormalized,
          provider: "apiplaqueimmatriculation",
          dataJson: JSON.stringify(result.data),
          expiresAt,
        },
        update: {
          dataJson: JSON.stringify(result.data),
          fetchedAt: new Date(),
          expiresAt,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: { source: "api", data: result.data },
    });
  } catch (err) {
    console.error("Erreur API POST /api/vehicules/lookup :", err);
    return toErrorResponse(err);
  }
}
