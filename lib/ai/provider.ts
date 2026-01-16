/**
 * AI Provider Abstraction Layer
 * 
 * Provider-agnostic interface for AI completions.
 * Server-only - NEVER expose API keys to client.
 * 
 * Supported modes:
 * - DISABLED: No AI provider configured (default)
 * - OPENAI: OpenAI API (GPT-4, etc.)
 * - ANTHROPIC: Anthropic API (Claude)
 * - MOCK: Test mode with canned responses
 * 
 * Environment variables:
 * - AI_PROVIDER: "openai" | "anthropic" | "mock" | undefined
 * - AI_API_KEY: Provider API key
 * - AI_MODEL: Optional model override (default: gpt-4o-mini for openai, claude-3-haiku for anthropic)
 */

import "server-only";

// ============================================
// Types
// ============================================

export type AIMode = "CHECKLIST" | "SUMMARY" | "RISKS";

export interface AICompletionRequest {
  mode: AIMode;
  context: string;  // Already redacted context
  language?: "fr" | "en";
}

export interface AICompletionResult {
  success: boolean;
  content?: string;
  disclaimer?: string;
  error?: string;
  provider?: string;
  tokensUsed?: number;
}

export interface AIProviderStatus {
  enabled: boolean;
  provider: string | null;
  reason?: string;
}

// ============================================
// Configuration
// ============================================

function getProviderConfig(): { provider: string | null; apiKey: string | null; model: string | null } {
  const provider = process.env.AI_PROVIDER?.toLowerCase() ?? null;
  const apiKey = process.env.AI_API_KEY ?? null;
  const model = process.env.AI_MODEL ?? null;
  
  return { provider, apiKey, model };
}

/**
 * Check if AI is enabled and properly configured
 */
export function getAIStatus(): AIProviderStatus {
  const { provider, apiKey } = getProviderConfig();
  
  if (!provider) {
    return { enabled: false, provider: null, reason: "AI_PROVIDER not configured" };
  }
  
  if (provider === "mock") {
    return { enabled: true, provider: "mock" };
  }
  
  if (!apiKey) {
    return { enabled: false, provider, reason: "AI_API_KEY not configured" };
  }
  
  const validProviders = ["openai", "anthropic"];
  if (!validProviders.includes(provider)) {
    return { enabled: false, provider, reason: `Unknown provider: ${provider}` };
  }
  
  return { enabled: true, provider };
}

// ============================================
// Prompts
// ============================================

const DISCLAIMER_FR = "⚠️ Ces suggestions sont générées par IA et ne remplacent pas l'expertise professionnelle. Vérifiez toujours avant application.";

const SYSTEM_PROMPT_FR = `Tu es un assistant IA pour garage automobile. Tu aides les professionnels à:
- Créer des checklists d'intervention
- Rédiger des résumés clients compréhensibles
- Identifier les points d'attention et risques

RÈGLES IMPORTANTES:
- Tu ne fais JAMAIS de diagnostic médical ou de garantie sur la réparation
- Tes suggestions sont indicatives et doivent être vérifiées par un professionnel
- Tu réponds toujours en français
- Tu es concis et pratique
- Tu n'as pas accès aux données d'autres garages
- Tu ne mentionnes jamais de noms, adresses, plaques ou informations personnelles`;

const MODE_PROMPTS: Record<AIMode, string> = {
  CHECKLIST: `Génère une checklist d'intervention structurée avec:
- Points de vérification pré-intervention
- Étapes de réalisation
- Contrôles post-intervention
Format: liste à puces claire et actionnable.`,

  SUMMARY: `Rédige un résumé client clair et accessible:
- Explication simple de l'intervention (sans jargon technique)
- Bénéfices pour le client
- Précautions d'usage post-intervention
Format: paragraphes courts, ton professionnel mais accessible.`,

  RISKS: `Identifie les points d'attention et risques:
- Risques potentiels liés à l'intervention
- Précautions à prendre
- Points de vigilance post-intervention
Format: liste structurée avec niveau d'importance (⚠️ attention, ℹ️ info).`,
};

function buildPrompt(mode: AIMode, context: string): string {
  return `${MODE_PROMPTS[mode]}

CONTEXTE DE L'INTERVENTION:
${context}

Réponds de manière structurée et professionnelle.`;
}

// ============================================
// Provider Implementations
// ============================================

async function callOpenAI(prompt: string, model: string | null): Promise<AICompletionResult> {
  const { apiKey } = getProviderConfig();
  const actualModel = model ?? "gpt-4o-mini";
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: actualModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT_FR },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message ?? `API error: ${response.status}`;
      console.error("[AI:OpenAI] API error:", response.status);
      return { success: false, error: errorMessage, provider: "openai" };
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens;
    
    if (!content) {
      return { success: false, error: "No content in response", provider: "openai" };
    }
    
    return {
      success: true,
      content,
      disclaimer: DISCLAIMER_FR,
      provider: "openai",
      tokensUsed,
    };
  } catch (err) {
    console.error("[AI:OpenAI] Request failed:", err instanceof Error ? err.message : "Unknown error");
    return { success: false, error: "Request failed", provider: "openai" };
  }
}

async function callAnthropic(prompt: string, model: string | null): Promise<AICompletionResult> {
  const { apiKey } = getProviderConfig();
  const actualModel = model ?? "claude-3-haiku-20240307";
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: actualModel,
        max_tokens: 1000,
        system: SYSTEM_PROMPT_FR,
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message ?? `API error: ${response.status}`;
      console.error("[AI:Anthropic] API error:", response.status);
      return { success: false, error: errorMessage, provider: "anthropic" };
    }
    
    const data = await response.json();
    const content = data.content?.[0]?.text;
    const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
    
    if (!content) {
      return { success: false, error: "No content in response", provider: "anthropic" };
    }
    
    return {
      success: true,
      content,
      disclaimer: DISCLAIMER_FR,
      provider: "anthropic",
      tokensUsed,
    };
  } catch (err) {
    console.error("[AI:Anthropic] Request failed:", err instanceof Error ? err.message : "Unknown error");
    return { success: false, error: "Request failed", provider: "anthropic" };
  }
}

function getMockResponse(mode: AIMode): AICompletionResult {
  const responses: Record<AIMode, string> = {
    CHECKLIST: `## Checklist d'intervention

### Avant l'intervention
- [ ] Vérifier le niveau d'huile moteur
- [ ] Contrôler la pression des pneus
- [ ] Effectuer un diagnostic électronique
- [ ] Photographier l'état initial du véhicule

### Pendant l'intervention
- [ ] Appliquer les procédures constructeur
- [ ] Documenter chaque étape
- [ ] Conserver les pièces remplacées

### Après l'intervention
- [ ] Essai routier de validation
- [ ] Reset des voyants si nécessaire
- [ ] Mise à jour du carnet d'entretien`,

    SUMMARY: `## Résumé de l'intervention

Votre véhicule a bénéficié d'une intervention technique visant à optimiser son fonctionnement.

**Ce qui a été fait :**
Notre équipe a procédé aux réglages et ajustements nécessaires selon les spécifications du constructeur.

**Bénéfices pour vous :**
- Meilleure performance du véhicule
- Consommation optimisée
- Fiabilité accrue

**Recommandations :**
Nous vous conseillons de revenir pour un contrôle de suivi dans les prochaines semaines.`,

    RISKS: `## Points d'attention

⚠️ **Période de rodage**
Après l'intervention, respectez une période d'adaptation de quelques centaines de kilomètres.

⚠️ **Surveillance recommandée**
Vérifiez régulièrement les voyants du tableau de bord les premiers jours.

ℹ️ **Consommation**
Une légère variation de consommation peut être observée initialement, c'est normal.

ℹ️ **Documentation**
Conservez tous les documents relatifs à l'intervention pour votre assurance.`,
  };

  return {
    success: true,
    content: responses[mode],
    disclaimer: DISCLAIMER_FR,
    provider: "mock",
    tokensUsed: 0,
  };
}

// ============================================
// Main API
// ============================================

/**
 * Generate AI completion for intervention assistance
 * IMPORTANT: Context must already be redacted via redact.ts
 */
export async function generateCompletion(request: AICompletionRequest): Promise<AICompletionResult> {
  const status = getAIStatus();
  
  if (!status.enabled) {
    return {
      success: false,
      error: status.reason ?? "AI not enabled",
      provider: undefined,
    };
  }
  
  const prompt = buildPrompt(request.mode, request.context);
  const { model } = getProviderConfig();
  
  // Do NOT log the prompt or context
  console.log(`[AI] Generating ${request.mode} with provider: ${status.provider}`);
  
  switch (status.provider) {
    case "openai":
      return callOpenAI(prompt, model);
    
    case "anthropic":
      return callAnthropic(prompt, model);
    
    case "mock":
      return getMockResponse(request.mode);
    
    default:
      return {
        success: false,
        error: `Unsupported provider: ${status.provider}`,
        provider: status.provider ?? undefined,
      };
  }
}
