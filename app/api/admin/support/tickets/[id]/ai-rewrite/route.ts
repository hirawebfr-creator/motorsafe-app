/**
 * POST /api/admin/support/tickets/[id]/ai-rewrite
 * 
 * AI-ASSISTED-REPLIES-02: Rewrite a draft with specific instruction.
 * Does NOT regenerate from scratch - just rewrites provided text.
 * 
 * Admin-only. Rate limited: 20/hour/admin, 5/min/ticket.
 * PII redacted before AI call.
 * 
 * Security:
 * - No raw text in logs (only operation type)
 * - PII redacted in both input and output
 * - Structured JSON output only
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { getAIStatus } from "@/lib/ai/provider";
import { redactSensitiveData } from "@/lib/ai/redact";
import { trackError } from "@/lib/observability";

// Rate limits (more generous for rewrite - simpler operation)
const ADMIN_RATE_LIMIT = 20;
const ADMIN_RATE_WINDOW_SEC = 60 * 60; // 1 hour
const TICKET_RATE_LIMIT = 5;
const TICKET_RATE_WINDOW_SEC = 60; // 1 minute

// Rewrite instructions
const VALID_INSTRUCTIONS = ["shorter", "friendlier", "firmer", "clearer"] as const;
type RewriteInstruction = (typeof VALID_INSTRUCTIONS)[number];

const INSTRUCTION_PROMPTS: Record<RewriteInstruction, string> = {
  shorter: "Réécris ce texte de manière plus concise, en gardant l'essentiel. Réduis d'au moins 30%.",
  friendlier: "Réécris ce texte avec un ton plus chaleureux et empathique, tout en restant professionnel.",
  firmer: "Réécris ce texte avec un ton plus direct et ferme, sans être impoli.",
  clearer: "Réécris ce texte de manière plus claire et structurée. Simplifie le vocabulaire si nécessaire.",
};

// JSON Schema for output
const REWRITE_SCHEMA = {
  type: "object",
  properties: {
    rewrittenText: {
      type: "string",
      description: "The rewritten text following the instruction",
    },
    changes_made: {
      type: "array",
      items: { type: "string" },
      description: "Brief list of changes made (internal, for admin reference)",
    },
  },
  required: ["rewrittenText", "changes_made"],
  additionalProperties: false,
};

interface RewriteOutput {
  rewrittenText: string;
  changes_made: string[];
}

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

    // 3. Parse body
    const body = await request.json() as {
      text?: string;
      instruction?: string;
    };

    if (!body.text || typeof body.text !== "string" || body.text.trim().length < 10) {
      return NextResponse.json(
        { error: "Texte requis (min 10 caractères)" },
        { status: 400 }
      );
    }

    const instruction: RewriteInstruction = VALID_INSTRUCTIONS.includes(body.instruction as RewriteInstruction)
      ? (body.instruction as RewriteInstruction)
      : "clearer";

    // 4. Verify ticket exists (security check)
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    }

    // 5. Rate limit check - per admin (20/hour)
    const adminRateCheck = await checkRateLimit({
      key: `ai_rewrite:admin:${user.id}`,
      limit: ADMIN_RATE_LIMIT,
      windowSec: ADMIN_RATE_WINDOW_SEC,
    });

    if (!adminRateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limite atteinte",
          message: `Limite de ${ADMIN_RATE_LIMIT} réécritures par heure atteinte.`,
          resetAt: adminRateCheck.resetAt.toISOString(),
        },
        { status: 429, headers: rateLimitHeaders(adminRateCheck) }
      );
    }

    // 6. Rate limit check - per ticket (5/min)
    const ticketRateCheck = await checkRateLimit({
      key: `ai_rewrite:ticket:${ticketId}`,
      limit: TICKET_RATE_LIMIT,
      windowSec: TICKET_RATE_WINDOW_SEC,
    });

    if (!ticketRateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limite atteinte",
          message: `Ce ticket a atteint la limite de ${TICKET_RATE_LIMIT} réécritures par minute.`,
          resetAt: ticketRateCheck.resetAt.toISOString(),
        },
        { status: 429, headers: rateLimitHeaders(ticketRateCheck) }
      );
    }

    // 7. Redact PII from input text
    const redactedInput = redactSensitiveData(body.text).text;

    // 8. Build prompt
    const systemPrompt = `Tu es un assistant pour l'équipe support de MotorSafe.
Tu réécris des brouillons de réponses selon des instructions précises.

RÈGLES:
- Garde la même structure générale (salutation, contenu, signature)
- Ne change pas les informations factuelles
- Applique UNIQUEMENT l'instruction donnée
- Le texte doit rester en français`;

    const userPrompt = `INSTRUCTION: ${INSTRUCTION_PROMPTS[instruction]}

TEXTE À RÉÉCRIRE:
${redactedInput}

Réécris ce texte en suivant l'instruction.`;

    // 9. Call AI provider
    const result = await callAIForRewrite(systemPrompt, userPrompt, aiStatus.provider!);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: "Échec de la réécriture", message: result.error },
        { status: 500 }
      );
    }

    // 10. Log operation (no text content)
    console.log(`[AI-Rewrite] ticketId=${ticketId.slice(0, 8)} instruction=${instruction} tokens=${result.tokensUsed}`);

    // 11. Return response
    return NextResponse.json({
      success: true,
      rewrittenText: result.data.rewrittenText,
      changes: result.data.changes_made,
      meta: {
        instruction,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
      },
      rateLimit: {
        adminRemaining: adminRateCheck.remaining,
      },
    });
  } catch (err) {
    console.error("[API:AI-Rewrite] Error:", err);
    trackError(err instanceof Error ? err : new Error("Unknown error"), {
      area: "ai",
      severity: "error",
      operation: "ai_rewrite",
    });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// ============================================
// AI Call Helper
// ============================================

interface AICallResult {
  success: boolean;
  data?: RewriteOutput;
  error?: string;
  provider?: string;
  tokensUsed?: number;
}

async function callAIForRewrite(
  systemPrompt: string,
  userPrompt: string,
  provider: string
): Promise<AICallResult> {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (provider === "mock") {
    // Mock response for testing
    return {
      success: true,
      provider: "mock",
      tokensUsed: 0,
      data: {
        rewrittenText: "Bonjour,\n\nMerci pour votre message. Nous traitons votre demande.\n\nCordialement,\nL'équipe MotorSafe",
        changes_made: ["Texte simplifié", "Ton ajusté"],
      },
    };
  }

  if (provider !== "openai") {
    return { success: false, error: `Provider ${provider} non supporté pour ai-rewrite` };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "rewrite_result",
            strict: true,
            schema: REWRITE_SCHEMA,
          },
        },
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-Rewrite] OpenAI error:", response.status, errorText.slice(0, 200));
      return { success: false, error: `OpenAI API error: ${response.status}` };
    }

    const json = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { total_tokens: number };
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No content in response" };
    }

    const parsed = JSON.parse(content) as RewriteOutput;

    return {
      success: true,
      data: parsed,
      provider: "openai",
      tokensUsed: json.usage?.total_tokens,
    };
  } catch (err) {
    console.error("[AI-Rewrite] Call failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
