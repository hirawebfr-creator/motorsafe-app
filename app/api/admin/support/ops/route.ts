/**
 * GET /api/admin/support/ops
 * 
 * SUPPORT-OPS-DASH-01: Support Operations Dashboard API
 * Returns KPIs, timeseries, breakdowns, queues, and KB suggestions.
 * 
 * Admin-only. No PII returned - only aggregates.
 * 
 * Query params:
 * - range: "today" | "7d" | "30d" (default: "7d")
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Range configurations
const RANGE_CONFIG = {
  today: { days: 1, label: "Aujourd'hui" },
  "7d": { days: 7, label: "7 derniers jours" },
  "30d": { days: 30, label: "30 derniers jours" },
} as const;

type RangeKey = keyof typeof RANGE_CONFIG;

export async function GET(req: Request) {
  try {
    // 1. Auth check - admin only
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    // 2. Parse range
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get("range") || "7d";
    const range: RangeKey = rangeParam in RANGE_CONFIG ? (rangeParam as RangeKey) : "7d";
    const { days } = RANGE_CONFIG[range];

    // 3. Calculate date boundaries
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 4. Fetch tickets in range
    const ticketsInRange = await prisma.supportTicket.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        category: true,
        priority: true,
        status: true,
        tags: true,
        slaTargetAt: true,
        slaBreachedAt: true,
        createdAt: true,
        updatedAt: true,
        lastAdminMessageAt: true,
        messages: {
          where: { authorType: "ADMIN" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    // 5. Calculate KPIs
    const totalCreated = ticketsInRange.length;
    const resolved = ticketsInRange.filter(
      (t) => t.status === "RESOLVED" || t.status === "CLOSED"
    );
    const totalResolved = resolved.length;

    // First Response Time (FRT) - avg time to first admin message
    const frtValues: number[] = [];
    for (const t of ticketsInRange) {
      if (t.messages.length > 0) {
        const firstAdminMsg = t.messages[0].createdAt;
        const frt = firstAdminMsg.getTime() - t.createdAt.getTime();
        frtValues.push(frt);
      }
    }
    const avgFrtMs = frtValues.length > 0
      ? frtValues.reduce((a, b) => a + b, 0) / frtValues.length
      : null;

    // Resolution Time - time from creation to resolved status
    const resolutionTimes: number[] = [];
    for (const t of resolved) {
      const resTime = t.updatedAt.getTime() - t.createdAt.getTime();
      resolutionTimes.push(resTime);
    }
    const avgResolutionMs = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : null;

    // SLA stats
    const ticketsWithSla = ticketsInRange.filter((t) => t.slaTargetAt);
    const slaBreached = ticketsWithSla.filter((t) => t.slaBreachedAt).length;
    const slaRespected = ticketsWithSla.length - slaBreached;
    const slaRespectedPct = ticketsWithSla.length > 0
      ? Math.round((slaRespected / ticketsWithSla.length) * 100)
      : 100;

    // 6. Timeseries (tickets per day)
    const timeseries: { date: string; created: number; resolved: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      
      const createdOnDay = ticketsInRange.filter((t) => {
        const tDate = t.createdAt.toISOString().split("T")[0];
        return tDate === dateStr;
      }).length;
      
      const resolvedOnDay = resolved.filter((t) => {
        const tDate = t.updatedAt.toISOString().split("T")[0];
        return tDate === dateStr;
      }).length;
      
      timeseries.push({ date: dateStr, created: createdOnDay, resolved: resolvedOnDay });
    }

    // 7. Breakdown by category
    const byCategory = Object.entries(
      ticketsInRange.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

    // 8. Breakdown by priority
    const byPriority = Object.entries(
      ticketsInRange.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

    // 9. Top tags
    const tagCounts: Record<string, number> = {};
    for (const t of ticketsInRange) {
      for (const tag of t.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 10. Queue counts (current state, not filtered by range)
    const [slaBreachedOpen, urgentOpen, backlogCount] = await Promise.all([
      // Tickets with breached SLA still open
      prisma.supportTicket.count({
        where: {
          slaBreachedAt: { not: null },
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
      // Urgent tickets still open
      prisma.supportTicket.count({
        where: {
          priority: "URGENT",
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
      // Total backlog (open + in progress)
      prisma.supportTicket.count({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
    ]);

    // Follow-ups due: tickets waiting on customer > 48h
    const followUpThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const followUpsDue = await prisma.supportTicket.count({
      where: {
        status: "WAITING_CUSTOMER",
        updatedAt: { lt: followUpThreshold },
      },
    });

    // 11. KB Suggestions - check which top tags have no KB article
    const kbSuggestions: Array<{
      tag: string;
      count: number;
      reason: string;
      suggestTitle: string;
    }> = [];

    if (topTags.length > 0) {
      // Get all KB article slugs and tags
      const kbArticles = await prisma.kbArticle.findMany({
        where: { isPublished: true },
        select: { slug: true, title: true, tags: true },
      });

      const kbSlugsAndTags = new Set<string>();
      for (const article of kbArticles) {
        kbSlugsAndTags.add(article.slug.toLowerCase());
        kbSlugsAndTags.add(article.title.toLowerCase());
        // Parse tags from JSON
        const articleTags = (article.tags as string[] | null) || [];
        for (const t of articleTags) {
          kbSlugsAndTags.add(t.toLowerCase());
        }
      }

      // Check each top tag
      for (const { key: tag, count } of topTags.slice(0, 5)) {
        const tagLower = tag.toLowerCase();
        const hasKb = kbSlugsAndTags.has(tagLower) ||
          Array.from(kbSlugsAndTags).some((s) => s.includes(tagLower));
        
        if (!hasKb && count >= 3) {
          kbSuggestions.push({
            tag,
            count,
            reason: `${count} tickets avec ce tag, aucun article KB trouvé`,
            suggestTitle: `Guide: ${tag.charAt(0).toUpperCase() + tag.slice(1)}`,
          });
        }
      }
    }

    // 12. Format response
    return NextResponse.json({
      range: RANGE_CONFIG[range].label,
      kpis: {
        ticketsCreated: totalCreated,
        ticketsResolved: totalResolved,
        avgFirstResponseTimeMs: avgFrtMs,
        avgResolutionTimeMs: avgResolutionMs,
        slaRespectedPct,
        slaBreachedCount: slaBreached,
        backlog: backlogCount,
      },
      timeseries,
      breakdown: {
        byCategory,
        byPriority,
        topTags,
      },
      queues: {
        slaBreached: slaBreachedOpen,
        urgentOpen,
        followUpsDue,
        totalBacklog: backlogCount,
      },
      kbSuggestions,
    });
  } catch (err) {
    console.error("[API:Support-Ops] Error:", err);
    return toErrorResponse(err);
  }
}
