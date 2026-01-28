"use client";

/**
 * COPILOT-BUTTON: AI Assistant Floating Button
 * 
 * A floating button that opens the AI Copilot panel.
 * Visible on all pages in the dashboard.
 */

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Lightbulb,
  Zap,
  Calculator,
  FileText,
  Users,
  Car,
  Wrench,
  ChevronDown,
  ChevronUp,
  Bot,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

// ============================================================================
// Quick Actions
// ============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "analyze-client",
    icon: <Users size={14} />,
    label: "Analyser mes clients",
    prompt: "Analyse mes clients et donne-moi des insights sur mon portefeuille. Quels clients n'ont pas eu d'intervention récemment ?",
  },
  {
    id: "revenue-tips",
    icon: <Calculator size={14} />,
    label: "Augmenter mon CA",
    prompt: "Donne-moi 5 conseils concrets pour augmenter mon chiffre d'affaires ce mois-ci basé sur mon activité.",
  },
  {
    id: "e85-opportunities",
    icon: <Zap size={14} />,
    label: "Opportunités E85",
    prompt: "Quels véhicules de ma flotte seraient éligibles à une conversion E85 ? Estime le potentiel de CA.",
  },
  {
    id: "draft-quote",
    icon: <FileText size={14} />,
    label: "Aide devis",
    prompt: "Aide-moi à rédiger un devis professionnel. De quelles informations as-tu besoin ?",
  },
  {
    id: "vehicle-check",
    icon: <Car size={14} />,
    label: "Diagnostic véhicule",
    prompt: "Guide-moi pour diagnostiquer un problème sur un véhicule. Quels symptômes observe-t-on ?",
  },
  {
    id: "intervention-tips",
    icon: <Wrench size={14} />,
    label: "Conseils intervention",
    prompt: "Donne-moi des conseils pour optimiser mes interventions et réduire le temps de traitement.",
  },
];

// ============================================================================
// Main Component
// ============================================================================

export function CopilotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowActions(false);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6), // Last 6 messages for context
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Je suis désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (_err) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Une erreur est survenue. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt);
  };

  const handleClear = () => {
    setMessages([]);
    setShowActions(true);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        aria-label="Ouvrir l'assistant IA"
      >
        <Sparkles size={20} />
        <span className="hidden sm:inline">Copilot IA</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized
          ? "bottom-6 right-6 w-auto"
          : "bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-[500px] sm:h-[600px]"
      }`}
    >
      {isMinimized ? (
        // Minimized state
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Bot size={20} />
          <span>Copilot</span>
          <ChevronUp size={16} />
        </button>
      ) : (
        // Full panel
        <div className="flex flex-col h-full bg-[var(--ms-surface)] border border-[var(--ms-border)] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-semibold text-sm">SafeMotor Copilot</div>
                <div className="text-xs text-white/70">Votre assistant IA</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Minimiser"
              >
                <ChevronDown size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && showActions && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                    <Lightbulb size={32} className="text-indigo-500" />
                  </div>
                  <h3 className="font-semibold text-[var(--ms-text)] mb-1">Comment puis-je vous aider ?</h3>
                  <p className="text-sm text-[var(--ms-text-secondary)]">
                    Posez-moi une question ou choisissez une action rapide
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center gap-2 p-3 rounded-xl bg-[var(--ms-bg-subtle)] hover:bg-[var(--ms-surface-hover)] text-left transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                        {action.icon}
                      </div>
                      <span className="text-xs font-medium text-[var(--ms-text)]">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-indigo-500 text-white rounded-br-md"
                      : "bg-[var(--ms-bg-subtle)] text-[var(--ms-text)] rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      msg.role === "user" ? "text-white/60" : "text-[var(--ms-text-muted)]"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--ms-bg-subtle)] text-[var(--ms-text-secondary)]">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Réflexion en cours...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[var(--ms-border)]">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="w-full mb-2 text-xs text-[var(--ms-text-muted)] hover:text-[var(--ms-text)] transition-colors"
              >
                Nouvelle conversation
              </button>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--ms-bg-subtle)] border border-[var(--ms-border)] text-sm text-[var(--ms-text)] placeholder:text-[var(--ms-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-3 rounded-xl bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-xs text-center text-[var(--ms-text-muted)] mt-2">
              Propulsé par IA • Les réponses peuvent être imprécises
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
