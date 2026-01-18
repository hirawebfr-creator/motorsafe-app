import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey, checkQuota, incrementLookupUsage } from "@/lib/entitlements";
import { z } from "zod";
import {
  normalizePlate,
  lookupPlateFR,
  type VehiclePrefill,
} from "@/lib/vehicleLookup";
import { checkIpRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 60 requests per hour per garage (in addition to monthly quota)
const RATE_LIMIT = 60;
const RATE_WINDOW_SEC = 60 * 60;

const CACHE_TTL_DAYS = 30;
const PROVIDER = "apiplaqueimmatriculation";

const LookupSchema = z.object({
  immatriculation: z.string().trim().min(1).max(20),
  forceRefresh: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Feature gate: VEHICLE_LOOKUP required
    if (user.role !== "ADMIN") {
      await requireFeature(user.garageId ?? -1, FeatureKey.VEHICLE_LOOKUP);
    }
    
    // Pour les admins sans garageId, on fait le lookup sans cache/quota
    const garageId = user.garageId;
    
    // Rate limit check (per garage, in addition to monthly quota)
    const rl = await checkIpRateLimit(req, `vehicle_lookup:${garageId ?? 'admin'}`, RATE_LIMIT, RATE_WINDOW_SEC);
    if (!rl.allowed) {
      throw new RouteError(429, "RATE_LIMITED", "Trop de recherches de plaques. Réessayez plus tard.");
    }

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

    // ============================
    // 1. Check cache first (unless forceRefresh or admin without garageId)
    // ============================
    if (!forceRefresh && garageId) {
      try {
        const cached = await prisma.vehicleLookupCache.findUnique({
          where: {
            garageId_plateNormalized_provider: {
              garageId,
              plateNormalized,
              provider: PROVIDER,
            },
          },
        });

        if (cached && cached.expiresAt > new Date()) {
          // Log cache hit (best effort)
          try {
            await prisma.vehicleLookupLog.create({
              data: {
                garageId,
                plateNormalized,
                provider: PROVIDER,
                success: true,
                source: "cache",
                latencyMs: 0,
              },
            });
          } catch { /* ignore */ }

          const data = JSON.parse(cached.dataJson) as VehiclePrefill;
          return NextResponse.json({
            ok: true,
            data: { source: "cache", data },
          });
        }
      } catch {
        // Cache table might not exist yet, continue to API call
      }
    }

    // ============================
    // 2. Check quota before API call (only for garages)
    // ============================
    if (garageId) {
      const quotaCheck = await checkQuota(garageId, "vehicleLookupPerMonth");
      
      if (!quotaCheck.allowed) {
        // Log quota exceeded
        try {
          await prisma.vehicleLookupLog.create({
            data: {
              garageId,
              plateNormalized,
              provider: PROVIDER,
              success: false,
              source: "api",
              errorCode: "QUOTA_EXCEEDED",
            },
          });
        } catch { /* ignore */ }
        
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "QUOTA_EXCEEDED",
              message: `Quota mensuel atteint (${quotaCheck.limit} recherches/mois). Réessayez le mois prochain ou passez au plan supérieur.`,
            },
            quota: {
              current: quotaCheck.used,
              limit: quotaCheck.limit,
              remaining: 0,
            },
          },
          { status: 429 }
        );
      }
    }

    // ============================
    // 3. Call external API with latency measurement
    // ============================
    const startTime = Date.now();
    const result = await lookupPlateFR(plateNormalized);
    const latencyMs = Date.now() - startTime;

    // ============================
    // 4. Log the lookup (only if garageId exists)
    // ============================
    if (garageId) {
      try {
        await prisma.vehicleLookupLog.create({
          data: {
            garageId,
            plateNormalized,
            provider: PROVIDER,
            success: result.success,
            source: "api",
            errorCode: result.success ? null : result.error.code,
            latencyMs,
          },
        });
      } catch { /* ignore */ }
    }

    // ============================
    // 5. Increment usage quota on successful API call
    // ============================
    if (garageId && result.success) {
      try {
        await incrementLookupUsage(garageId);
      } catch { /* ignore */ }
    }

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.code === "TOKEN_MISSING" ? 500 : 400 }
      );
    }

    // ============================
    // 6. Update cache (only if garageId exists)
    // ============================
    if (garageId) {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

        await prisma.vehicleLookupCache.upsert({
          where: {
            garageId_plateNormalized_provider: {
              garageId,
              plateNormalized,
              provider: PROVIDER,
            },
          },
          create: {
            garageId,
            plateNormalized,
            provider: PROVIDER,
            dataJson: JSON.stringify(result.data),
            expiresAt,
          },
          update: {
            dataJson: JSON.stringify(result.data),
            fetchedAt: new Date(),
            expiresAt,
          },
        });
      } catch { /* ignore */ }
    }

    // ============================
    // 7. Return success with quota info
    // ============================
    let quotaInfo = undefined;
    if (garageId) {
      try {
        const quotaCheck = await checkQuota(garageId, "vehicleLookupPerMonth");
        quotaInfo = {
          current: quotaCheck.used,
          limit: quotaCheck.limit,
          remaining: quotaCheck.remaining,
        };
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      ok: true,
      data: { source: "api", data: result.data },
      quota: quotaInfo,
    });
  } catch (err) {
    console.error("Erreur API POST /api/vehicules/lookup :", err);
    return toErrorResponse(err);
  }
}
