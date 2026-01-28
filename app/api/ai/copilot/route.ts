/**
 * AI Copilot API Route (COPILOT-API-01)
 * 
 * Handles AI chat requests for the SafeMotor Copilot.
 * Uses multi-provider AI abstraction layer.
 */

import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================================
// Types
// ============================================================================

interface CopilotRequest {
  message: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `Tu es SafeMotor Copilot, l'assistant IA intelligent pour les garagistes utilisant SafeMotor.

Tu dois être:
- Professionnel et concis
- Expert en mécanique automobile, reprogrammation moteur, E85, et gestion de garage
- Proactif en proposant des solutions et opportunités
- Français dans toutes tes réponses

Tes capacités:
- Conseils sur l'optimisation du CA et la gestion client
- Expertise technique automobile (diagnostic, E85, reprogrammation Stage 1/2/3)
- Aide à la rédaction de devis et factures
- Suggestions pour améliorer l'activité du garage
- Analyse des opportunités commerciales (upsell E85, stages, etc.)

Règles importantes:
- Réponds toujours en français
- Sois concis mais complet (max 200 mots par réponse)
- Propose des actions concrètes quand possible
- Si tu ne sais pas, dis-le honnêtement
- Mentionne que tes réponses sont des suggestions et non des conseils juridiques/fiscaux officiels

Contexte garage fourni: {garage_context}
`;

// ============================================================================
// Mock AI Response (fallback if no AI provider configured)
// ============================================================================

function getMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("e85") || lowerMessage.includes("bioéthanol")) {
    return `🌿 **Conversion E85 - Points clés:**

La conversion E85 offre d'excellentes opportunités:
- **Économies client**: 40-50% sur le carburant
- **Marge garage**: 300-600€ par conversion
- **Éligibilité**: Véhicules essence post-2000

**Conseil commercial**: Proposez systématiquement l'E85 aux clients avec véhicules essence. Le retour sur investissement est généralement de 6-12 mois pour le client.

Souhaitez-vous que je vous aide à identifier les véhicules éligibles dans votre base ?`;
  }

  if (lowerMessage.includes("stage") || lowerMessage.includes("reprog")) {
    return `⚡ **Reprogrammation Stage - Vue d'ensemble:**

**Stage 1** (ECU seul): +15-30% puissance, 450-650€
- Aucune pièce à changer
- Idéal pour débuter

**Stage 2** (ECU + hardware): +30-50% puissance, 1200-1800€
- Nécessite: admission, échappement, downpipe
- Pour clients passionnés

**Stage 3** (compétition): +50-80%, 3000€+
- Turbo renforcé, internes moteur
- Véhicules dédiés circuit

**Conseil**: Le Stage 1 est le meilleur ratio marge/temps. Proposez-le aux propriétaires de véhicules turbo essence ou diesel.`;
  }

  if (lowerMessage.includes("client") || lowerMessage.includes("analyser")) {
    return `📊 **Analyse clients - Recommandations:**

Pour optimiser votre portefeuille client:

1. **Clients dormants**: Contactez ceux sans intervention depuis 6+ mois
2. **Upsell opportunités**: 
   - Véhicules essence → E85
   - Véhicules turbo → Stage 1
3. **Fidélisation**: Proposez un suivi annuel
4. **Parrainage**: Demandez des recommandations aux clients satisfaits

**Action rapide**: Exportez votre liste clients et segmentez par type de véhicule et date dernière intervention.

Voulez-vous des conseils plus spécifiques sur un segment ?`;
  }

  if (lowerMessage.includes("ca") || lowerMessage.includes("chiffre") || lowerMessage.includes("augmenter") || lowerMessage.includes("revenu")) {
    return `💰 **5 actions pour augmenter votre CA:**

1. **E85 systématique**: Proposez à chaque client essence
   → +300-600€ par conversion

2. **Stage 1 turbo**: Offre premium pour passionnés
   → +400-600€ marge nette

3. **Forfaits entretien**: Packages révision + bonus
   → Fidélisation + CA prévisible

4. **Relances automatiques**: CT, révision, garantie
   → Récupérez 20-30% clients perdus

5. **Avis Google**: Demandez après chaque intervention
   → +15-25% nouveaux clients

**Priorité #1**: Commencez par l'E85, c'est le plus simple à vendre.`;
  }

  if (lowerMessage.includes("devis") || lowerMessage.includes("facture")) {
    return `📝 **Aide devis/facture:**

Pour un devis professionnel, incluez:

1. **En-tête**: Vos coordonnées + n° SIRET
2. **Client**: Nom, adresse, véhicule (plaque, km)
3. **Détail prestation**:
   - Pièces (réf + prix unitaire)
   - Main d'œuvre (heures × taux horaire)
   - Forfaits si applicable
4. **TVA**: Ligne séparée (20%)
5. **Validité**: 30 jours standard
6. **CGV**: Mentionnez vos conditions

**Conseil**: Utilisez les modèles SafeMotor dans Documents → Nouveau devis pour un rendu pro.

Quel type de devis souhaitez-vous créer ?`;
  }

  if (lowerMessage.includes("diagnostic") || lowerMessage.includes("problème") || lowerMessage.includes("panne")) {
    return `🔧 **Aide au diagnostic:**

Pour un diagnostic efficace, procédez ainsi:

1. **Symptômes**: Quand, comment, fréquence ?
2. **Lecture OBD**: Codes défaut présents ?
3. **Contrôle visuel**: Fuites, usure visible ?
4. **Test dynamique**: Comportement en roulant ?

**Questions clés à poser au client:**
- Depuis quand le problème existe ?
- Circonstances d'apparition ?
- Bruits, odeurs, vibrations ?
- Voyants allumés au tableau ?

Décrivez-moi le problème que vous diagnostiquez et je vous guiderai.`;
  }

  // Default response
  return `👋 Je suis SafeMotor Copilot, votre assistant IA !

Je peux vous aider avec:
- **💰 Business**: Augmenter votre CA, analyser vos clients
- **🌿 E85**: Conversions, calculs d'économies
- **⚡ Stage**: Reprogrammation 1/2/3, gains estimés
- **📝 Admin**: Devis, factures, documentation
- **🔧 Technique**: Diagnostic, conseils intervention

Posez-moi une question précise ou utilisez les actions rapides pour commencer !`;
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getSessionUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Parse request
    const body: CopilotRequest = await request.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    // Get garage context for personalization
    let garageContext = "Aucun contexte garage disponible";
    try {
      const userWithGarage = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          garage: {
            include: {
              _count: {
                select: {
                  clients: true,
                  vehicles: true,
                  interventions: true,
                },
              },
            },
          },
        },
      });

      if (userWithGarage?.garage) {
        garageContext = `
Garage: ${userWithGarage.garage.name}
Plan: ${userWithGarage.garage.plan}
Clients: ${userWithGarage.garage._count.clients}
Véhicules: ${userWithGarage.garage._count.vehicles}
Interventions: ${userWithGarage.garage._count.interventions}
        `.trim();
      }
    } catch (e) {
      // Ignore error, use default context
    }

    // Check if AI provider is configured
    const aiProvider = process.env.AI_PROVIDER?.toLowerCase();
    const aiApiKey = process.env.AI_API_KEY;

    if (!aiProvider || !aiApiKey || aiProvider === "mock") {
      // Use mock response
      const reply = getMockResponse(message);
      return NextResponse.json({ reply, provider: "mock" });
    }

    // Call real AI provider
    if (aiProvider === "openai") {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiApiKey}`,
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT.replace("{garage_context}", garageContext),
              },
              ...history.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: message },
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || getMockResponse(message);
        return NextResponse.json({
          reply,
          provider: "openai",
          tokensUsed: data.usage?.total_tokens,
        });
      } catch (e) {
        // Fallback to mock
        return NextResponse.json({ reply: getMockResponse(message), provider: "mock-fallback" });
      }
    }

    if (aiProvider === "anthropic") {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": aiApiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || "claude-3-haiku-20240307",
            max_tokens: 500,
            system: SYSTEM_PROMPT.replace("{garage_context}", garageContext),
            messages: [
              ...history.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: message },
            ],
          }),
        });

        const data = await response.json();
        const reply = data.content?.[0]?.text || getMockResponse(message);
        return NextResponse.json({
          reply,
          provider: "anthropic",
          tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
        });
      } catch (e) {
        // Fallback to mock
        return NextResponse.json({ reply: getMockResponse(message), provider: "mock-fallback" });
      }
    }

    // Unknown provider, use mock
    return NextResponse.json({ reply: getMockResponse(message), provider: "mock" });
  } catch (error) {
    console.error("[COPILOT_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne", reply: "Désolé, une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
