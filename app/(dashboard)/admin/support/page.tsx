"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  LifeBuoy,
  RefreshCw,
  Search,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  MessageSquare,
  Building2,
  User,
  Phone,
  Filter,
  AlertTriangle,
  Zap,
  Book,
  Link2,
  Sparkles,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fetcher, requestJson } from "@/lib/fetcher";
import { getMacros, applyMacroVariables, type SupportMacro } from "@/content/supportMacros";

// ============================================
// Types
// ============================================

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  requesterName: string | null;
  requesterEmail: string | null;
  lastReplyAt: string | null;
  createdAt: string;
  slaTargetAt: string | null;
  slaBreachedAt: string | null;
  lastRequesterMessageAt: string | null;
  lastAdminMessageAt: string | null;
  garage: { name: string } | null;
};

type TicketDetail = Ticket & {
  requesterPhone: string | null;
  messages: {
    id: string;
    authorType: string;
    authorUserId: string | null;
    message: string;
    createdAt: string;
  }[];
};

type KbSuggestion = {
  id: number;
  title: string;
  slug: string;
  categoryName: string;
};

// AI-SUGGEST-01: AI Suggestion types
type AiSuggestion = {
  suggested_category: string | null;
  suggested_priority: string | null;
  confidence: number;
  summary_internal: string;
  draft_reply_fr: string;
  clarifying_questions: string[];
  kb_suggestions: string[];
  next_actions_internal: string[];
};

type AiSuggestionResponse = {
  success: boolean;
  suggestion?: AiSuggestion;
  cached?: boolean;
  error?: string;
  message?: string;
  meta?: {
    provider?: string;
    tokensUsed?: number;
  };
  rateLimit?: {
    adminRemaining: number;
    adminResetAt: string;
  };
};

// ============================================
// SLA Helpers
// ============================================

const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

function isSlaBreached(ticket: Ticket): boolean {
  if (ticket.slaBreachedAt) return true;
  if (!ticket.slaTargetAt) return false;
  return new Date(ticket.slaTargetAt) < new Date();
}

function getSlaRemainingMs(slaTargetAt: string | null): number | null {
  if (!slaTargetAt) return null;
  return new Date(slaTargetAt).getTime() - Date.now();
}

function formatSlaRemaining(ms: number | null): string {
  if (ms === null) return "—";
  if (ms <= 0) return "Dépassé";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}j ${hours % 24}h`;
  }
  return `${hours}h ${minutes}min`;
}

function getTimeSinceMessage(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `il y a ${days}j`;
  if (hours > 0) return `il y a ${hours}h`;
  return `il y a ${minutes}min`;
}

function sortTickets(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    // 1. SLA breached first
    const aBreached = isSlaBreached(a);
    const bBreached = isSlaBreached(b);
    if (aBreached && !bBreached) return -1;
    if (!aBreached && bBreached) return 1;

    // 2. Priority (URGENT > HIGH > NORMAL > LOW)
    const aPriority = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 2;
    const bPriority = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 2;
    if (aPriority !== bPriority) return aPriority - bPriority;

    // 3. Waiting longest (last requester message oldest first)
    const aLastMsg = a.lastRequesterMessageAt ? new Date(a.lastRequesterMessageAt).getTime() : new Date(a.createdAt).getTime();
    const bLastMsg = b.lastRequesterMessageAt ? new Date(b.lastRequesterMessageAt).getTime() : new Date(b.createdAt).getTime();
    return aLastMsg - bLastMsg;
  });
}

// ============================================
// Constants
// ============================================

const CATEGORIES = [
  { value: "BUG", label: "Bug technique" },
  { value: "BILLING", label: "Facturation" },
  { value: "FEATURE", label: "Fonctionnalité" },
  { value: "LEGAL", label: "Juridique" },
  { value: "OTHER", label: "Autre" },
];

const PRIORITIES = [
  { value: "LOW", label: "Basse", color: "text-gray-600", bg: "bg-gray-100" },
  { value: "NORMAL", label: "Normale", color: "text-blue-600", bg: "bg-blue-100" },
  { value: "HIGH", label: "Haute", color: "text-orange-600", bg: "bg-orange-100" },
  { value: "URGENT", label: "Urgente", color: "text-red-600", bg: "bg-red-100" },
];

const STATUSES = [
  { value: "OPEN", label: "Ouvert" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "WAITING_CUSTOMER", label: "En attente client" },
  { value: "RESOLVED", label: "Résolu" },
  { value: "CLOSED", label: "Fermé" },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  OPEN: { color: "text-blue-600", bg: "bg-blue-100", label: "Ouvert", icon: <Clock size={14} /> },
  IN_PROGRESS: { color: "text-yellow-600", bg: "bg-yellow-100", label: "En cours", icon: <Loader2 size={14} className="animate-spin" /> },
  WAITING_CUSTOMER: { color: "text-orange-600", bg: "bg-orange-100", label: "En attente", icon: <AlertCircle size={14} /> },
  RESOLVED: { color: "text-green-600", bg: "bg-green-100", label: "Résolu", icon: <CheckCircle size={14} /> },
  CLOSED: { color: "text-gray-500", bg: "bg-gray-100", label: "Fermé", icon: <CheckCircle size={14} /> },
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  EMAIL: <Mail size={14} />,
  WHATSAPP: <MessageSquare size={14} />,
  FORM: <Building2 size={14} />,
};

// ============================================
// Component
// ============================================

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Reply
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);
  const [macros] = useState<SupportMacro[]>(() => getMacros());

  // KB Suggestions
  const [kbSuggestions, setKbSuggestions] = useState<KbSuggestion[]>([]);
  const [loadingKb, setLoadingKb] = useState(false);

  // AI-SUGGEST-01: AI Suggestions state
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiCached, setAiCached] = useState(false);

  // Status/Priority change
  const [changingStatus, setChangingStatus] = useState(false);
  const [changingPriority, setChangingPriority] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      const url = `/api/admin/support/tickets${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetcher<{ tickets: Ticket[]; total: number }>(url);
      setTickets(res.tickets);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  const loadTicketDetail = useCallback(async (id: string) => {
    try {
      setLoadingTicket(true);
      setKbSuggestions([]);
      const res = await fetcher<TicketDetail>(`/api/admin/support/tickets/${id}`);
      setSelectedTicket(res);
      
      // Reset AI state when loading new ticket
      setAiSuggestion(null);
      setAiError(null);
      setAiExpanded(false);
      setAiCached(false);
      
      // Load KB suggestions based on subject and first message
      setLoadingKb(true);
      try {
        const firstMessage = res.messages[0]?.message || "";
        const searchQuery = `${res.subject} ${firstMessage}`.slice(0, 100);
        const kbRes = await fetcher<{ articles: KbSuggestion[] }>(
          `/api/kb/articles?query=${encodeURIComponent(searchQuery)}&limit=3`
        );
        setKbSuggestions(kbRes.articles);
      } catch {
        // KB suggestions are optional, don't fail if unavailable
      } finally {
        setLoadingKb(false);
      }
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoadingTicket(false);
    }
  }, []);

  // AI-SUGGEST-01: Load AI suggestion for current ticket
  const loadAiSuggestion = useCallback(async () => {
    if (!selectedTicket) return;
    
    try {
      setLoadingAi(true);
      setAiError(null);
      const res = await requestJson<AiSuggestionResponse>(
        `/api/admin/support/tickets/${selectedTicket.id}/ai-suggest`,
        { method: "POST", body: {} }
      );
      
      if (res.success && res.suggestion) {
        setAiSuggestion(res.suggestion);
        setAiCached(res.cached ?? false);
        setAiExpanded(true);
      } else {
        setAiError(res.message || res.error || "Erreur inconnue");
      }
    } catch (err) {
      console.error("Failed to load AI suggestion:", err);
      if (err instanceof Error) {
        setAiError(err.message);
      } else {
        setAiError("Erreur lors de la génération");
      }
    } finally {
      setLoadingAi(false);
    }
  }, [selectedTicket]);

  // Use AI draft reply
  const handleUseAiDraft = useCallback(() => {
    if (aiSuggestion?.draft_reply_fr) {
      setReplyMessage(aiSuggestion.draft_reply_fr);
    }
  }, [aiSuggestion]);

  // Copy AI draft to clipboard
  const handleCopyAiDraft = useCallback(async () => {
    if (aiSuggestion?.draft_reply_fr) {
      try {
        await navigator.clipboard.writeText(aiSuggestion.draft_reply_fr);
      } catch {
        // Fallback if clipboard API fails
        console.error("Failed to copy to clipboard");
      }
    }
  }, [aiSuggestion]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setReplying(true);
      await requestJson(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
        body: { message: replyMessage },
      });
      setReplyMessage("");
      void loadTicketDetail(selectedTicket.id);
      void loadTickets();
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;

    try {
      setChangingStatus(true);
      await requestJson(`/api/admin/support/tickets/${selectedTicket.id}/status`, {
        body: { status },
      });
      void loadTicketDetail(selectedTicket.id);
      void loadTickets();
    } catch (err) {
      console.error("Failed to change status:", err);
    } finally {
      setChangingStatus(false);
    }
  };

  const handlePriorityChange = async (priority: string) => {
    if (!selectedTicket) return;

    try {
      setChangingPriority(true);
      await requestJson(`/api/admin/support/tickets/${selectedTicket.id}/priority`, {
        body: { priority },
      });
      void loadTicketDetail(selectedTicket.id);
      void loadTickets();
    } catch (err) {
      console.error("Failed to change priority:", err);
    } finally {
      setChangingPriority(false);
    }
  };

  // AI-SUGGEST-01: Change category from AI suggestion
  const handleCategoryChange = async (category: string) => {
    if (!selectedTicket) return;

    try {
      await requestJson(`/api/admin/support/tickets/${selectedTicket.id}/category`, {
        body: { category },
      });
      void loadTicketDetail(selectedTicket.id);
      void loadTickets();
    } catch (err) {
      console.error("Failed to change category:", err);
    }
  };

  // Filter tickets locally by search, then sort by SLA/priority
  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
      if (!search) return true;
      const lowerSearch = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(lowerSearch) ||
        t.requesterName?.toLowerCase().includes(lowerSearch) ||
        t.requesterEmail?.toLowerCase().includes(lowerSearch) ||
        t.garage?.name.toLowerCase().includes(lowerSearch) ||
        t.id.toLowerCase().includes(lowerSearch)
      );
    });
    return sortTickets(filtered);
  }, [tickets, search]);

  // Stats
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const urgentCount = tickets.filter((t) => t.priority === "URGENT" && t.status !== "CLOSED").length;
  const slaBreachedCount = tickets.filter((t) => isSlaBreached(t) && t.status !== "CLOSED" && t.status !== "RESOLVED").length;

  // Macro handler
  const handleMacroSelect = (macroId: string) => {
    const macro = macros.find((m) => m.id === macroId);
    if (!macro || !selectedTicket) return;
    const applied = applyMacroVariables(macro.body, {
      ticketId: selectedTicket.id,
      garageName: selectedTicket.garage?.name,
      clientName: selectedTicket.requesterName ?? undefined,
    });
    setReplyMessage(applied);
  };

  // Insert KB article link into reply
  const handleInsertKbLink = (article: KbSuggestion) => {
    const link = `\n\nVoici une aide qui peut résoudre votre cas :\n👉 ${article.title} — /aide/${article.slug}`;
    setReplyMessage((prev) => prev + link);
  };

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Support Admin</h1>
          <p className="ms-page-subtitle">Gestion des tickets de support</p>
        </div>
        <button
          type="button"
          onClick={() => void loadTickets()}
          className="ms-btn ms-btn-secondary"
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="ms-card">
          <div className="ms-card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--ms-text-muted)]">Total tickets</p>
                <p className="text-2xl font-bold text-[var(--ms-text)]">{tickets.length}</p>
              </div>
              <LifeBuoy size={24} className="text-[var(--ms-primary)]" />
            </div>
          </div>
        </div>
        <div className="ms-card">
          <div className="ms-card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--ms-text-muted)]">Ouverts</p>
                <p className="text-2xl font-bold text-blue-600">{openCount}</p>
              </div>
              <Clock size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="ms-card">
          <div className="ms-card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--ms-text-muted)]">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">{inProgressCount}</p>
              </div>
              <Loader2 size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="ms-card">
          <div className="ms-card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--ms-text-muted)]">Urgents</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="ms-card border-red-200">
          <div className="ms-card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--ms-text-muted)]">En retard SLA</p>
                <p className="text-2xl font-bold text-red-600">{slaBreachedCount}</p>
              </div>
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--ms-text-muted)]" />
          <span className="text-sm font-medium text-[var(--ms-text)]">Filtres:</span>
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ms-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="ms-input w-full pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ms-input"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="ms-input"
        >
          <option value="">Toutes priorités</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-[var(--ms-border)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-[var(--ms-text)]">{selectedTicket.subject}</h2>
                  <p className="text-sm text-[var(--ms-text-muted)]">#{selectedTicket.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
                >
                  ✕
                </button>
              </div>

              {/* Ticket meta */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {selectedTicket.garage ? (
                    <>
                      <Building2 size={14} className="text-[var(--ms-text-muted)]" />
                      <span className="font-medium">{selectedTicket.garage.name}</span>
                    </>
                  ) : (
                    <>
                      <User size={14} className="text-[var(--ms-text-muted)]" />
                      <span>Visiteur public</span>
                    </>
                  )}
                </div>
                {selectedTicket.requesterEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[var(--ms-text-muted)]" />
                    <a href={`mailto:${selectedTicket.requesterEmail}`} className="text-[var(--ms-primary)] hover:underline">
                      {selectedTicket.requesterEmail}
                    </a>
                  </div>
                )}
                {selectedTicket.requesterPhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[var(--ms-text-muted)]" />
                    <a href={`tel:${selectedTicket.requesterPhone}`} className="text-[var(--ms-primary)] hover:underline">
                      {selectedTicket.requesterPhone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[var(--ms-text-muted)]">
                  {CHANNEL_ICON[selectedTicket.channel]}
                  <span>{selectedTicket.channel}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--ms-text-muted)]">Statut:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => void handleStatusChange(e.target.value)}
                    disabled={changingStatus}
                    className="ms-input text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--ms-text-muted)]">Priorité:</span>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => void handlePriorityChange(e.target.value)}
                    disabled={changingPriority}
                    className="ms-input text-sm"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* SLA Info */}
                {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                  <div className="ml-auto flex items-center gap-3">
                    {isSlaBreached(selectedTicket) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        <AlertTriangle size={12} />
                        En retard SLA
                      </span>
                    ) : selectedTicket.slaTargetAt && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--ms-text-muted)]">
                        <Clock size={12} />
                        SLA: {formatSlaRemaining(getSlaRemainingMs(selectedTicket.slaTargetAt))}
                      </span>
                    )}
                    {selectedTicket.lastRequesterMessageAt && (
                      <span className="text-xs text-[var(--ms-text-muted)]">
                        Client: {getTimeSinceMessage(selectedTicket.lastRequesterMessageAt)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingTicket ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-[var(--ms-primary)]" />
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-lg p-3 ${
                        msg.authorType === "ADMIN"
                          ? "ml-8 bg-blue-50 border border-blue-100"
                          : msg.authorType === "GARAGE_USER"
                          ? "mr-8 bg-green-50 border border-green-100"
                          : "mr-8 bg-gray-50 border border-gray-100"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between text-xs text-[var(--ms-text-muted)]">
                        <span className="font-medium">
                          {msg.authorType === "ADMIN"
                            ? "Support (vous)"
                            : msg.authorType === "GARAGE_USER"
                            ? `Garage: ${selectedTicket.requesterName || "Utilisateur"}`
                            : selectedTicket.requesterName || "Visiteur"}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleString("fr-FR")}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-[var(--ms-text)]">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KB Suggestions */}
            {(kbSuggestions.length > 0 || loadingKb) && (
              <div className="border-t border-[var(--ms-border)] bg-blue-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-700">
                  <Book size={14} />
                  Articles suggérés
                  {loadingKb && <Loader2 size={12} className="animate-spin" />}
                </div>
                {kbSuggestions.length > 0 && (
                  <div className="space-y-1">
                    {kbSuggestions.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between rounded bg-white p-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-[var(--ms-text)]">{article.title}</span>
                          <span className="ml-2 text-xs text-[var(--ms-text-muted)]">
                            {article.categoryName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInsertKbLink(article)}
                          className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                        >
                          <Link2 size={12} />
                          Insérer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI-SUGGEST-01: AI Suggestions Panel */}
            <div className="border-t border-[var(--ms-border)] bg-purple-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-purple-700">
                  <Sparkles size={14} />
                  Réponse proposée
                  {aiCached && (
                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px]">
                      cache
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {aiSuggestion && (
                    <button
                      type="button"
                      onClick={() => setAiExpanded(!aiExpanded)}
                      className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                    >
                      {aiExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {aiExpanded ? "Réduire" : "Afficher"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void loadAiSuggestion()}
                    disabled={loadingAi}
                    className="inline-flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loadingAi ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    {aiSuggestion ? "Actualiser" : "Générer"}
                  </button>
                </div>
              </div>

              {/* AI Error */}
              {aiError && (
                <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-700">
                  {aiError}
                </div>
              )}

              {/* AI Suggestion Content */}
              {aiSuggestion && aiExpanded && (
                <div className="mt-3 space-y-3">
                  {/* Internal Summary (admin only) */}
                  <div className="rounded bg-white p-2">
                    <div className="mb-1 text-[10px] font-medium uppercase text-purple-600">
                      Résumé interne
                    </div>
                    <p className="text-xs text-[var(--ms-text)]">
                      {aiSuggestion.summary_internal}
                    </p>
                  </div>

                  {/* Category/Priority Suggestions */}
                  {(aiSuggestion.suggested_category || aiSuggestion.suggested_priority) && (
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestion.suggested_category && aiSuggestion.suggested_category !== selectedTicket?.category && (
                        <button
                          type="button"
                          onClick={() => void handleCategoryChange(aiSuggestion.suggested_category!)}
                          className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800 hover:bg-yellow-200"
                        >
                          Catégorie suggérée: {CATEGORIES.find(c => c.value === aiSuggestion.suggested_category)?.label}
                          <span className="text-[10px] opacity-70">
                            ({Math.round(aiSuggestion.confidence * 100)}%)
                          </span>
                        </button>
                      )}
                      {aiSuggestion.suggested_priority && aiSuggestion.suggested_priority !== selectedTicket?.priority && (
                        <button
                          type="button"
                          onClick={() => void handlePriorityChange(aiSuggestion.suggested_priority!)}
                          className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs text-orange-800 hover:bg-orange-200"
                        >
                          Priorité suggérée: {PRIORITIES.find(p => p.value === aiSuggestion.suggested_priority)?.label}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Draft Reply */}
                  <div className="rounded bg-white p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase text-purple-600">
                        Brouillon de réponse
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handleCopyAiDraft}
                          className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-200"
                        >
                          <Copy size={10} />
                          Copier
                        </button>
                        <button
                          type="button"
                          onClick={handleUseAiDraft}
                          className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700 hover:bg-purple-200"
                        >
                          Utiliser
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-[var(--ms-text)]">
                      {aiSuggestion.draft_reply_fr}
                    </p>
                  </div>

                  {/* Clarifying Questions */}
                  {aiSuggestion.clarifying_questions.length > 0 && (
                    <div className="rounded bg-white p-2">
                      <div className="mb-1 text-[10px] font-medium uppercase text-purple-600">
                        Questions de clarification
                      </div>
                      <ul className="list-inside list-disc text-xs text-[var(--ms-text)]">
                        {aiSuggestion.clarifying_questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* KB Suggestions from AI */}
                  {aiSuggestion.kb_suggestions.length > 0 && (
                    <div className="rounded bg-white p-2">
                      <div className="mb-1 text-[10px] font-medium uppercase text-purple-600">
                        Articles KB suggérés
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {aiSuggestion.kb_suggestions.map((slug, i) => (
                          <span
                            key={i}
                            className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700"
                          >
                            {slug}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Actions (internal) */}
                  {aiSuggestion.next_actions_internal.length > 0 && (
                    <div className="rounded bg-yellow-50 p-2">
                      <div className="mb-1 text-[10px] font-medium uppercase text-yellow-700">
                        Actions suggérées (interne)
                      </div>
                      <ul className="list-inside list-disc text-xs text-yellow-800">
                        {aiSuggestion.next_actions_internal.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reply Form */}
            <div className="border-t border-[var(--ms-border)] p-4">
              {/* Macros */}
              <div className="mb-2 flex items-center gap-2">
                <Zap size={14} className="text-[var(--ms-text-muted)]" />
                <span className="text-xs text-[var(--ms-text-muted)]">Macros:</span>
                <select
                  value=""
                  onChange={(e) => handleMacroSelect(e.target.value)}
                  className="ms-input text-xs"
                >
                  <option value="">Sélectionner une macro...</option>
                  {macros.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Votre réponse..."
                  className="ms-input flex-1"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={replying || !replyMessage.trim()}
                  className="ms-btn ms-btn-primary"
                >
                  {replying ? <Loader2 size={16} className="animate-spin" /> : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="ms-card">
        <div className="ms-card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[var(--ms-primary)]" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-8 text-center text-[var(--ms-text-muted)]">
              {tickets.length === 0 ? "Aucun ticket" : "Aucun résultat pour cette recherche"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--ms-border)] bg-[var(--ms-bg)]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">Demandeur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">Catégorie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">Priorité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">SLA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ms-border)]">
                  {filteredTickets.map((ticket) => {
                    const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                    const priorityCfg = PRIORITIES.find((p) => p.value === ticket.priority) || PRIORITIES[1];
                    const breached = isSlaBreached(ticket);
                    const slaRemaining = getSlaRemainingMs(ticket.slaTargetAt);
                    const isActive = ticket.status !== "CLOSED" && ticket.status !== "RESOLVED";
                    return (
                      <tr
                        key={ticket.id}
                        className={`cursor-pointer transition-colors hover:bg-[var(--ms-bg)] ${breached && isActive ? "bg-red-50" : ""}`}
                        onClick={() => void loadTicketDetail(ticket.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--ms-text)]">{ticket.subject}</span>
                            {breached && isActive && (
                              <AlertTriangle size={14} className="text-red-500" />
                            )}
                          </div>
                          <div className="text-xs text-[var(--ms-text-muted)]">#{ticket.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-[var(--ms-text)]">{ticket.requesterName || "—"}</div>
                          <div className="text-xs text-[var(--ms-text-muted)]">
                            {ticket.garage?.name || "Visiteur public"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[var(--ms-text)]">
                            {CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityCfg.bg} ${priorityCfg.color}`}>
                            {priorityCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isActive ? (
                            breached ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                En retard
                              </span>
                            ) : slaRemaining !== null ? (
                              <span className={`text-xs ${slaRemaining < 2 * 60 * 60 * 1000 ? "text-orange-600 font-medium" : "text-[var(--ms-text-muted)]"}`}>
                                {formatSlaRemaining(slaRemaining)}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--ms-text-muted)]">—</span>
                            )
                          ) : (
                            <span className="text-xs text-[var(--ms-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--ms-text-muted)]">
                          {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight size={16} className="text-[var(--ms-text-muted)]" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
