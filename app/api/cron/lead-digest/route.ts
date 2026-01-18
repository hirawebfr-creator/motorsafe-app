/**
 * LEADS-CRM-01: Daily Lead Digest Cron
 * 
 * POST /api/cron/lead-digest
 * 
 * Sends daily digest email to admin users with:
 * - Leads to follow up today
 * - Overdue leads (past follow-up date)
 * - Pipeline stats
 * 
 * Schedule: 0 9 * * * (daily at 09:00 Europe/Paris)
 * Protected by CRON_SECRET header
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLeadDigestEmail, type LeadDigestItem } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Validate cron secret
 */
function validateCronSecret(req: Request): boolean {
  const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.CRON_SECRET;
  
  if (!expected) {
    console.warn("[Cron Lead Digest] CRON_SECRET not configured");
    return false;
  }
  
  return secret === expected;
}

export async function POST(req: Request) {
  // Validate cron secret
  if (!validateCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get leads to follow up today
    const leadsToday = await prisma.lead.findMany({
      where: {
        anonymizedAt: null,
        status: {
          notIn: ["WON", "LOST"],
        },
        nextFollowUpAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        garageName: true,
        city: true,
        contactName: true,
        contactPhone: true,
        status: true,
        nextFollowUpAt: true,
        lastContactedAt: true,
      },
      orderBy: {
        garageName: "asc",
      },
    });

    // Get overdue leads (past follow-up date)
    const leadsOverdue = await prisma.lead.findMany({
      where: {
        anonymizedAt: null,
        status: {
          notIn: ["WON", "LOST"],
        },
        nextFollowUpAt: {
          lt: today,
        },
      },
      select: {
        id: true,
        garageName: true,
        city: true,
        contactName: true,
        contactPhone: true,
        status: true,
        nextFollowUpAt: true,
        lastContactedAt: true,
      },
      orderBy: {
        nextFollowUpAt: "asc",
      },
    });

    // Get stats
    const [statsTotal, statsInProgress] = await Promise.all([
      prisma.lead.count({
        where: { anonymizedAt: null },
      }),
      prisma.lead.count({
        where: {
          anonymizedAt: null,
          status: {
            in: ["CONTACTED", "DEMO_SCHEDULED", "DEMO_DONE", "TRIAL_STARTED"],
          },
        },
      }),
    ]);

    // Get admin users to send digest to
    const adminUsers = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
      },
    });

    // Also check for LEAD_DIGEST_EMAILS env var for additional recipients
    const additionalEmails = process.env.LEAD_DIGEST_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean) || [];

    const allRecipients = [
      ...adminUsers.map((u) => u.email),
      ...additionalEmails,
    ];

    // Remove duplicates
    const uniqueRecipients = [...new Set(allRecipients)];

    if (uniqueRecipients.length === 0) {
      console.log("[Cron Lead Digest] No recipients configured");
      return NextResponse.json({
        success: true,
        message: "No recipients configured",
        duration: Date.now() - startTime,
      });
    }

    // Format leads for email
    const formatLead = (lead: typeof leadsToday[0]): LeadDigestItem => ({
      id: lead.id,
      garageName: lead.garageName,
      city: lead.city,
      contactName: lead.contactName,
      contactPhone: lead.contactPhone,
      status: lead.status,
      nextFollowUpAt: lead.nextFollowUpAt!,
      daysSinceContact: lead.lastContactedAt 
        ? Math.floor((Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    });

    const formattedToday = leadsToday.map(formatLead);
    const formattedOverdue = leadsOverdue.map(formatLead);

    // Send digest to all recipients
    const results = await Promise.all(
      uniqueRecipients.map(async (email) => {
        const result = await sendLeadDigestEmail({
          to: email,
          leadsToday: formattedToday,
          leadsOverdue: formattedOverdue,
          statsTotal,
          statsInProgress,
        });
        return { email, ...result };
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[Cron Lead Digest] Sent ${successful}/${results.length} digests`, {
      leadsToday: leadsToday.length,
      leadsOverdue: leadsOverdue.length,
      recipients: uniqueRecipients.length,
    });

    return NextResponse.json({
      success: true,
      stats: {
        leadsToday: leadsToday.length,
        leadsOverdue: leadsOverdue.length,
        statsTotal,
        statsInProgress,
        emailsSent: successful,
        emailsFailed: failed,
      },
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error("[Cron Lead Digest] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET for health check
export async function GET() {
  return NextResponse.json({
    name: "lead-digest",
    schedule: "0 9 * * * (daily at 09:00)",
    description: "Daily lead follow-up digest email",
  });
}
