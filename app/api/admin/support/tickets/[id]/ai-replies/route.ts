/**
 * POST /api/admin/support/tickets/[id]/ai-replies
 * 
 * AI-ASSISTED-REPLIES-02: Generate 3 reply variants (short/pro/detailed)
 * + KB suggestions + clarifying questions.
 * 
 * Admin-only. Rate limited: 10/hour/admin, 3/min/ticket.
 * PII redacted before AI call. Results NOT cached (tone-dependent).
 * 
 * Security:
 * - No raw ticket content in logs
 * - PII redacted via lib/ai/redact
 * - Structured JSON output only
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guards";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { getAIStatus } from "@/lib/ai/provider";
import { redactSensitiveData } from "@/lib/ai/redact";
import { trackError } from "@/lib/observability";

// Rate limits
const ADMIN_RATE_LIMIT = 10;
const ADMIN_RATE_WINDOW_SEC = 60 * 60; // 1 hour
const TICKET_RATE_LIMIT = 3;
const TICKET_RATE_WINDOW_SEC = 60; // 1 minute

// Tone options
const VALID_TONES = ["neutral", "friendly", "firm"] as const;
type Tone = (typeof VALID_TONES)[number];

// Length bias options
const VALID_LENGTHS = ["short", "medium", "long"] as const;
type LengthBias = (typeof VALID_LENGTHS)[number];

// JSON Schema for Structured Outputs
const REPLIES_SCHEMA = {
  type: "object",
  properties: {
    summary_internal: {
      type: "string",
      description: "Brief internal summary for admin (1-2 sentences, never shown to client)",
    },
    replies: {
      type: "object",
      properties: {
        short: {
          type: "string",
          description: "Short reply (2-4 lines), direct and efficient",
        },
        pro: {
          type: "string",
          description: "Professional reply (4-8 lines), balanced",
        },
        detailed: {
          type: "string",
          description: "Detailed reply (8-15 lines), thorough explanation",
        },
      },
      required: ["short", "pro", "detailed"],
      additionalProperties: false,
    },
    clarifying_questions: {
      type: "array",
      items: { type: "string" },
      description: "Questions to ask client for more information (max 3)",
    },
    kb_links: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          why: { type: "string", description: "Why this article is relevant (short)" },
        },
        required: ["title", "slug", "why"],
        additionalProperties: false,
      },
      description: "Relevant KB articles to suggest (max 2)",
    },
    style_notes_internal: {
      type: "array",
      items: { type: "string" },
      description: "Internal notes about tone/style adjustments made",
    },
  },
  required: ["summary_internal", "replies", "clarifying_questions", "kb_links", "style_notes_internal"],
  additionalProperties: false,
};

// Output types
interface RepliesOutput {
  summary_internal: string;
  replies: {
    short: string;
    pro: string;
    detailed: string;
  };
  clarifying_questions: string[];
  kb_links: Array<{
    title: string;
    slug: string;
    why: string;
  }>;
  style_notes_internal: string[];
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
      tone?: string;
      lengthBias?: string;
    };

    const tone: Tone = VALID_TONES.includes(body.tone as Tone) 
      ? (body.tone as Tone) 
      : "neutral";
    const lengthBias: LengthBias = VALID_LENGTHS.includes(body.lengthBias as LengthBias)
      ? (body.lengthBias as LengthBias)
      : "medium";

    // 4. Rate limit check - per admin (10/hour)
    const adminRateCheck = await checkRateLimit({
      key: `ai_replies:admin:${user.id}`,
      limit: ADMIN_RATE_LIMIT,
      windowSec: ADMIN_RATE_WINDOW_SEC,
    });

    if (!adminRateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limite atteinte",
          message: `Limite de ${ADMIN_RATE_LIMIT} propositions par heure atteinte.`,
          resetAt: adminRateCheck.resetAt.toISOString(),
        },
        { status: 429, headers: rateLimitHeaders(adminRateCheck) }
      );
    }

    // 5. Rate limit check - per ticket (3/min)
    const ticketRateCheck = await checkRateLimit({
      key: `ai_replies:ticket:${ticketId}`,
      limit: TICKET_RATE_LIMIT,
      windowSec: TICKET_RATE_WINDOW_SEC,
    });

    if (!ticketRateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limite atteinte",
          message: `Ce ticket a atteint la limite de ${TICKET_RATE_LIMIT} propositions par minute.`,
          resetAt: ticketRateCheck.resetAt.toISOString(),
        },
        { status: 429, headers: rateLimitHeaders(ticketRateCheck) }
      );
    }

    // 6. Fetch ticket with last 3 messages
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        garage: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    }

    // 7. Fetch KB articles for context (top 5 published)
    const kbArticles = await prisma.kbArticle.findMany({
      where: { isPublished: true },
      select: { title: true, slug: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 8. Build redacted context
    const redactedSubject = redactSensitiveData(ticket.subject).text;
    const redactedMessages = ticket.messages
      .reverse() // chronological order
      .map((m) => ({
        role: m.authorType === "REQUESTER" ? "client" : "support",
        text: redactSensitiveData(m.message).text,
      }));

    // 9. Build prompt
    const toneInstructions = {
      neutral: "Ton neutre et professionnel. Pas trop formel, pas trop familier.",
      friendly: "Ton chaleureux et sympathique. Utilise 'vous' mais sois accessible et empathique.",
      firm: "Ton ferme mais respectueux. Direct, clair, sans ambiguïté.",
    };

    const lengthGuidance = {
      short: "Privilégie la version courte, sois concis.",
      medium: "Équilibre entre concision et détail.",
      long: "Privilégie la version détaillée avec explications.",
    };

    const systemPrompt = `Tu es un assistant pour l'équipe support de MotorSafe, un logiciel de gestion pour garages automobiles.

CONTEXTE:
- Tu aides à rédiger des réponses aux tickets support
- Tu ne réponds JAMAIS directement au client (l'admin choisira la réponse)
- Tu proposes 3 variantes de réponse

STYLE DEMANDÉ:
${toneInstructions[tone]}
${lengthGuidance[lengthBias]}

RÈGLES:
- Commence par "Bonjour" (pas par "Cher client" ou "Madame/Monsieur")
- Signe par "L'équipe MotorSafe" ou "Cordialement, L'équipe MotorSafe"
- Sois humain, pas robotique
- Si tu suggères des articles KB, utilise UNIQUEMENT les slugs fournis
- Les questions clarifiantes doivent être concrètes et utiles

ARTICLES KB DISPONIBLES:
${kbArticles.map((a) => `- "${a.title}" (slug: ${a.slug})`).join("\n")}`;

    const userPrompt = `TICKET #${ticketId.slice(0, 8)}
Sujet: ${redactedSubject}
Catégorie: ${ticket.category}
Priorité: ${ticket.priority}
Statut: ${ticket.status}
Garage: ${ticket.garage?.name || "Visiteur public"}

DERNIERS MESSAGES:
${redactedMessages.map((m) => `[${m.role.toUpperCase()}]: ${m.text}`).join("\n\n")}

Génère 3 variantes de réponse + questions + suggestions KB.`;

    // 10. Call AI provider
    const result = await callAIForReplies(systemPrompt, userPrompt, aiStatus.provider!);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: "Échec de la génération", message: result.error },
        { status: 500 }
      );
    }

    // 11. Log operation (no PII)
    console.log(`[AI-Replies] ticketId=${ticketId.slice(0, 8)} tone=${tone} tokens=${result.tokensUsed}`);

    // 12. Return response
    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        tone,
        lengthBias,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
      },
      rateLimit: {
        adminRemaining: adminRateCheck.remaining,
        adminResetAt: adminRateCheck.resetAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[API:AI-Replies] Error:", err);
    trackError(err instanceof Error ? err : new Error("Unknown error"), {
      area: "ai",
      severity: "error",
      operation: "ai_replies",
    });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// ============================================
// AI Call Helper
// ============================================

interface AICallResult {
  success: boolean;
  data?: RepliesOutput;
  error?: string;
  provider?: string;
  tokensUsed?: number;
}

async function callAIForReplies(
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
        summary_internal: "Client demande de l'aide sur une fonctionnalité.",
        replies: {
          short: "Bonjour,\n\nMerci pour votre message. Nous avons bien noté votre demande et revenons vers vous rapidement.\n\nCordialement,\nL'équipe MotorSafe",
          pro: "Bonjour,\n\nMerci d'avoir pris le temps de nous contacter. Nous avons bien reçu votre demande et comprenons l'importance de ce sujet pour votre activité.\n\nNotre équipe technique analyse votre situation et vous recontactera dans les plus brefs délais avec une solution adaptée.\n\nCordialement,\nL'équipe MotorSafe",
          detailed: "Bonjour,\n\nMerci pour votre message détaillé. Nous comprenons parfaitement votre situation et l'importance que cela représente pour le bon fonctionnement de votre garage.\n\nAprès analyse de votre demande, voici ce que nous vous proposons :\n\n1. Notre équipe technique va examiner votre cas en priorité\n2. Nous vous contacterons sous 24h avec des solutions concrètes\n3. Si nécessaire, nous pourrons organiser une session de support en direct\n\nN'hésitez pas à nous communiquer tout détail supplémentaire qui pourrait nous aider.\n\nCordialement,\nL'équipe MotorSafe",
        },
        clarifying_questions: [
          "Pouvez-vous préciser la version de l'application que vous utilisez ?",
          "Ce problème se produit-il sur tous les navigateurs ?",
        ],
        kb_links: [],
        style_notes_internal: ["Ton neutre appliqué", "Réponses adaptées au contexte support"],
      },
    };
  }

  if (provider !== "openai") {
    return { success: false, error: `Provider ${provider} non supporté pour ai-replies` };
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
            name: "support_replies",
            strict: true,
            schema: REPLIES_SCHEMA,
          },
        },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-Replies] OpenAI error:", response.status, errorText.slice(0, 200));
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

    const parsed = JSON.parse(content) as RepliesOutput;

    return {
      success: true,
      data: parsed,
      provider: "openai",
      tokensUsed: json.usage?.total_tokens,
    };
  } catch (err) {
    console.error("[AI-Replies] Call failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
