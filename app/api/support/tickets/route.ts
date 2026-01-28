/**
 * SUPPORT-OMNI-01: Support Tickets API
 * SUPPORT-SLA-01: Auto-priority + SLA tracking
 * AI-AUTO-TRIAGE-02: Auto-triage at creation
 * POST - Create a new support ticket
 * GET - List my tickets (scoped to garageId)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantIdWithAdminOverride } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { checkGarageRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rateLimit";
import {
  SUPPORT_RATE_LIMITS,
  sanitizeMessage,
  sanitizeSubject,
  sendTicketCreatedEmail,
  sendTicketAcknowledgmentEmail,
  buildWhatsAppUrl,
  calculateSlaTarget,
  sendUrgentTicketEmail,
} from "@/lib/support";
import { applyTriageToTicket, applyRuleBasedTriage } from "@/lib/support/triage";
import type { SupportCategory, SupportPriority, SupportChannel } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validation
const VALID_CATEGORIES: SupportCategory[] = ["BUG", "BILLING", "FEATURE", "LEGAL", "OTHER"];
const VALID_CHANNELS: SupportChannel[] = ["FORM", "EMAIL", "WHATSAPP"];

// ============================================
// POST - Create a new ticket
// ============================================

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    // Admin can create tickets too - use their emulated garage or a special admin garage
    let garageId = getTenantIdWithAdminOverride(user, req);
    
    // For admins without an emulated garage, we need a garageId for the ticket
    // Either require emulation or create a special admin ticket
    if (!garageId) {
      if (user.role === "ADMIN") {
        // For now, require admin to emulate a garage when creating tickets
        throw new RouteError(400, "TENANT_REQUIRED", "Sélectionnez un garage à émuler pour créer un ticket");
      }
      throw new RouteError(400, "TENANT_REQUIRED", "Garage invalide");
    }

    // Rate limit by garage + IP
    const ip = getClientIp(req);
    const rl = await checkGarageRateLimit(
      garageId,
      `ticket_create:${ip}`,
      SUPPORT_RATE_LIMITS.CREATE_TICKET.limit,
      SUPPORT_RATE_LIMITS.CREATE_TICKET.windowSec
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMIT", message: "Trop de tickets créés. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await req.json() as {
      subject: string;
      category?: SupportCategory;
      priority?: SupportPriority;
      channel?: SupportChannel;
      message: string;
    };

    // Validation
    if (!body.subject || typeof body.subject !== "string" || body.subject.trim().length === 0) {
      throw new RouteError(400, "BAD_REQUEST", "Sujet requis");
    }
    if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      throw new RouteError(400, "BAD_REQUEST", "Message requis");
    }

    const subject = sanitizeSubject(body.subject);
    const message = sanitizeMessage(body.message);
    const channel = body.channel && VALID_CHANNELS.includes(body.channel) ? body.channel : "FORM";
    
    // AI-AUTO-TRIAGE-02: Apply rule-based triage for initial values
    const ruleTriage = applyRuleBasedTriage({ subject, message });
    
    // User can override category but not priority (auto-calculated for SLA)
    const category: SupportCategory = body.category && VALID_CATEGORIES.includes(body.category) 
      ? body.category 
      : ruleTriage.category;
    
    // Use rule-based priority initially, may be refined by AI triage
    const priority: SupportPriority = ruleTriage.priority;
    
    // SUPPORT-SLA-01: Calculate SLA target
    const slaTargetAt = calculateSlaTarget(priority);

    if (subject.length < 3) {
      throw new RouteError(400, "BAD_REQUEST", "Sujet trop court (min 3 caractères)");
    }
    if (message.length < 10) {
      throw new RouteError(400, "BAD_REQUEST", "Message trop court (min 10 caractères)");
    }

    // Get garage info for email notification (no PII in logs)
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: { name: true, email: true },
    });

    // Create ticket and first message in transaction
    const now = new Date();
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          garageId,
          createdByUserId: user.id,
          requesterName: user.email.split("@")[0], // Use email prefix as name
          requesterEmail: user.email,
          channel,
          subject,
          category,
          priority,
          status: "OPEN",
          // SUPPORT-SLA-01: SLA tracking fields
          slaTargetAt,
          lastRequesterMessageAt: now,
          lastReplyAt: now,
        },
      });

      await tx.supportMessage.create({
        data: {
          ticketId: newTicket.id,
          authorType: "REQUESTER",
          authorUserId: user.id,
          message,
        },
      });

      return newTicket;
    });

    // AI-AUTO-TRIAGE-02: Apply full triage (rules + AI) async - never blocks response
    void applyTriageToTicket(ticket.id, subject, message, garageId);

    // Send email notification to support team (async, don't block response)
    void sendTicketCreatedEmail({
      ticketId: ticket.id,
      subject,
      category,
      priority,
      message,
      requesterName: user.email.split("@")[0],
      garageName: garage?.name,
      garageId,
    });

    // SUPPORT-SLA-01: Send urgent ticket notification
    if (priority === "URGENT") {
      void sendUrgentTicketEmail({
        ticketId: ticket.id,
        subject,
        requesterName: user.email.split("@")[0],
        garageName: garage?.name,
        message,
      });
    }

    // Send acknowledgment to user if email available
    if (user.email) {
      void sendTicketAcknowledgmentEmail({
        ticketId: ticket.id,
        to: user.email,
        requesterName: user.email.split("@")[0],
        subject,
      });
    }

    // Build WhatsApp URL for convenience
    const whatsappUrl = buildWhatsAppUrl(ticket.id, garage?.name);

    return NextResponse.json(
      success({
        id: ticket.id,
        status: ticket.status,
        whatsappUrl,
        message: "Ticket créé avec succès",
      }),
      { status: 201 }
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}

// ============================================
// GET - List my tickets
// ============================================

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantIdWithAdminOverride(user, req);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));

    // Admin sans garage émulé = voir tous les tickets
    const where: { garageId?: number; status?: "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED" } = 
      garageId ? { garageId } : {};
    if (status && ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"].includes(status)) {
      where.status = status as "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          channel: true,
          lastReplyAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json(success({ tickets, total, limit, offset }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
