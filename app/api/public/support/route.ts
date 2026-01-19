/**
 * SUPPORT-OMNI-01: Public Contact Form API
 * AI-AUTO-TRIAGE-02: Auto-triage at creation
 * POST - Create a support ticket from public form (no auth required)
 * Anti-spam: honeypot field + rate limit by IP
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { checkIpRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import {
  SUPPORT_RATE_LIMITS,
  sanitizeMessage,
  sanitizeSubject,
  sendTicketCreatedEmail,
  sendTicketAcknowledgmentEmail,
} from "@/lib/support";
import { applyRuleBasedTriage, applyTriageToTicket } from "@/lib/support/triage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Email validation regex (basic)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const rl = await checkIpRateLimit(
      req,
      "public_contact",
      SUPPORT_RATE_LIMITS.PUBLIC_CONTACT.limit,
      SUPPORT_RATE_LIMITS.PUBLIC_CONTACT.windowSec
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMIT", message: "Trop de demandes. Réessayez plus tard." } },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await req.json() as {
      name: string;
      email: string;
      phone?: string;
      category?: string;
      subject: string;
      message: string;
      website?: string; // Honeypot field
      consent?: boolean;
    };

    // Honeypot check - if filled, silently accept but don't create ticket
    if (body.website && body.website.trim().length > 0) {
      // Bot detected - return success to not reveal detection
      console.log("[Support] Honeypot triggered, request ignored");
      return NextResponse.json(success({ message: "Demande reçue" }), { status: 201 });
    }

    // Validation
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      throw new RouteError(400, "BAD_REQUEST", "Nom requis");
    }
    if (!body.email || typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      throw new RouteError(400, "BAD_REQUEST", "Email invalide");
    }
    if (!body.subject || typeof body.subject !== "string" || body.subject.trim().length === 0) {
      throw new RouteError(400, "BAD_REQUEST", "Sujet requis");
    }
    if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      throw new RouteError(400, "BAD_REQUEST", "Message requis");
    }

    const name = body.name.trim().slice(0, 100);
    const email = body.email.trim().toLowerCase().slice(0, 255);
    const subject = sanitizeSubject(body.subject);
    const message = sanitizeMessage(body.message);

    if (subject.length < 3) {
      throw new RouteError(400, "BAD_REQUEST", "Sujet trop court (min 3 caractères)");
    }
    if (message.length < 10) {
      throw new RouteError(400, "BAD_REQUEST", "Message trop court (min 10 caractères)");
    }

    // AI-AUTO-TRIAGE-02: Apply rule-based triage for initial values
    const triage = applyRuleBasedTriage({ subject, message });

    // Create ticket and first message
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          garageId: null, // Public ticket, not linked to a garage
          createdByUserId: null,
          requesterName: name,
          requesterEmail: email,
          channel: "FORM",
          subject,
          category: triage.category,
          priority: triage.priority,
          status: "OPEN",
          tags: triage.tags,
          lastReplyAt: new Date(),
        },
      });

      await tx.supportMessage.create({
        data: {
          ticketId: newTicket.id,
          authorType: "REQUESTER",
          authorUserId: null,
          message,
        },
      });

      return newTicket;
    });

    // AI-AUTO-TRIAGE-02: Apply full triage (rules + AI) async - never blocks response
    void applyTriageToTicket(ticket.id, subject, message, null);

    // Send email notification to support team (async)
    void sendTicketCreatedEmail({
      ticketId: ticket.id,
      subject,
      category: triage.category,
      priority: triage.priority,
      message,
      requesterName: name,
      garageName: undefined,
      garageId: null,
    });

    // Send acknowledgment to requester
    void sendTicketAcknowledgmentEmail({
      ticketId: ticket.id,
      to: email,
      requesterName: name,
      subject,
    });

    // Generic response - don't leak ticket ID to potential bots
    return NextResponse.json(
      success({ message: "Votre demande a été reçue. Nous vous répondrons dans les plus brefs délais." }),
      { status: 201 }
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
