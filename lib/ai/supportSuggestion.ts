/**
 * AI Support Suggestions (AI-SUGGEST-01)
 * 
 * Generates intelligent suggestions for support tickets:
 * - Category/priority classification
 * - Draft reply in French
 * - Clarifying questions
 * - KB article suggestions
 * - Internal summary and next actions
 * 
 * Uses OpenAI Responses API with Structured Outputs (JSON strict mode).
 * All data is PII-redacted before AI call.
 */

import "server-only";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { trackError } from "@/lib/observability";
import { redactSensitiveData } from "./redact";
import { getAIStatus } from "./provider";

// ============================================
// Types
// ============================================

export interface SupportSuggestionInput {
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  messages: Array<{
    authorType: string;
    message: string;
    createdAt: Date | string;
  }>;
  garageName?: string | null;
}

export interface SupportSuggestionOutput {
  suggested_category: string | null;
  suggested_priority: string | null;
  confidence: number;
  summary_internal: string;
  draft_reply_fr: string;
  clarifying_questions: string[];
  kb_suggestions: string[];
  next_actions_internal: string[];
}

export interface SupportSuggestionResult {
  success: boolean;
  data?: SupportSuggestionOutput;
  error?: string;
  cached?: boolean;
  provider?: string;
  tokensUsed?: number;
}

// ============================================
// Configuration
// ============================================

const AI_CACHE_TTL_HOURS = parseInt(process.env.AI_CACHE_TTL_HOURS ?? "24", 10);

// JSON Schema for Structured Outputs (strict mode)
const SUPPORT_SUGGESTION_SCHEMA = {
  type: "object",
  properties: {
    suggested_category: {
      type: ["string", "null"],
      enum: ["BUG", "BILLING", "FEATURE", "LEGAL", "OTHER", null],
      description: "Suggested ticket category based on content analysis",
    },
    suggested_priority: {
      type: ["string", "null"],
      enum: ["LOW", "NORMAL", "HIGH", "URGENT", null],
      description: "Suggested priority level",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence score 0-1 for category/priority suggestions",
    },
    summary_internal: {
      type: "string",
      description: "Internal summary for support staff (1-2 sentences)",
    },
    draft_reply_fr: {
      type: "string",
      description: "Draft response in French, professional and helpful tone",
    },
    clarifying_questions: {
      type: "array",
      items: { type: "string" },
      description: "Questions to ask the client for more information",
    },
    kb_suggestions: {
      type: "array",
      items: { type: "string" },
      description: "Suggested KB article slugs/keywords to search for",
    },
    next_actions_internal: {
      type: "array",
      items: { type: "string" },
      description: "Recommended next steps for support team",
    },
  },
  required: [
    "suggested_category",
    "suggested_priority",
    "confidence",
    "summary_internal",
    "draft_reply_fr",
    "clarifying_questions",
    "kb_suggestions",
    "next_actions_internal",
  ],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `Tu es un assistant de support technique pour garages automobiles. Tu analyses les tickets de support et génères des suggestions pour aider l'équipe support.

RÈGLES:
- Réponds UNIQUEMENT en JSON valide selon le schéma fourni
- Ne mentionne JAMAIS que tu es une IA ou un assistant
- draft_reply_fr doit être professionnel, empathique et utile
- Suggère des articles KB pertinents (mots-clés de recherche)
- Les questions de clarification doivent être spécifiques et utiles
- summary_internal et next_actions_internal sont pour l'équipe support (invisibles au client)
- Analyse le contexte: messages, catégorie actuelle, historique
- Si le ticket est déjà bien catégorisé, renvoie null pour suggested_category/priority
- La confiance doit refléter la certitude de tes suggestions

CATÉGORIES POSSIBLES:
- BUG: Problème technique, bug logiciel, erreur système
- BILLING: Facturation, paiement, abonnement, remboursement
- FEATURE: Demande de fonctionnalité, amélioration
- LEGAL: Question juridique, RGPD, mentions légales
- OTHER: Autre sujet ne correspondant pas aux catégories ci-dessus

PRIORITÉS:
- URGENT: Problème bloquant, perte de données, sécurité
- HIGH: Problème important impactant l'activité
- NORMAL: Demande standard
- LOW: Question générale, faible impact`;

// ============================================
// Helpers
// ============================================

function computeInputHash(input: SupportSuggestionInput): string {
  const normalized = {
    subject: input.subject,
    category: input.category,
    priority: input.priority,
    messages: input.messages.map((m) => ({
      authorType: m.authorType,
      message: m.message,
    })),
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function buildUserPrompt(input: SupportSuggestionInput): string {
  // Redact all messages
  const redactedMessages = input.messages.map((m) => {
    const redacted = redactSensitiveData(m.message);
    return {
      authorType: m.authorType === "ADMIN" ? "Support" : m.authorType === "GARAGE_USER" ? "Client (garage)" : "Client (visiteur)",
      message: redacted.text,
    };
  });

  const redactedSubject = redactSensitiveData(input.subject);

  let prompt = `TICKET DE SUPPORT À ANALYSER:

Sujet: ${redactedSubject.text}
Catégorie actuelle: ${input.category}
Priorité actuelle: ${input.priority}
`;

  if (input.garageName) {
    prompt += `Garage: ${input.garageName}\n`;
  }

  prompt += `\nMESSAGES (du plus ancien au plus récent):\n`;

  for (const msg of redactedMessages) {
    prompt += `\n[${msg.authorType}]: ${msg.message}\n`;
  }

  prompt += `\nGénère une analyse structurée selon le schéma JSON.`;

  return prompt;
}

// ============================================
// Cache Functions
// ============================================

async function getCachedSuggestion(
  ticketId: string,
  inputHash: string
): Promise<SupportSuggestionResult | null> {
  try {
    const cached = await prisma.supportAiSuggestion.findFirst({
      where: {
        ticketId,
        inputHash,
        expiresAt: { gt: new Date() },
        error: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!cached) return null;

    return {
      success: true,
      data: {
        suggested_category: cached.suggestedCategory,
        suggested_priority: cached.suggestedPriority,
        confidence: cached.confidence ?? 0.5,
        summary_internal: cached.summaryInternal ?? "",
        draft_reply_fr: cached.draftReplyFr ?? "",
        clarifying_questions: cached.clarifyingQuestions,
        kb_suggestions: cached.kbSuggestions,
        next_actions_internal: cached.nextActionsInternal,
      },
      cached: true,
      provider: cached.provider ?? undefined,
      tokensUsed: cached.tokensUsed ?? undefined,
    };
  } catch (err) {
    console.error("[AI:Support] Cache lookup error:", err);
    return null;
  }
}

async function saveSuggestion(
  ticketId: string,
  requestedBy: string,
  inputHash: string,
  result: SupportSuggestionResult,
  provider?: string,
  model?: string
): Promise<void> {
  try {
    await prisma.supportAiSuggestion.create({
      data: {
        ticketId,
        requestedBy,
        inputHash,
        suggestedCategory: result.data?.suggested_category,
        suggestedPriority: result.data?.suggested_priority,
        confidence: result.data?.confidence,
        summaryInternal: result.data?.summary_internal,
        draftReplyFr: result.data?.draft_reply_fr,
        clarifyingQuestions: result.data?.clarifying_questions ?? [],
        kbSuggestions: result.data?.kb_suggestions ?? [],
        nextActionsInternal: result.data?.next_actions_internal ?? [],
        provider,
        model,
        tokensUsed: result.tokensUsed,
        cached: false,
        error: result.error,
        expiresAt: new Date(Date.now() + AI_CACHE_TTL_HOURS * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    console.error("[AI:Support] Failed to save suggestion:", err);
  }
}

// ============================================
// Provider Calls
// ============================================

async function callOpenAIStructured(
  userPrompt: string
): Promise<SupportSuggestionResult> {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return { success: false, error: "AI_API_KEY not configured" };
  }

  try {
    // Using OpenAI Responses API with Structured Outputs
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "support_suggestion",
            strict: true,
            schema: SUPPORT_SUGGESTION_SCHEMA,
          },
        },
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent outputs
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message ?? `API error: ${response.status}`;
      console.error("[AI:Support] OpenAI API error:", response.status, errorMessage);
      trackError(new Error(errorMessage), {
        area: "ai",
        severity: "warning",
        operation: "support_suggestion",
      });
      return { success: false, error: errorMessage, provider: "openai" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens;

    if (!content) {
      return { success: false, error: "No content in response", provider: "openai" };
    }

    // Parse JSON response
    let parsed: SupportSuggestionOutput;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("[AI:Support] Failed to parse JSON:", content);
      return { success: false, error: "Invalid JSON response", provider: "openai" };
    }

    return {
      success: true,
      data: parsed,
      provider: "openai",
      tokensUsed,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI:Support] Request failed:", errorMessage);
    trackError(err instanceof Error ? err : new Error(errorMessage), {
      area: "ai",
      severity: "warning",
      operation: "support_suggestion",
    });
    return { success: false, error: "Request failed", provider: "openai" };
  }
}

function getMockSuggestion(): SupportSuggestionResult {
  return {
    success: true,
    data: {
      suggested_category: null,
      suggested_priority: null,
      confidence: 0.85,
      summary_internal:
        "Client demande une assistance technique concernant une fonctionnalité. Semble avoir besoin de clarification sur l'utilisation.",
      draft_reply_fr: `Bonjour,

Merci de nous avoir contactés. Je comprends parfaitement votre demande et je suis là pour vous aider.

Pourriez-vous me préciser les points suivants afin que je puisse vous apporter la meilleure assistance possible ?

Je reste à votre disposition pour toute question complémentaire.

Cordialement,
L'équipe Support`,
      clarifying_questions: [
        "Quel navigateur et système d'exploitation utilisez-vous ?",
        "Pouvez-vous décrire les étapes exactes qui mènent au problème ?",
      ],
      kb_suggestions: ["premiers-pas", "gestion-clients", "facturation"],
      next_actions_internal: [
        "Vérifier si le garage a un abonnement actif",
        "Consulter les logs récents pour ce garage",
      ],
    },
    cached: false,
    provider: "mock",
    tokensUsed: 0,
  };
}

// ============================================
// Main API
// ============================================

/**
 * Generate AI suggestions for a support ticket.
 * PII is automatically redacted before sending to AI.
 * Results are cached based on input hash.
 * 
 * @param input - Ticket data to analyze
 * @param requestedBy - User ID requesting the suggestion (for audit)
 * @returns Suggestion result with category, reply draft, etc.
 */
export async function generateSupportSuggestion(
  input: SupportSuggestionInput,
  requestedBy: string
): Promise<SupportSuggestionResult> {
  const status = getAIStatus();

  if (!status.enabled) {
    return {
      success: false,
      error: status.reason ?? "AI not enabled",
    };
  }

  // Compute input hash for caching
  const inputHash = computeInputHash(input);

  // Check cache first
  const cached = await getCachedSuggestion(input.ticketId, inputHash);
  if (cached) {
    console.log(`[AI:Support] Cache hit for ticket ${input.ticketId}`);
    return cached;
  }

  console.log(`[AI:Support] Generating suggestion for ticket ${input.ticketId} with provider: ${status.provider}`);

  // Build user prompt (with redaction)
  const userPrompt = buildUserPrompt(input);

  let result: SupportSuggestionResult;
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  switch (status.provider) {
    case "openai":
      result = await callOpenAIStructured(userPrompt);
      break;

    case "mock":
      result = getMockSuggestion();
      break;

    default:
      result = {
        success: false,
        error: `Unsupported provider for support suggestions: ${status.provider}`,
      };
  }

  // Save to DB for caching and audit
  await saveSuggestion(
    input.ticketId,
    requestedBy,
    inputHash,
    result,
    result.provider,
    model
  );

  return result;
}

/**
 * Cleanup expired AI suggestions (retention: 12 months for operational, then delete)
 * Should be called by a cron job
 */
export async function cleanupExpiredSuggestions(olderThanMonths = 12): Promise<number> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - olderThanMonths);

  try {
    const result = await prisma.supportAiSuggestion.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });
    return result.count;
  } catch (err) {
    console.error("[AI:Support] Cleanup error:", err);
    return 0;
  }
}
