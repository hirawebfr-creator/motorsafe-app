/**
 * SUPPORT-OMNI-01: Admin Support Tickets API
 * GET - List all tickets with filters (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import type { SupportTicketStatus, SupportPriority, SupportCategory } from "@prisma/client";

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
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build where clause
    const where: {
      status?: SupportTicketStatus;
      priority?: SupportPriority;
      category?: SupportCategory;
      garageId?: number | null;
      OR?: { subject: { contains: string; mode: "insensitive" } }[];
    } = {};

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
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json(success({ tickets: data, total, limit, offset }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
