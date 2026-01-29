"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  Mail,
  Plus,
  ChevronRight,
  Loader2,
  RefreshCw,
  ExternalLink,
  LifeBuoy,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { fetcher, requestJson } from "@/lib/fetcher";

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

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  lastReplyAt: string | null;
  createdAt: string;
};

type TicketDetail = Ticket & {
  requesterName: string;
  messages: { id: string; authorType: string; message: string; createdAt: string }[];
};

const WHATSAPP_URL = "https://wa.me/33626045731";
const SUPPORT_EMAIL = "contact@safemotor.fr";

const CATEGORIES = [
  { value: "BUG", label: "Bug / Problème technique" },
  { value: "BILLING", label: "Facturation / Abonnement" },
  { value: "FEATURE", label: "Demande de fonctionnalité" },
  { value: "LEGAL", label: "Question juridique / RGPD" },
  { value: "OTHER", label: "Autre" },
];

const PRIORITIES = [
  { value: "LOW", label: "Basse" },
  { value: "NORMAL", label: "Normale" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  OPEN: { color: "#2563EB", bg: "#DBEAFE", label: "Ouvert" },
  IN_PROGRESS: { color: "#D97706", bg: "#FEF3C7", label: "En cours" },
  WAITING_CUSTOMER: { color: "#EA580C", bg: "#FFEDD5", label: "En attente" },
  RESOLVED: { color: "#059669", bg: "#D1FAE5", label: "Résolu" },
  CLOSED: { color: "#6B7280", bg: "#F3F4F6", label: "Fermé" },
};

export default function SupportPage() {
  const { isMobile, isTablet } = useResponsive();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [priority, setPriority] = useState("NORMAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher<{ tickets: Ticket[] }>("/api/support/tickets");
      setTickets(res.tickets);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTicketDetail = useCallback(async (id: string) => {
    try {
      setLoadingTicket(true);
      const res = await fetcher<TicketDetail>(`/api/support/tickets/${id}`);
      setSelectedTicket(res);
    } catch (err) {
      console.error("Failed to load ticket:", err);
      toast.error("Erreur de chargement du ticket");
    } finally {
      setLoadingTicket(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    try {
      setSubmitting(true);
      await requestJson("/api/support/tickets", { body: { subject, category, priority, message } });
      toast.success("Ticket créé avec succès");
      setShowForm(false);
      setSubject("");
      setCategory("OTHER");
      setPriority("NORMAL");
      setMessage("");
      void loadTickets();
    } catch (err) {
      console.error("Failed to create ticket:", err);
      toast.error("Erreur lors de la création du ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    try {
      setReplying(true);
      await requestJson(`/api/support/tickets/${selectedTicket.id}/messages`, { body: { message: replyMessage } });
      toast.success("Message envoyé");
      setReplyMessage("");
      void loadTicketDetail(selectedTicket.id);
    } catch (err) {
      console.error("Failed to send reply:", err);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setReplying(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm("Fermer ce ticket ?")) return;
    try {
      await requestJson(`/api/support/tickets/${selectedTicket.id}/close`, {});
      toast.success("Ticket fermé");
      setSelectedTicket(null);
      void loadTickets();
    } catch (err) {
      console.error("Failed to close ticket:", err);
      toast.error("Erreur");
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "14px", color: "#111827", background: "#fff", outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" };
  const cardStyle: React.CSSProperties = { padding: "24px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" };

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LifeBuoy size={24} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Support</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Contactez-nous ou consultez vos tickets</p>
          </div>
        </div>
        <button onClick={() => void loadTickets()} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
          <RefreshCw size={16} style={loading ? { animation: "spin 1s linear infinite" } : {}} /> Actualiser
        </button>
      </div>

      {/* Contact Options */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        {/* WhatsApp */}
        <div style={cardStyle}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <MessageSquare size={24} color="#059669" />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>WhatsApp</h3>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>Réponse rapide pendant les heures ouvrées</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", background: "#059669", color: "#fff", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
            <MessageSquare size={16} /> Contacter <ExternalLink size={14} />
          </a>
        </div>

        {/* Email */}
        <div style={cardStyle}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Mail size={24} color="#2563EB" />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Email</h3>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>Pour les demandes détaillées</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>
            <Mail size={16} /> Envoyer un email
          </a>
        </div>

        {/* Create Ticket */}
        <div style={cardStyle}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Plus size={24} color="#7C3AED" />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Créer un ticket</h3>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>Suivi et historique de vos demandes</p>
          <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            <Plus size={16} /> Créer un ticket
          </button>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "500px", background: "#fff", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Créer un ticket</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><X size={20} color="#6B7280" /></button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Sujet *</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Décrivez brièvement votre problème" style={inputStyle} required minLength={3} maxLength={200} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Catégorie</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priorité</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Message *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre problème en détail..." style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} required minLength={10} maxLength={5000} />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Annuler</button>
                <button type="submit" disabled={submitting} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />} {submitting ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", background: "#fff", borderRadius: "16px", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>{selectedTicket.subject}</h2>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Ticket #{selectedTicket.id.slice(0, 8)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {(() => {
                    const cfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.OPEN;
                    return <span style={{ padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 500, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
                  })()}
                  <button onClick={() => setSelectedTicket(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><X size={20} color="#6B7280" /></button>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {loadingTicket ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
                  <Loader2 size={24} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedTicket.messages.map((msg) => (
                    <div key={msg.id} style={{ padding: "12px", borderRadius: "10px", background: msg.authorType === "ADMIN" ? "#DBEAFE" : "#F3F4F6", marginLeft: msg.authorType === "ADMIN" ? "32px" : 0, marginRight: msg.authorType === "ADMIN" ? 0 : "32px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: msg.authorType === "ADMIN" ? "#2563EB" : "#374151" }}>{msg.authorType === "ADMIN" ? "Support SafeMotor" : "Vous"}</span>
                        <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{new Date(msg.createdAt).toLocaleString("fr-FR")}</span>
                      </div>
                      <p style={{ fontSize: "14px", color: "#111827", margin: 0, whiteSpace: "pre-wrap" }}>{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedTicket.status !== "CLOSED" && (
              <div style={{ padding: "16px", borderTop: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Votre réponse..." style={{ ...inputStyle, flex: 1, minHeight: "60px", resize: "none" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button onClick={() => void handleReply()} disabled={replying || !replyMessage.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", color: "#fff", cursor: "pointer", opacity: replying || !replyMessage.trim() ? 0.5 : 1 }}>
                      {replying ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
                    </button>
                    <button onClick={() => void handleCloseTicket()} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "11px", color: "#6B7280", cursor: "pointer" }}>Fermer</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Tickets */}
      <div style={cardStyle}>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Mes tickets</h2>
        </div>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
            <Loader2 size={24} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>Aucun ticket pour le moment</div>
        ) : (
          <div>
            {tickets.map((ticket, i) => {
              const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
              return (
                <button key={ticket.id} onClick={() => void loadTicketDetail(ticket.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 0", borderTop: i > 0 ? "1px solid #E5E7EB" : "none", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{ticket.subject}</div>
                    <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
                      {new Date(ticket.createdAt).toLocaleDateString("fr-FR")} • {CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 500, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
