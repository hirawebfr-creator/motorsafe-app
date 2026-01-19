/**
 * SUPPORT-OMNI-01: Admin Support Tickets API
 * AI-AUTO-TRIAGE-02: Added triage fields + tags filter
 * GET - List all tickets with filters (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import type { SupportTicketStatus, SupportPriority, SupportCategory, TriageSource } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") as SupportTicketStatus | null;
    const priority = url.searchParams.get("priority") as SupportPriority | null;
    const category = url.searchParams.get("category") as SupportCategory | null;
    const garageId = url.searchParams.get("garageId");
    const search = url.searchParams.get("search");
    // AI-AUTO-TRIAGE-02: Tags filter
    const tags = url.searchParams.get("tags"); // comma-separated
    const triageSource = url.searchParams.get("triageSource") as TriageSource | null;
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build where clause
    interface TicketWhere {
      status?: SupportTicketStatus;
      priority?: SupportPriority;
      category?: SupportCategory;
      garageId?: number | null;
      tags?: { hasSome: string[] };
      autoTriageSource?: TriageSource;
      OR?: { subject: { contains: string; mode: "insensitive" } }[];
    }
    const where: TicketWhere = {};

    if (status && ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"].includes(status)) {
      where.status = status;
    }
    if (priority && ["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority)) {
      where.priority = priority;
    }
    if (category && ["BUG", "BILLING", "FEATURE", "LEGAL", "OTHER"].includes(category)) {
      where.category = category;
    }
    if (garageId) {
      const gid = parseInt(garageId, 10);
      if (Number.isFinite(gid)) {
        where.garageId = gid;
      }
    }
    if (search && search.trim().length > 0) {
      where.OR = [{ subject: { contains: search.trim(), mode: "insensitive" } }];
    }
    // AI-AUTO-TRIAGE-02: Tags filter
    if (tags && tags.trim().length > 0) {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList };
      }
    }
    if (triageSource && ["RULES", "AI"].includes(triageSource)) {
      where.autoTriageSource = triageSource;
    }

    // Build orderBy
    const validSortFields = ["createdAt", "updatedAt", "lastReplyAt", "priority", "status"];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy = { [orderByField]: sortOrder };

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          channel: true,
          requesterName: true,
          requesterEmail: true,
          garageId: true,
          lastReplyAt: true,
          slaTargetAt: true,
          slaBreachedAt: true,
          lastRequesterMessageAt: true,
          lastAdminMessageAt: true,
          // AI-AUTO-TRIAGE-02: Triage fields
          autoTriageSource: true,
          autoTriageAt: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          garage: {
            select: { name: true },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    // Transform for response (no PII in logs)
    const data = tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      channel: t.channel,
      requesterName: t.requesterName,
      requesterEmail: t.requesterEmail,
      garageId: t.garageId,
      garageName: t.garage?.name || null,
      garage: t.garage,
      lastReplyAt: t.lastReplyAt,
      slaTargetAt: t.slaTargetAt,
      slaBreachedAt: t.slaBreachedAt,
      lastRequesterMessageAt: t.lastRequesterMessageAt,
      lastAdminMessageAt: t.lastAdminMessageAt,
      // AI-AUTO-TRIAGE-02: Triage fields
      autoTriageSource: t.autoTriageSource,
      autoTriageAt: t.autoTriageAt,
      tags: t.tags,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json(success({ tickets: data, total, limit, offset }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
