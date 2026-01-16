/**
 * Rate Limiting Helper (DB-based, MVP)
 * Uses Prisma RateLimitBucket model for persistence
 * Fail-open design: if DB unavailable, allow request but log error
 */

import { prisma } from "@/lib/prisma";

// ============================================
// Types
// ============================================

export interface RateLimitConfig {
  /** Unique key for this rate limit (e.g., "ip:1.2.3.4:sign_get") */
  key: string;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Requests remaining in the window */
  remaining: number;
  /** When the window resets (Date) */
  resetAt: Date;
  /** Current count in the window */
  current: number;
  /** The limit that was applied */
  limit: number;
}

// ============================================
// IP Extraction
// ============================================

/**
 * Extract client IP from request headers
 * Supports x-forwarded-for, x-real-ip, cf-connecting-ip (Cloudflare)
 */
export function getClientIp(req: Request): string {
  // Cloudflare
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.split(",")[0].trim();

  // Standard proxy headers
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback (usually localhost in dev)
  return "unknown";
}

// ============================================
// Test Mode Check
// ============================================

/**
 * Check if rate limiting should be disabled (test mode)
 */
function isRateLimitDisabled(): boolean {
  return process.env.DISABLE_RATE_LIMIT === "true" || process.env.NODE_ENV === "test";
}

// ============================================
// Rate Limit Check (DB-based)
// ============================================

/**
 * Check and increment rate limit counter
 * Uses atomic upsert to prevent race conditions
 * Fail-open: returns allowed=true if DB errors (logs the error)
 * Disabled in test mode (DISABLE_RATE_LIMIT=true)
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { key, limit, windowSec } = config;

  // Skip rate limiting in test mode
  if (isRateLimitDisabled()) {
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSec * 1000),
      current: 0,
      limit,
    };
  }

  // Calculate window start (floor to window boundary)
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const resetAt = new Date(windowStartMs + windowMs);

  try {
    // Atomic upsert: increment existing or create new with count=1
    const bucket = await prisma.rateLimitBucket.upsert({
      where: {
        key_windowStart: { key, windowStart },
      },
      create: {
        key,
        windowStart,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    const allowed = bucket.count <= limit;
    const remaining = Math.max(0, limit - bucket.count);

    return {
      allowed,
      remaining,
      resetAt,
      current: bucket.count,
      limit,
    };
  } catch (err) {
    // Fail-open: allow request but log error
    console.error("[RateLimit] DB error, failing open:", err);
    return {
      allowed: true,
      remaining: limit,
      resetAt,
      current: 0,
      limit,
    };
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Check rate limit for a public endpoint by IP
 * @param req - Request object
 * @param endpoint - Endpoint identifier (e.g., "sign_get", "download_pdf")
 * @param limit - Max requests
 * @param windowSec - Window size in seconds
 */
export async function checkIpRateLimit(
  req: Request,
  endpoint: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const key = `ip:${ip}:${endpoint}`;
  return checkRateLimit({ key, limit, windowSec });
}

/**
 * Check rate limit for a garage action
 * @param garageId - Garage ID
 * @param action - Action identifier (e.g., "send_signature")
 * @param limit - Max requests
 * @param windowSec - Window size in seconds
 */
export async function checkGarageRateLimit(
  garageId: number,
  action: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const key = `garage:${garageId}:${action}`;
  return checkRateLimit({ key, limit, windowSec });
}

/**
 * Check rate limit for an intervention action
 * @param interventionId - Intervention ID
 * @param action - Action identifier
 * @param limit - Max requests
 * @param windowSec - Window size in seconds
 */
export async function checkInterventionRateLimit(
  interventionId: string,
  action: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const key = `intervention:${interventionId}:${action}`;
  return checkRateLimit({ key, limit, windowSec });
}

// ============================================
// Rate Limit Headers
// ============================================

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
  };
}

// ============================================
// Cleanup (optional, can be run as cron job)
// ============================================

/**
 * Delete old rate limit buckets (cleanup)
 * Should be called periodically (e.g., daily cron job)
 * @param olderThanHours - Delete buckets older than this many hours
 */
export async function cleanupOldBuckets(olderThanHours = 24): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  
  try {
    const result = await prisma.rateLimitBucket.deleteMany({
      where: {
        windowStart: { lt: cutoff },
      },
    });
    return result.count;
  } catch (err) {
    console.error("[RateLimit] Cleanup error:", err);
    return 0;
  }
}
