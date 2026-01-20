"use client";

import { useState } from "react";
import { 
  Sparkles, 
  ClipboardList, 
  MessageSquare, 
  AlertTriangle, 
  RefreshCw,
  Copy,
  Check,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";

// ============================================
// Types
// ============================================

type AIMode = "CHECKLIST" | "SUMMARY" | "RISKS";

interface AISuggestion {
  mode: AIMode;
  content: string;
  disclaimer: string;
  quotaRemaining: number;
  quotaLimit: number;
}

interface AIAssistCardProps {
  interventionId: string;
  hasActiveSubscription: boolean;
  hasPlan: "FREE" | "STARTER" | "PRO";
}

// ============================================
// Mode Configuration
// ============================================

const MODES: { value: AIMode; label: string; icon: typeof ClipboardList; description: string }[] = [
  { 
    value: "CHECKLIST", 
    label: "Checklist", 
    icon: ClipboardList,
    description: "Points de vérification structurés",
  },
  { 
    value: "SUMMARY", 
    label: "Résumé client", 
    icon: MessageSquare,
    description: "Explication accessible sans jargon",
  },
  { 
    value: "RISKS", 
    label: "Points d'attention", 
    icon: AlertTriangle,
    description: "Risques et précautions",
  },
];

// ============================================
// Component
// ============================================

export function AIAssistCard({ interventionId, hasActiveSubscription, hasPlan }: AIAssistCardProps) {
  const [loading, setLoading] = useState<AIMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AISuggestion | null>(null);
  const [copied, setCopied] = useState(false);

  // AI is only available for PRO plan
  const aiEnabled = hasPlan === "PRO" && hasActiveSubscription;

  const handleGenerate = async (mode: AIMode) => {
    if (!aiEnabled) return;
    
    setLoading(mode);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch(`/api/ai/interventions/${interventionId}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        const errorMessage = json?.error?.message || json?.error || `Erreur ${res.status}`;
        throw new Error(errorMessage);
      }
      
      if (json.ok && json.data) {
        setResult(json.data);
      } else {
        throw new Error("Réponse invalide");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(null);
    }
  };

  const handleCopy = async () => {
    if (!result?.content) return;
    
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = result.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
  };

  // Don't render anything for FREE/STARTER plans
  if (!aiEnabled) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Sparkles size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Assistant IA</h3>
            <p className="text-xs text-muted2">Suggestions automatiques</p>
          </div>
        </div>
        <div className="ms-cardBody">
          <div className="rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 text-center">
            <Sparkles size={24} className="mx-auto text-purple-500 mb-2" />
            <p className="font-medium text-purple-800">Fonctionnalité Pro</p>
            <p className="text-sm text-purple-600 mt-1">
              Passez au plan Pro pour bénéficier de l&apos;assistant IA
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="ms-cardHeader flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Sparkles size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Assistant IA</h3>
            <p className="text-xs text-muted2">Suggestions automatiques</p>
          </div>
        </div>
        {result && (
          <div className="text-xs text-muted2">
            {result.quotaRemaining}/{result.quotaLimit} restants ce mois
          </div>
        )}
      </div>
      
      <div className="ms-cardBody">
        {/* Mode buttons */}
        {!result && (
          <div className="space-y-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isLoading = loading === mode.value;
              
              return (
                <button
                  key={mode.value}
                  onClick={() => handleGenerate(mode.value)}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-3 rounded-xl border border-[var(--ms-border)] p-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    {isLoading ? (
                      <RefreshCw size={18} className="text-purple-600 animate-spin" />
                    ) : (
                      <Icon size={18} className="text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{mode.label}</p>
                    <p className="text-xs text-muted2">{mode.description}</p>
                  </div>
                  {isLoading && (
                    <span className="text-xs text-purple-600">Génération...</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Erreur</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              <button
                onClick={handleClear}
                className="text-red-400 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              className="mt-3"
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* Result display */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {MODES.find((m) => m.value === result.mode)?.icon && (
                  <span className="text-purple-600">
                    {(() => {
                      const ModeIcon = MODES.find((m) => m.value === result.mode)!.icon;
                      return <ModeIcon size={16} />;
                    })()}
                  </span>
                )}
                <span className="text-sm font-medium">
                  {MODES.find((m) => m.value === result.mode)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  title="Copier"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="mr-1 text-green-500" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="mr-1" />
                      Copier
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  title="Fermer"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="rounded-xl bg-[var(--ms-bg-subtle)] border border-[var(--ms-border)] p-4">
              <div 
                className="prose prose-sm max-w-none text-[var(--ms-text)]"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {result.content}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              {result.disclaimer}
            </div>

            {/* Generate another */}
            <div className="flex flex-wrap gap-2">
              {MODES.filter((m) => m.value !== result.mode).map((mode) => {
                const Icon = mode.icon;
                return (
                  <Button
                    key={mode.value}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleGenerate(mode.value)}
                    disabled={loading !== null}
                  >
                    {loading === mode.value ? (
                      <RefreshCw size={14} className="mr-1 animate-spin" />
                    ) : (
                      <Icon size={14} className="mr-1" />
                    )}
                    {mode.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
