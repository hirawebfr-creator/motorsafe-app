import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import {
  normalizePlate,
  lookupPlateFR,
  getCurrentMonthKey,
  getMonthlyQuota,
  type VehiclePrefill,
} from "@/lib/vehicleLookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_DAYS = 30;
const PROVIDER = "apiplaqueimmatriculation";

const LookupSchema = z.object({
  immatriculation: z.string().trim().min(1).max(20),
  forceRefresh: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Pour les admins sans garageId, on fait le lookup sans cache/quota
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
      try {
        const monthKey = getCurrentMonthKey();
        const monthlyLimit = getMonthlyQuota(garageId);
        
        const usage = await prisma.vehicleLookupUsage.findUnique({
          where: { garageId_monthKey: { garageId, monthKey } },
        });
        
        const currentCount = usage?.count ?? 0;
        
        if (currentCount >= monthlyLimit) {
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
                message: `Quota mensuel atteint (${monthlyLimit} recherches/mois). Réessayez le mois prochain ou saisissez les informations manuellement.`,
              },
              quota: {
                current: currentCount,
                limit: monthlyLimit,
                remaining: 0,
              },
            },
            { status: 429 }
          );
        }
      } catch {
        // Usage table might not exist yet, continue to API call
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
        const monthKey = getCurrentMonthKey();
        await prisma.vehicleLookupUsage.upsert({
          where: { garageId_monthKey: { garageId, monthKey } },
          create: { garageId, monthKey, count: 1 },
          update: { count: { increment: 1 } },
        });
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
        const monthKey = getCurrentMonthKey();
        const monthlyLimit = getMonthlyQuota(garageId);
        const usage = await prisma.vehicleLookupUsage.findUnique({
          where: { garageId_monthKey: { garageId, monthKey } },
        });
        const currentCount = usage?.count ?? 0;
        quotaInfo = {
          current: currentCount,
          limit: monthlyLimit,
          remaining: Math.max(0, monthlyLimit - currentCount),
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
