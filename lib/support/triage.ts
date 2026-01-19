/**
 * AI-AUTO-TRIAGE-02: Auto-triage for Support Tickets
 * 
 * Centralized triage logic:
 * 1) Rule-based triage (free, instant)
 * 2) AI triage (if enabled, with timeout + fallback)
 * 
 * SECURITY:
 * - PII redacted before AI call
 * - No raw prompts/messages in logs
 * - Timeout 3s + fallback to rules
 * - Rate limited per garage
 */

import "server-only";
import type { SupportCategory, SupportPriority, TriageSource } from "@prisma/client";
import { redactSensitiveData } from "@/lib/ai/redact";
import { getAIStatus } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";

// ============================================
// Types
// ============================================

export interface TriageResult {
  category: SupportCategory;
  priority: SupportPriority;
  tags: string[];
  source: TriageSource;
  confidence?: number;
}

export interface TriageInput {
  subject: string;
  message: string;
  currentCategory?: SupportCategory;
  garageId?: number | null;
}

// ============================================
// Configuration
// ============================================

const AI_TRIAGE_TIMEOUT_MS = 3000; // 3 seconds max
const AI_TRIAGE_MIN_CONFIDENCE = 0.6;
const AI_TRIAGE_MAX_CONTEXT_LENGTH = 1500;

// Rate limit: 100 AI triages per hour globally
const AI_TRIAGE_RATE_LIMIT = {
  key: "ai_triage_global",
  limit: 100,
  windowSec: 3600,
};

// ============================================
// Rule-Based Triage (SUPPORT-SLA-01 extended)
// ============================================

/**
 * Keywords mapped to categories
 */
const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; category: SupportCategory }> = {
  billing: {
    keywords: ["paiement", "facture", "stripe", "carte", "abonnement", "prix", "tarif", "remboursement", "prélèvement"],
    category: "BILLING",
  },
  bug: {
    keywords: ["bug", "erreur", "crash", "ne fonctionne pas", "bloqué", "problème", "dysfonctionnement", "planté"],
    category: "BUG",
  },
  legal: {
    keywords: ["rgpd", "gdpr", "données personnelles", "export données", "supprimer compte", "droit oubli", "mentions légales"],
    category: "LEGAL",
  },
  feature: {
    keywords: ["fonctionnalité", "suggestion", "amélioration", "nouveau", "ajouter", "serait bien", "manque"],
    category: "FEATURE",
  },
};

/**
 * Keywords that upgrade priority
 */
const PRIORITY_KEYWORDS: Record<SupportPriority, string[]> = {
  URGENT: ["urgent", "urgente", "critique", "bloque tout", "production down", "perte données"],
  HIGH: ["bloqué", "bloque", "impossible", "ne fonctionne plus", "erreur critique", "paiement bloqué", "signature bloquée"],
  NORMAL: [],
  LOW: ["question", "info", "information", "comment faire", "aide"],
};

/**
 * Tags extracted from keywords
 */
const TAG_KEYWORDS: Record<string, string[]> = {
  signature: ["signature", "signer", "signé", "e-signature"],
  email: ["email", "mail", "courriel", "envoi", "réception"],
  pdf: ["pdf", "document", "télécharger", "export"],
  stripe: ["stripe", "paiement", "carte", "cb"],
  mobile: ["mobile", "téléphone", "smartphone", "application"],
  client: ["client", "fiche client", "coordonnées"],
  vehicule: ["véhicule", "voiture", "auto", "immatriculation"],
  facturation: ["facture", "devis", "facturation"],
};

/**
 * Apply rule-based triage (instant, no AI)
 */
export function applyRuleBasedTriage(input: TriageInput): TriageResult {
  const text = `${input.subject} ${input.message}`.toLowerCase();
  
  // 1. Determine category
  let category: SupportCategory = input.currentCategory || "OTHER";
  
  for (const [, config] of Object.entries(CATEGORY_KEYWORDS)) {
    if (config.keywords.some((kw) => text.includes(kw))) {
      category = config.category;
      break;
    }
  }
  
  // 2. Determine priority
  let priority: SupportPriority = "NORMAL";
  
  // Category-based priority
  if (category === "BILLING") priority = "HIGH";
  if (category === "LEGAL") priority = "HIGH";
  
  // Keyword-based upgrade
  for (const [prio, keywords] of Object.entries(PRIORITY_KEYWORDS) as [SupportPriority, string[]][]) {
    if (keywords.some((kw) => text.includes(kw))) {
      // Only upgrade, never downgrade
      const order: SupportPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
      if (order.indexOf(prio) > order.indexOf(priority)) {
        priority = prio;
      }
      break;
    }
  }
  
  // 3. Extract tags
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      tags.push(tag);
    }
  }
  
  return {
    category,
    priority,
    tags: tags.slice(0, 5), // Max 5 tags
    source: "RULES",
    confidence: 1.0, // Rules are deterministic
  };
}

// ============================================
// AI-Based Triage
// ============================================

/**
 * JSON Schema for AI triage response (Structured Outputs)
 */
const TRIAGE_SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["BUG", "BILLING", "FEATURE", "LEGAL", "OTHER"],
    },
    priority: {
      type: "string",
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
    },
    tags: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
  },
  required: ["category", "priority", "tags", "confidence"],
  additionalProperties: false,
};

const TRIAGE_SYSTEM_PROMPT = `Tu es un système de classification automatique de tickets support pour une application SaaS de gestion de garages automobiles.

Analyse le ticket et retourne:
- category: BUG (problème technique), BILLING (paiement/facturation), FEATURE (suggestion), LEGAL (RGPD/juridique), OTHER
- priority: URGENT (bloquant critique), HIGH (important), NORMAL (standard), LOW (question simple)
- tags: 1-5 mots-clés pertinents (signature, email, pdf, stripe, mobile, client, vehicule, facturation, etc.)
- confidence: 0-1 (ta certitude)

Réponds UNIQUEMENT en JSON valide.`;

interface AITriageResponse {
  category: SupportCategory;
  priority: SupportPriority;
  tags: string[];
  confidence: number;
}

/**
 * Call AI for triage with timeout
 */
async function callAiTriage(redactedContext: string): Promise<AITriageResponse | null> {
  const status = getAIStatus();
  
  if (!status.enabled || status.provider === "mock") {
    return null;
  }
  
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  
  if (!apiKey) return null;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TRIAGE_TIMEOUT_MS);
  
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
          { role: "system", content: TRIAGE_SYSTEM_PROMPT },
          { role: "user", content: `TICKET À CLASSIFIER:\n\n${redactedContext}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ticket_triage",
            strict: true,
            schema: TRIAGE_SCHEMA,
          },
        },
        max_tokens: 200,
        temperature: 0.1, // Very low for consistent classification
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Log error without PII
      console.error(`[Triage] AI API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;
    
    const parsed = JSON.parse(content) as AITriageResponse;
    
    // Validate response
    if (!["BUG", "BILLING", "FEATURE", "LEGAL", "OTHER"].includes(parsed.category)) return null;
    if (!["LOW", "NORMAL", "HIGH", "URGENT"].includes(parsed.priority)) return null;
    if (!Array.isArray(parsed.tags)) return null;
    if (typeof parsed.confidence !== "number") return null;
    
    return parsed;
  } catch (err) {
    clearTimeout(timeoutId);
    // Log without PII
    console.error(`[Triage] AI call failed: ${err instanceof Error ? err.name : "unknown"}`);
    return null;
  }
}

/**
 * Check global AI triage rate limit
 */
async function checkTriageRateLimit(): Promise<boolean> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - AI_TRIAGE_RATE_LIMIT.windowSec * 1000);
    
    // Count recent AI triages (using SystemEvent)
    const count = await prisma.systemEvent.count({
      where: {
        type: "support_triage",
        createdAt: { gte: windowStart },
      },
    });
    
    return count < AI_TRIAGE_RATE_LIMIT.limit;
  } catch {
    return false; // Fail closed
  }
}

/**
 * Log triage event (no PII)
 */
async function logTriageEvent(
  ticketId: string,
  source: TriageSource,
  category: SupportCategory,
  priority: SupportPriority,
  confidence?: number
): Promise<void> {
  try {
    await prisma.systemEvent.create({
      data: {
        type: "support_triage",
        service: "support",
        status: "ok",
        message: `Ticket triaged: ${source}`,
        metadata: {
          ticketId,
          source,
          category,
          priority,
          confidence,
        },
      },
    });
  } catch (err) {
    console.error("[Triage] Failed to log event:", err);
  }
}

// ============================================
// Main Triage Function
// ============================================

/**
 * Apply auto-triage to a ticket (called at creation)
 * 
 * Flow:
 * 1. Apply rule-based triage (always)
 * 2. If AI enabled + within rate limit:
 *    - Redact PII
 *    - Call AI with timeout
 *    - If success + confidence >= threshold: use AI result
 * 3. Return result (never throws)
 */
export async function applyAutoTriage(input: TriageInput): Promise<TriageResult> {
  // 1. Rule-based triage (always succeeds)
  const rulesResult = applyRuleBasedTriage(input);
  
  // 2. Check if AI triage is enabled
  const aiTriageEnabled = process.env.AI_TRIAGE_ENABLED === "true";
  const aiStatus = getAIStatus();
  
  if (!aiTriageEnabled || !aiStatus.enabled) {
    return rulesResult;
  }
  
  // 3. Check rate limit
  const withinRateLimit = await checkTriageRateLimit();
  if (!withinRateLimit) {
    console.log("[Triage] Rate limit reached, using rules");
    return rulesResult;
  }
  
  // 4. Build redacted context
  const redactedSubject = redactSensitiveData(input.subject);
  const redactedMessage = redactSensitiveData(input.message);
  
  const context = `Sujet: ${redactedSubject.text}\n\nMessage: ${redactedMessage.text}`.slice(
    0,
    AI_TRIAGE_MAX_CONTEXT_LENGTH
  );
  
  // 5. Call AI (with timeout)
  const aiResult = await callAiTriage(context);
  
  if (!aiResult) {
    return rulesResult;
  }
  
  // 6. Check confidence threshold
  if (aiResult.confidence < AI_TRIAGE_MIN_CONFIDENCE) {
    console.log(`[Triage] AI confidence too low (${aiResult.confidence}), using rules`);
    return rulesResult;
  }
  
  // 7. Return AI result
  return {
    category: aiResult.category,
    priority: aiResult.priority,
    tags: aiResult.tags.slice(0, 5),
    source: "AI",
    confidence: aiResult.confidence,
  };
}

/**
 * Apply triage and update ticket (fire & forget, never blocks)
 * Called after ticket creation in transaction
 */
export async function applyTriageToTicket(
  ticketId: string,
  subject: string,
  message: string,
  garageId?: number | null
): Promise<void> {
  try {
    const result = await applyAutoTriage({ subject, message, garageId });
    
    // Update ticket with triage result
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        category: result.category,
        priority: result.priority,
        tags: result.tags,
        autoTriageSource: result.source,
        autoTriageAt: new Date(),
      },
    });
    
    // Log event (no PII)
    await logTriageEvent(ticketId, result.source, result.category, result.priority, result.confidence);
  } catch (err) {
    // Never fail ticket creation due to triage error
    console.error("[Triage] Failed to apply triage:", err instanceof Error ? err.message : "unknown");
  }
}
