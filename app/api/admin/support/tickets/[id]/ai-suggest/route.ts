/**
 * POST /api/admin/support/tickets/[id]/ai-suggest
 * 
 * AI-SUGGEST-01: Generate AI suggestions for a support ticket.
 * Admin-only. Rate limited: 10/hour/admin, 2/min/ticket.
 * PII redacted before AI call. Results cached 24h.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { generateSupportSuggestion, type SupportSuggestionInput } from "@/lib/ai/supportSuggestion";
import { getAIStatus } from "@/lib/ai/provider";
import { trackError } from "@/lib/observability";

// Rate limit: 10 requests per hour per admin
const ADMIN_RATE_LIMIT = 10;
const ADMIN_RATE_WINDOW_SEC = 60 * 60; // 1 hour

// Rate limit: 2 requests per minute per ticket
const TICKET_RATE_LIMIT = 2;
const TICKET_RATE_WINDOW_SEC = 60; // 1 minute

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth check - admin only
    const user = await requireUser(request);
    requireRole(user, ["ADMIN"]);

    // 2. Check AI enabled
    const aiStatus = getAIStatus();
    if (!aiStatus.enabled) {
      return NextResponse.json(
        { error: "IA non activée", reason: aiStatus.reason },
        { status: 503 }
      );
    }

    const { id: ticketId } = await context.params;

    // 3. Rate limit check - per admin (10/hour)
    const adminRateCheck = await checkRateLimit({
      key: `ai_suggest:admin:${user.id}`,
      limit: ADMIN_RATE_LIMIT,
      windowSec: ADMIN_RATE_WINDOW_SEC,
    });

    if (!adminRateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limite atteinte",
          message: `Vous avez atteint la limite de ${ADMIN_RATE_LIMIT} suggestions par heure.`,
          resetAt: adminRateCheck.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: rateLimitHeaders(adminRateCheck),
        }
      );
    }

    // 4. Rate limit check - per ticket (2/min)
    const ticketRateCheck = await checkRateLimit({
      key: `ai_suggest:ticket:${ticketId}`,
      limit: TICKET_RATE_LIMIT,
      windowSec: TICKET_RATE_WINDOW_SEC,
    });

    if (!ticketRateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limite atteinte",
          message: `Ce ticket a atteint la limite de ${TICKET_RATE_LIMIT} suggestions par minute.`,
          resetAt: ticketRateCheck.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: rateLimitHeaders(ticketRateCheck),
        }
      );
    }

    // 5. Fetch ticket with messages
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        garage: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20, // Limit to prevent huge prompts
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    }

    // 6. Prepare input for AI
    const input: SupportSuggestionInput = {
      ticketId: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      messages: ticket.messages.map((m) => ({
        authorType: m.authorType,
        message: m.message,
        createdAt: m.createdAt,
      })),
      garageName: ticket.garage?.name,
    };

    // 7. Generate suggestion
    const result = await generateSupportSuggestion(input, user.id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Échec de la génération",
          message: result.error,
        },
        { status: 500 }
      );
    }

    // 8. Return response (label as "Réponse proposée", not "IA")
    return NextResponse.json({
      success: true,
      suggestion: result.data,
      cached: result.cached ?? false,
      meta: {
        provider: result.provider,
        tokensUsed: result.tokensUsed,
      },
      rateLimit: {
        adminRemaining: adminRateCheck.remaining,
        adminResetAt: adminRateCheck.resetAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[API:AI-Suggest] Error:", err);
    trackError(err instanceof Error ? err : new Error("Unknown error"), {
      area: "ai",
      severity: "error",
      operation: "ai_suggest",
    });

    if (err instanceof Error) {
      if (err.message.includes("Unauthorized") || err.message.includes("requireUser")) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      if (err.message.includes("requireRole") || err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET: Check if AI is enabled and get status
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["ADMIN"]);

    const status = getAIStatus();

    return NextResponse.json({
      enabled: status.enabled,
      provider: status.provider,
      reason: status.reason,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
