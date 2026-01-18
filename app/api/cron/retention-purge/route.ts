/**
 * DATA-COMPLIANCE-01: Scheduled retention purge
 *
 * Protected by CRON_SECRET header
 * Runs daily to purge operational data older than retention limits
 *
 * Categories:
 *   - OPERATIONAL_12M: Notifications, logs, caches (12 months)
 *   - Sessions, rate limits, expired tokens
 *
 * Safety:
 *   - Dispute mode blocks purge for affected interventions
 *   - Legal minimums cannot be reduced by garage settings
 *   - Each run is logged in SystemEvent
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAllGaragesPurge } from "@/lib/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Validate cron secret
 */
function validateCronSecret(req: Request): boolean {
  const secret =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    console.warn("[RetentionPurge] CRON_SECRET not configured");
    return false;
  }

  return secret === expected;
}

/**
 * Log system event for retention purge
 */
async function logSystemEvent(
  status: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.systemEvent.create({
      data: {
        type: "retention_purge",
        service: "retention",
        status,
        message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (err) {
    console.error("[RetentionPurge] Failed to log system event:", err);
  }
}

export async function POST(req: Request) {
  const startTime = Date.now();

  // Validate cron secret
  if (!validateCronSecret(req)) {
    await logSystemEvent("down", "Unauthorized retention purge attempt", {});
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await logSystemEvent("ok", "Retention purge started", {});

    // Run purge for all garages
    const result = await runAllGaragesPurge();

    const duration = Date.now() - startTime;

    // Summarize results
    const summary = {
      totalDeleted: result.totalDeleted,
      garagesProcessed: result.garageResults.length,
      garagesWithErrors: result.garageResults.filter((r) => !r.success).length,
      globalStats: result.globalStats.map((s) => ({
        table: s.table,
        deleted: s.deleted,
      })),
      durationMs: duration,
    };

    await logSystemEvent("ok", "Retention purge completed", summary);

    // Log individual garage errors
    for (const garageResult of result.garageResults) {
      if (!garageResult.success) {
        await logSystemEvent(
          "degraded",
          `Retention purge failed for garage ${garageResult.garageId}: ${garageResult.error}`,
          { garageId: garageResult.garageId }
        );
      }
    }

    return NextResponse.json({
      success: true,
      ...summary,
      garageResults: result.garageResults.map((r) => ({
        garageId: r.garageId,
        success: r.success,
        totalDeleted: r.totalDeleted,
        skippedDueToDispute: r.skippedDueToDispute,
        error: r.error,
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logSystemEvent("down", `Retention purge failed: ${errorMessage}`, {
      durationMs: duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for manual testing (still requires secret)
 */
export async function GET(req: Request) {
  // Validate cron secret
  if (!validateCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Retention purge endpoint ready",
    usage: "POST with x-cron-secret header to run purge",
    categories: {
      EVIDENCE_10Y: [
        "SignatureRequest (SIGNED)",
        "SignatureEvent",
        "EvidenceChain",
        "InterventionRevision",
      ],
      ACCOUNTING_10Y: [
        "Invoice",
        "InvoiceLine",
        "Payment",
        "Quote",
        "QuoteLine",
        "NumberSequence",
      ],
      OPERATIONAL_12M: [
        "Notification",
        "AutomationJob (completed)",
        "AiUsageLog",
        "VehicleLookupLog",
        "SystemEvent",
      ],
      CACHE: [
        "Session (expired)",
        "RateLimitBucket (old)",
        "VehicleLookupCache (expired)",
        "DownloadToken (expired)",
      ],
    },
    protection: {
      disputeMode: "Interventions with disputeStatus=OPEN are skipped",
      legalMinimums: "Garage settings cannot reduce retention below legal requirements",
    },
  });
}
