/**
 * SUPPORT-SLA-01: SLA Monitor Cron
 * POST /api/cron/support-sla
 * 
 * Protected by CRON_SECRET.
 * Runs every 15 minutes to:
 * 1. Find tickets with breached SLA
 * 2. Mark them as breached
 * 3. Log SystemEvent
 * 4. Send email notification (rate-limited)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSlaBreachEmail, SUPPORT_RATE_LIMITS } from "@/lib/support";
import { checkIpRateLimit } from "@/lib/rateLimit";

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
    console.warn("[SLA-Monitor] CRON_SECRET not configured");
    return false;
  }

  return secret === expected;
}

/**
 * Log system event for SLA breach
 */
async function logSystemEvent(
  status: "ok" | "degraded" | "down",
  message: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.systemEvent.create({
      data: {
        type: "support_sla",
        service: "system",
        status,
        message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (err) {
    console.error("[SLA-Monitor] Failed to log system event:", err);
  }
}

export async function POST(req: Request) {
  // Validate cron secret
  if (!validateCronSecret(req)) {
    await logSystemEvent("down", "Unauthorized SLA monitor attempt", {});
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const now = new Date();

  try {
    // Find tickets that have breached SLA but not yet marked
    const breachedTickets = await prisma.supportTicket.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        slaTargetAt: { lt: now },
        slaBreachedAt: null,
      },
      select: {
        id: true,
        subject: true,
        priority: true,
        slaTargetAt: true,
        garage: { select: { name: true } },
      },
      take: 50, // Limit per run
    });

    if (breachedTickets.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No SLA breaches found",
        checked: 0,
        breached: 0,
        durationMs: Date.now() - startTime,
      });
    }

    let emailsSent = 0;
    let emailsSkipped = 0;

    // Process each breached ticket
    for (const ticket of breachedTickets) {
      // Mark as breached
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { slaBreachedAt: now },
      });

      // Log system event (no PII - just ticket ID and priority)
      await logSystemEvent("degraded", `SLA breach: ${ticket.priority} ticket`, {
        ticketId: ticket.id,
        priority: ticket.priority,
      });

      // Rate-limit email notifications (use a fake request for rate limiting)
      const rl = await checkIpRateLimit(
        req,
        "sla_alert_email",
        SUPPORT_RATE_LIMITS.SLA_ALERT_EMAIL.limit,
        SUPPORT_RATE_LIMITS.SLA_ALERT_EMAIL.windowSec
      );

      if (rl.allowed) {
        const breachDelayMs = now.getTime() - (ticket.slaTargetAt?.getTime() || now.getTime());
        const breachDelayMinutes = Math.round(breachDelayMs / 60000);

        await sendSlaBreachEmail({
          ticketId: ticket.id,
          subject: ticket.subject,
          priority: ticket.priority,
          slaTargetAt: ticket.slaTargetAt!,
          breachDelayMinutes,
          garageName: ticket.garage?.name,
        });
        emailsSent++;
      } else {
        emailsSkipped++;
      }
    }

    console.log(`[SLA-Monitor] Processed ${breachedTickets.length} breaches, ${emailsSent} emails sent, ${emailsSkipped} skipped (rate-limit)`);

    return NextResponse.json({
      ok: true,
      message: "SLA monitor completed",
      breached: breachedTickets.length,
      emailsSent,
      emailsSkipped,
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[SLA-Monitor] Error:", message);
    await logSystemEvent("down", `SLA monitor failed: ${message}`, {});

    return NextResponse.json(
      { ok: false, error: "SLA monitor failed" },
      { status: 500 }
    );
  }
}
