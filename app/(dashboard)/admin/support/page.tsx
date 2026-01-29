"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  LifeBuoy,
  RefreshCw,
  Search,
  ChevronRight,
  Clock,
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
  X,
} from "lucide-react";
import { fetcher, requestJson } from "@/lib/fetcher";
import { getMacros, applyMacroVariables, type SupportMacro } from "@/content/supportMacros";

// Responsive hook
function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen };
}

// Types
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

type KbSuggestion = { id: number; title: string; slug: string; categoryName: string };
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
type AiSuggestionResponse = { success: boolean; suggestion?: AiSuggestion; cached?: boolean; error?: string; message?: string };
type AiRepliesData = {
  summary_internal: string;
  replies: { short: string; pro: string; detailed: string };
  clarifying_questions: string[];
  kb_links: Array<{ title: string; slug: string; why: string }>;
  style_notes_internal: string[];
};
type AiRepliesResponse = { success: boolean; data?: AiRepliesData; error?: string; message?: string };
type AiRewriteResponse = { success: boolean; rewrittenText?: string; changes?: string[]; error?: string; message?: string };
type ReplyTone = "neutral" | "friendly" | "firm";
type ReplyVariant = "short" | "pro" | "detailed";

// SLA Helpers
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
  if (hours > 24) return `${Math.floor(hours / 24)}j ${hours % 24}h`;
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
    const aBreached = isSlaBreached(a);
    const bBreached = isSlaBreached(b);
    if (aBreached && !bBreached) return -1;
    if (!aBreached && bBreached) return 1;
    const aPriority = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 2;
    const bPriority = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    const aLastMsg = a.lastRequesterMessageAt ? new Date(a.lastRequesterMessageAt).getTime() : new Date(a.createdAt).getTime();
    const bLastMsg = b.lastRequesterMessageAt ? new Date(b.lastRequesterMessageAt).getTime() : new Date(b.createdAt).getTime();
    return aLastMsg - bLastMsg;
  });
}

// Constants
const CATEGORIES = [
  { value: "BUG", label: "Bug technique" },
  { value: "BILLING", label: "Facturation" },
  { value: "FEATURE", label: "Fonctionnalité" },
  { value: "LEGAL", label: "Juridique" },
  { value: "OTHER", label: "Autre" },
];
const PRIORITIES = [
  { value: "LOW", label: "Basse", color: "#6B7280", bg: "#F3F4F6" },
  { value: "NORMAL", label: "Normale", color: "#2563EB", bg: "#DBEAFE" },
  { value: "HIGH", label: "Haute", color: "#D97706", bg: "#FEF3C7" },
  { value: "URGENT", label: "Urgente", color: "#DC2626", bg: "#FEE2E2" },
];
const STATUSES = [
  { value: "OPEN", label: "Ouvert" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "WAITING_CUSTOMER", label: "En attente client" },
  { value: "RESOLVED", label: "Résolu" },
  { value: "CLOSED", label: "Fermé" },
];
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  OPEN: { color: "#2563EB", bg: "#DBEAFE", label: "Ouvert" },
  IN_PROGRESS: { color: "#D97706", bg: "#FEF3C7", label: "En cours" },
  WAITING_CUSTOMER: { color: "#EA580C", bg: "#FFEDD5", label: "En attente" },
  RESOLVED: { color: "#059669", bg: "#D1FAE5", label: "Résolu" },
  CLOSED: { color: "#6B7280", bg: "#F3F4F6", label: "Fermé" },
};

export default function AdminSupportPage() {
  const { isMobile, isTablet } = useResponsive();
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

  // AI Suggestions
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiCached, setAiCached] = useState(false);

  // AI Reply variants
  const [aiReplies, setAiReplies] = useState<AiRepliesData | null>(null);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [replyTone, setReplyTone] = useState<ReplyTone>("neutral");
  const [selectedVariant, setSelectedVariant] = useState<ReplyVariant>("pro");
  const [rewriting, setRewriting] = useState(false);

  // Status/Priority change
  const [changingStatus, setChangingStatus] = useState(false);
  const [changingPriority, setChangingPriority] = useState(false);

  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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
      setAiSuggestion(null);
      setAiError(null);
      setAiExpanded(false);
      setAiCached(false);
      setAiReplies(null);
      setRepliesError(null);
      setSelectedVariant("pro");
      setLoadingKb(true);
      try {
        const firstMessage = res.messages[0]?.message || "";
        const searchQuery = `${res.subject} ${firstMessage}`.slice(0, 100);
        const kbRes = await fetcher<{ articles: KbSuggestion[] }>(`/api/kb/articles?query=${encodeURIComponent(searchQuery)}&limit=3`);
        setKbSuggestions(kbRes.articles);
      } catch {
        // KB suggestions are optional
      } finally {
        setLoadingKb(false);
      }
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoadingTicket(false);
    }
  }, []);

  const loadAiSuggestion = useCallback(async () => {
    if (!selectedTicket) return;
    try {
      setLoadingAi(true);
      setAiError(null);
      const res = await requestJson<AiSuggestionResponse>(`/api/admin/support/tickets/${selectedTicket.id}/ai-suggest`, { method: "POST", body: {} });
      if (res.success && res.suggestion) {
        setAiSuggestion(res.suggestion);
        setAiCached(res.cached ?? false);
        setAiExpanded(true);
      } else {
        setAiError(res.message || res.error || "Erreur inconnue");
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setLoadingAi(false);
    }
  }, [selectedTicket]);

  const handleUseAiDraft = useCallback(() => {
    if (aiSuggestion?.draft_reply_fr) setReplyMessage(aiSuggestion.draft_reply_fr);
  }, [aiSuggestion]);

  const handleCopyAiDraft = useCallback(async () => {
    if (aiSuggestion?.draft_reply_fr) {
      try {
        await navigator.clipboard.writeText(aiSuggestion.draft_reply_fr);
      } catch {}
    }
  }, [aiSuggestion]);

  const loadAiReplies = useCallback(async () => {
    if (!selectedTicket) return;
    try {
      setLoadingReplies(true);
      setRepliesError(null);
      const res = await requestJson<AiRepliesResponse>(`/api/admin/support/tickets/${selectedTicket.id}/ai-replies`, { method: "POST", body: { tone: replyTone, lengthBias: "medium" } });
      if (res.success && res.data) {
        setAiReplies(res.data);
      } else {
        setRepliesError(res.message || res.error || "Erreur inconnue");
      }
    } catch (err) {
      setRepliesError(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setLoadingReplies(false);
    }
  }, [selectedTicket, replyTone]);

  const handleUseVariant = useCallback((variant: ReplyVariant) => {
    if (aiReplies?.replies) {
      setReplyMessage(aiReplies.replies[variant]);
      setSelectedVariant(variant);
    }
  }, [aiReplies]);

  const handleInsertKbLink = useCallback((slugOrArticle: string | KbSuggestion, title?: string) => {
    let slug: string;
    let articleTitle: string;
    if (typeof slugOrArticle === "string") {
      slug = slugOrArticle;
      articleTitle = title || slug;
    } else {
      slug = slugOrArticle.slug;
      articleTitle = slugOrArticle.title;
    }
    const link = `\n\n📚 Pour plus d'informations, consultez notre article : ${articleTitle}\nhttps://motorsafe.fr/aide/${slug}`;
    setReplyMessage((prev) => prev + link);
  }, []);

  const handleInsertQuestion = useCallback((question: string) => {
    setReplyMessage((prev) => {
      const signatureMatch = prev.match(/\n\nCordialement,[\s\S]*$/);
      if (signatureMatch) {
        const beforeSig = prev.slice(0, signatureMatch.index);
        return beforeSig + `\n\n${question}` + signatureMatch[0];
      }
      return prev + `\n\n${question}`;
    });
  }, []);

  const handleRewrite = useCallback(async (instruction: "shorter" | "friendlier" | "firmer" | "clearer") => {
    if (!selectedTicket || !replyMessage.trim()) return;
    try {
      setRewriting(true);
      const res = await requestJson<AiRewriteResponse>(`/api/admin/support/tickets/${selectedTicket.id}/ai-rewrite`, { method: "POST", body: { text: replyMessage, instruction } });
      if (res.success && res.rewrittenText) {
        setReplyMessage(res.rewrittenText);
      } else {
        alert(res.message || res.error || "Erreur lors de la réécriture");
      }
    } catch {
      alert("Erreur lors de la réécriture");
    } finally {
      setRewriting(false);
    }
  }, [selectedTicket, replyMessage]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    try {
      setReplying(true);
      await requestJson(`/api/admin/support/tickets/${selectedTicket.id}/messages`, { body: { message: replyMessage } });
      setReplyMessage("");
      void loadTicketDetail(selectedTicket.id);
      void loadTickets();
    } catch {
      alert("Erreur lors de l'envoi du message");
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    try {
      setChangingStatus(true);
      await requestJson(`/api/admin/support/tickets/${selectedTicket.id}/status`, { body: { status } });
      void loadTicketDetail(selectedTicket.id);
      void loadTickets();
    } catch {
      console.error("Failed to change status");
    } finally {
      setChangingStatus(false);
    }
  };

  const handlePriorityChange = async (priority: string) => {
    if (!selectedTicket) return;
    try {
      setChangingPriority(true);
      await requestJson(`/api/admin/support/tickets/${selectedTicket.id}/priority`, { body: { priority } });
      void loadTicketDetail(selectedTicket.id);
      void loadTickets();
    } catch {
      console.error("Failed to change priority");
    } finally {
      setChangingPriority(false);
    }
  };

  const handleCategoryChange = async (category: string) => {
    if (!selectedTicket) return;
    try {
      await requestJson(`/api/admin/support/tickets/${selectedTicket.id}/category`, { body: { category } });
      void loadTicketDetail(selectedTicket.id);
      void loadTickets();
    } catch {}
  };

  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
      if (!search) return true;
      const lowerSearch = search.toLowerCase();
      return t.subject.toLowerCase().includes(lowerSearch) || t.requesterName?.toLowerCase().includes(lowerSearch) || t.requesterEmail?.toLowerCase().includes(lowerSearch) || t.garage?.name.toLowerCase().includes(lowerSearch) || t.id.toLowerCase().includes(lowerSearch);
    });
    return sortTickets(filtered);
  }, [tickets, search]);

  // Stats
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const urgentCount = tickets.filter((t) => t.priority === "URGENT" && t.status !== "CLOSED").length;
  const slaBreachedCount = tickets.filter((t) => isSlaBreached(t) && t.status !== "CLOSED" && t.status !== "RESOLVED").length;

  const handleMacroSelect = (macroId: string) => {
    const macro = macros.find((m) => m.id === macroId);
    if (!macro || !selectedTicket) return;
    const applied = applyMacroVariables(macro.body, { ticketId: selectedTicket.id, garageName: selectedTicket.garage?.name, clientName: selectedTicket.requesterName ?? undefined });
    setReplyMessage(applied);
  };

  const inputStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "14px", color: "#111827", background: "#fff", outline: "none" };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LifeBuoy size={24} color="#2563EB" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Support Admin</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Gestion des tickets de support</p>
          </div>
        </div>
        <button onClick={() => void loadTickets()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
          <RefreshCw size={16} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total tickets", value: tickets.length, color: "#6366F1", bg: "#EEF2FF", icon: LifeBuoy },
          { label: "Ouverts", value: openCount, color: "#2563EB", bg: "#DBEAFE", icon: Clock },
          { label: "En cours", value: inProgressCount, color: "#D97706", bg: "#FEF3C7", icon: Loader2 },
          { label: "Urgents", value: urgentCount, color: "#DC2626", bg: "#FEE2E2", icon: AlertCircle },
          { label: "Retard SLA", value: slaBreachedCount, color: "#DC2626", bg: "#FEE2E2", icon: AlertTriangle },
        ].map((stat, i) => (
          <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{stat.label}</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: stat.color, margin: "4px 0 0" }}>{stat.value}</p>
              </div>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={20} color={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={16} color="#6B7280" />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#374151" }}>Filtres:</span>
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "300px" }}>
          <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...inputStyle, width: "100%", paddingLeft: "36px" }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selectStyle}>
          <option value="">Toutes priorités</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Tickets Table */}
      <div style={{ borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
            <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#6B7280" }}>{tickets.length === 0 ? "Aucun ticket" : "Aucun résultat pour cette recherche"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Ticket</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Demandeur</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Catégorie</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Priorité</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Statut</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>SLA</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "14px 16px", width: "40px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                  const priorityCfg = PRIORITIES.find((p) => p.value === ticket.priority) || PRIORITIES[1];
                  const breached = isSlaBreached(ticket);
                  const slaRemaining = getSlaRemainingMs(ticket.slaTargetAt);
                  const isActive = ticket.status !== "CLOSED" && ticket.status !== "RESOLVED";
                  return (
                    <tr key={ticket.id} onClick={() => void loadTicketDetail(ticket.id)} style={{ cursor: "pointer", borderBottom: "1px solid #F3F4F6", background: hoveredRow === ticket.id ? "#F9FAFB" : breached && isActive ? "#FEF2F2" : "transparent", transition: "background 0.15s" }} onMouseEnter={() => setHoveredRow(ticket.id)} onMouseLeave={() => setHoveredRow(null)}>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{ticket.subject}</span>
                          {breached && isActive && <AlertTriangle size={14} color="#DC2626" />}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6B7280" }}>#{ticket.id.slice(0, 8)}</div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontSize: "14px", color: "#111827" }}>{ticket.requesterName || "—"}</div>
                        <div style={{ fontSize: "12px", color: "#6B7280" }}>{ticket.garage?.name || "Visiteur public"}</div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#111827" }}>
                        {CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: priorityCfg.bg, color: priorityCfg.color }}>{priorityCfg.label}</span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        {isActive ? (
                          breached ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, background: "#FEE2E2", color: "#DC2626" }}>En retard</span>
                          ) : slaRemaining !== null ? (
                            <span style={{ fontSize: "13px", color: slaRemaining < 2 * 60 * 60 * 1000 ? "#D97706" : "#6B7280", fontWeight: slaRemaining < 2 * 60 * 60 * 1000 ? 500 : 400 }}>{formatSlaRemaining(slaRemaining)}</span>
                          ) : (
                            <span style={{ fontSize: "13px", color: "#6B7280" }}>—</span>
                          )
                        ) : (
                          <span style={{ fontSize: "13px", color: "#6B7280" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#6B7280" }}>{new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td style={{ padding: "16px" }}>
                        <ChevronRight size={16} color="#9CA3AF" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", maxHeight: "90vh", width: "100%", maxWidth: "800px", borderRadius: "16px", background: "#fff", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>{selectedTicket.subject}</h2>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>#{selectedTicket.id}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} style={{ padding: "8px", borderRadius: "8px", border: "none", background: "#F3F4F6", cursor: "pointer" }}>
                  <X size={18} color="#6B7280" />
                </button>
              </div>
              {/* Meta */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", marginTop: "12px", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#374151" }}>
                  {selectedTicket.garage ? <><Building2 size={14} color="#6B7280" /> <span style={{ fontWeight: 500 }}>{selectedTicket.garage.name}</span></> : <><User size={14} color="#6B7280" /> <span>Visiteur public</span></>}
                </div>
                {selectedTicket.requesterEmail && (
                  <a href={`mailto:${selectedTicket.requesterEmail}`} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6366F1", textDecoration: "none" }}>
                    <Mail size={14} /> {selectedTicket.requesterEmail}
                  </a>
                )}
                {selectedTicket.requesterPhone && (
                  <a href={`tel:${selectedTicket.requesterPhone}`} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6366F1", textDecoration: "none" }}>
                    <Phone size={14} /> {selectedTicket.requesterPhone}
                  </a>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6B7280" }}>
                  {selectedTicket.channel === "EMAIL" ? <Mail size={14} /> : selectedTicket.channel === "WHATSAPP" ? <MessageSquare size={14} /> : <Building2 size={14} />} {selectedTicket.channel}
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>Statut:</span>
                  <select value={selectedTicket.status} onChange={(e) => void handleStatusChange(e.target.value)} disabled={changingStatus} style={{ ...selectStyle, fontSize: "13px", padding: "6px 10px" }}>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>Priorité:</span>
                  <select value={selectedTicket.priority} onChange={(e) => void handlePriorityChange(e.target.value)} disabled={changingPriority} style={{ ...selectStyle, fontSize: "13px", padding: "6px 10px" }}>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                    {isSlaBreached(selectedTicket) ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: "#FEE2E2", color: "#DC2626" }}>
                        <AlertTriangle size={12} /> En retard SLA
                      </span>
                    ) : selectedTicket.slaTargetAt && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6B7280" }}>
                        <Clock size={12} /> SLA: {formatSlaRemaining(getSlaRemainingMs(selectedTicket.slaTargetAt))}
                      </span>
                    )}
                    {selectedTicket.lastRequesterMessageAt && (
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>Client: {getTimeSinceMessage(selectedTicket.lastRequesterMessageAt)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {loadingTicket ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
                  <Loader2 size={24} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedTicket.messages.map((msg) => (
                    <div key={msg.id} style={{ padding: "12px 16px", borderRadius: "12px", marginLeft: msg.authorType === "ADMIN" ? "32px" : 0, marginRight: msg.authorType === "ADMIN" ? 0 : "32px", background: msg.authorType === "ADMIN" ? "#EEF2FF" : msg.authorType === "GARAGE_USER" ? "#ECFDF5" : "#F3F4F6", border: `1px solid ${msg.authorType === "ADMIN" ? "#C7D2FE" : msg.authorType === "GARAGE_USER" ? "#A7F3D0" : "#E5E7EB"}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#6B7280" }}>
                        <span style={{ fontWeight: 500 }}>{msg.authorType === "ADMIN" ? "Support (vous)" : msg.authorType === "GARAGE_USER" ? `Garage: ${selectedTicket.requesterName || "Utilisateur"}` : selectedTicket.requesterName || "Visiteur"}</span>
                        <span>{new Date(msg.createdAt).toLocaleString("fr-FR")}</span>
                      </div>
                      <p style={{ whiteSpace: "pre-wrap", fontSize: "14px", color: "#111827", margin: 0, lineHeight: 1.5 }}>{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KB Suggestions */}
            {(kbSuggestions.length > 0 || loadingKb) && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid #E5E7EB", background: "#EFF6FF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12px", fontWeight: 500, color: "#2563EB" }}>
                  <Book size={14} /> Articles suggérés {loadingKb && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                </div>
                {kbSuggestions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {kbSuggestions.map((article) => (
                      <div key={article.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "8px", background: "#fff", fontSize: "13px" }}>
                        <div>
                          <span style={{ fontWeight: 500, color: "#111827" }}>{article.title}</span>
                          <span style={{ marginLeft: "8px", fontSize: "12px", color: "#6B7280" }}>{article.categoryName}</span>
                        </div>
                        <button onClick={() => handleInsertKbLink(article)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", border: "none", background: "#DBEAFE", fontSize: "12px", fontWeight: 500, color: "#2563EB", cursor: "pointer" }}>
                          <Link2 size={12} /> Insérer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Suggestions */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #E5E7EB", background: "#FAF5FF" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 500, color: "#7C3AED" }}>
                  <Sparkles size={14} /> Réponse proposée
                  {aiCached && <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10px", background: "#EDE9FE" }}>cache</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {aiSuggestion && (
                    <button onClick={() => setAiExpanded(!aiExpanded)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", border: "none", background: "transparent", fontSize: "12px", color: "#7C3AED", cursor: "pointer" }}>
                      {aiExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {aiExpanded ? "Réduire" : "Afficher"}
                    </button>
                  )}
                  <button onClick={() => void loadAiSuggestion()} disabled={loadingAi} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "6px", border: "none", background: "#7C3AED", fontSize: "12px", fontWeight: 500, color: "#fff", cursor: "pointer", opacity: loadingAi ? 0.5 : 1 }}>
                    {loadingAi ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={12} />}
                    {aiSuggestion ? "Actualiser" : "Générer"}
                  </button>
                </div>
              </div>
              {aiError && <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "8px", background: "#FEE2E2", fontSize: "12px", color: "#DC2626" }}>{aiError}</div>}
              {aiSuggestion && aiExpanded && (
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#fff" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#7C3AED", marginBottom: "4px" }}>Résumé interne</div>
                    <p style={{ fontSize: "12px", color: "#374151", margin: 0 }}>{aiSuggestion.summary_internal}</p>
                  </div>
                  {(aiSuggestion.suggested_category || aiSuggestion.suggested_priority) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {aiSuggestion.suggested_category && aiSuggestion.suggested_category !== selectedTicket?.category && (
                        <button onClick={() => void handleCategoryChange(aiSuggestion.suggested_category!)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "6px", border: "none", background: "#FEF3C7", fontSize: "12px", color: "#92400E", cursor: "pointer" }}>
                          Catégorie suggérée: {CATEGORIES.find((c) => c.value === aiSuggestion.suggested_category)?.label}
                          <span style={{ fontSize: "10px", opacity: 0.7 }}>({Math.round(aiSuggestion.confidence * 100)}%)</span>
                        </button>
                      )}
                      {aiSuggestion.suggested_priority && aiSuggestion.suggested_priority !== selectedTicket?.priority && (
                        <button onClick={() => void handlePriorityChange(aiSuggestion.suggested_priority!)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "6px", border: "none", background: "#FFEDD5", fontSize: "12px", color: "#9A3412", cursor: "pointer" }}>
                          Priorité suggérée: {PRIORITIES.find((p) => p.value === aiSuggestion.suggested_priority)?.label}
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#7C3AED" }}>Brouillon de réponse</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={handleCopyAiDraft} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", border: "none", background: "#F3F4F6", fontSize: "10px", color: "#6B7280", cursor: "pointer" }}>
                          <Copy size={10} /> Copier
                        </button>
                        <button onClick={handleUseAiDraft} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", border: "none", background: "#EDE9FE", fontSize: "10px", color: "#7C3AED", cursor: "pointer" }}>Utiliser</button>
                      </div>
                    </div>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: "12px", color: "#374151", margin: 0 }}>{aiSuggestion.draft_reply_fr}</p>
                  </div>
                  {aiSuggestion.clarifying_questions.length > 0 && (
                    <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#fff" }}>
                      <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#7C3AED", marginBottom: "6px" }}>Questions de clarification</div>
                      <ul style={{ fontSize: "12px", color: "#374151", margin: 0, paddingLeft: "16px" }}>
                        {aiSuggestion.clarifying_questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                  {aiSuggestion.kb_suggestions.length > 0 && (
                    <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#fff" }}>
                      <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#7C3AED", marginBottom: "6px" }}>Articles KB suggérés</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {aiSuggestion.kb_suggestions.map((slug, i) => <span key={i} style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", background: "#DBEAFE", color: "#2563EB" }}>{slug}</span>)}
                      </div>
                    </div>
                  )}
                  {aiSuggestion.next_actions_internal.length > 0 && (
                    <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#FEF3C7" }}>
                      <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#92400E", marginBottom: "6px" }}>Actions suggérées (interne)</div>
                      <ul style={{ fontSize: "12px", color: "#92400E", margin: 0, paddingLeft: "16px" }}>
                        {aiSuggestion.next_actions_internal.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Reply Proposals */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={16} color="#A855F7" />
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>Propositions de réponse</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", borderRadius: "8px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
                    {(["neutral", "friendly", "firm"] as const).map((t) => (
                      <button key={t} onClick={() => setReplyTone(t)} style={{ padding: "6px 10px", border: "none", background: replyTone === t ? "#EDE9FE" : "#fff", fontSize: "12px", color: replyTone === t ? "#7C3AED" : "#6B7280", cursor: "pointer" }}>
                        {t === "neutral" ? "Neutre" : t === "friendly" ? "Sympa" : "Ferme"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => void loadAiReplies()} disabled={loadingReplies} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer", opacity: loadingReplies ? 0.5 : 1 }}>
                    {loadingReplies ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />}
                    {aiReplies ? "Regénérer" : "Proposer une réponse"}
                  </button>
                </div>
              </div>
              {repliesError && <div style={{ marginBottom: "12px", padding: "8px 12px", borderRadius: "8px", background: "#FEF2F2", fontSize: "12px", color: "#DC2626" }}>{repliesError}</div>}
              {aiReplies && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#F9FAFB", padding: "4px" }}>
                    {(["short", "pro", "detailed"] as const).map((v) => (
                      <button key={v} onClick={() => setSelectedVariant(v)} style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "none", background: selectedVariant === v ? "#fff" : "transparent", fontSize: "13px", fontWeight: 500, color: selectedVariant === v ? "#111827" : "#6B7280", cursor: "pointer", boxShadow: selectedVariant === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                        {v === "short" ? "Version courte" : v === "pro" ? "Version pro" : "Version détaillée"}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff" }}>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: "14px", color: "#111827", margin: 0 }}>{aiReplies.replies[selectedVariant]}</p>
                    <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => handleUseVariant(selectedVariant)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>Utiliser cette version</button>
                    </div>
                  </div>
                  {replyMessage && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>Réécrire le brouillon :</span>
                      {(["shorter", "friendlier", "firmer", "clearer"] as const).map((instr) => (
                        <button key={instr} onClick={() => void handleRewrite(instr)} disabled={rewriting} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "12px", color: "#6B7280", cursor: "pointer", opacity: rewriting ? 0.5 : 1 }}>
                          {instr === "shorter" ? "Plus court" : instr === "friendlier" ? "Plus sympa" : instr === "firmer" ? "Plus ferme" : "Plus clair"}
                        </button>
                      ))}
                    </div>
                  )}
                  {aiReplies.clarifying_questions.length > 0 && (
                    <div style={{ padding: "12px", borderRadius: "10px", background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "#92400E", marginBottom: "8px" }}>Questions à poser</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {aiReplies.clarifying_questions.map((q, i) => (
                          <button key={i} onClick={() => handleInsertQuestion(q)} style={{ padding: "6px 12px", borderRadius: "20px", border: "none", background: "#fff", fontSize: "12px", color: "#92400E", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>+ {q}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiReplies.kb_links.length > 0 && (
                    <div style={{ padding: "12px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "#1E40AF", marginBottom: "8px" }}>Liens utiles</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {aiReplies.kb_links.map((link, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "8px", background: "#fff" }}>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{link.title}</div>
                              <div style={{ fontSize: "12px", color: "#6B7280" }}>{link.why}</div>
                            </div>
                            <button onClick={() => handleInsertKbLink(link.slug, link.title)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "12px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                              <Link2 size={12} /> Insérer
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reply Form */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Zap size={14} color="#6B7280" />
                <span style={{ fontSize: "12px", color: "#6B7280" }}>Macros:</span>
                <select value="" onChange={(e) => handleMacroSelect(e.target.value)} style={{ ...selectStyle, fontSize: "13px", padding: "6px 10px" }}>
                  <option value="">Sélectionner une macro...</option>
                  {macros.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Votre réponse..." rows={3} style={{ ...inputStyle, flex: 1, resize: "vertical", minHeight: "80px" }} />
                <button onClick={handleReply} disabled={replying || !replyMessage.trim()} style={{ padding: "12px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: replying || !replyMessage.trim() ? 0.5 : 1, alignSelf: "flex-end" }}>
                  {replying ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
