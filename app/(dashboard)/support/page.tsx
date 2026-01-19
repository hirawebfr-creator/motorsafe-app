"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  Mail,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { fetcher, requestJson } from "@/lib/fetcher";

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
  lastReplyAt: string | null;
  createdAt: string;
};

type TicketDetail = Ticket & {
  requesterName: string;
  messages: {
    id: string;
    authorType: string;
    message: string;
    createdAt: string;
  }[];
};

// ============================================
// Constants
// ============================================

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

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  OPEN: { color: "text-blue-600", bg: "bg-blue-100", label: "Ouvert", icon: <Clock size={14} /> },
  IN_PROGRESS: { color: "text-yellow-600", bg: "bg-yellow-100", label: "En cours", icon: <Loader2 size={14} className="animate-spin" /> },
  WAITING_CUSTOMER: { color: "text-orange-600", bg: "bg-orange-100", label: "En attente", icon: <AlertCircle size={14} /> },
  RESOLVED: { color: "text-green-600", bg: "bg-green-100", label: "Résolu", icon: <CheckCircle size={14} /> },
  CLOSED: { color: "text-gray-500", bg: "bg-gray-100", label: "Fermé", icon: <CheckCircle size={14} /> },
};

// ============================================
// Component
// ============================================

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [priority, setPriority] = useState("NORMAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ id: string; whatsappUrl: string } | null>(null);

  // Reply state
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher<{ tickets: Ticket[] }>("/api/support/tickets");
      setTickets(res.tickets);
    } catch (err) {
      console.error("Failed to load tickets:", err);
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
      const res = await requestJson<{ id: string; whatsappUrl: string }>("/api/support/tickets", {
        body: { subject, category, priority, message },
      });
      setSuccessMessage(res);
      setShowForm(false);
      setSubject("");
      setCategory("OTHER");
      setPriority("NORMAL");
      setMessage("");
      void loadTickets();
    } catch (err) {
      console.error("Failed to create ticket:", err);
      alert("Erreur lors de la création du ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setReplying(true);
      await requestJson(`/api/support/tickets/${selectedTicket.id}/messages`, {
        body: { message: replyMessage },
      });
      setReplyMessage("");
      void loadTicketDetail(selectedTicket.id);
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setReplying(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm("Fermer ce ticket ?")) return;

    try {
      await requestJson(`/api/support/tickets/${selectedTicket.id}/close`, {});
      setSelectedTicket(null);
      void loadTickets();
    } catch (err) {
      console.error("Failed to close ticket:", err);
    }
  };

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Support</h1>
          <p className="ms-page-subtitle">Contactez-nous ou consultez vos tickets</p>
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

      {/* Success message after ticket creation */}
      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="mt-0.5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Ticket créé avec succès !</p>
              <p className="mt-1 text-sm text-green-700">
                Numéro de ticket: <strong>{successMessage.id}</strong>
              </p>
              <div className="mt-3 flex gap-2">
                <a
                  href={successMessage.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-btn ms-btn-primary"
                >
                  <MessageSquare size={16} />
                  Ouvrir WhatsApp avec ce ticket
                </a>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="ms-btn ms-btn-secondary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Options */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* WhatsApp */}
        <div className="ms-card">
          <div className="ms-card-body">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <MessageSquare size={24} className="text-green-600" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[var(--ms-text)]">WhatsApp</h3>
            <p className="mb-4 text-sm text-[var(--ms-text-muted)]">
              Réponse rapide pendant les heures ouvrées
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-btn ms-btn-primary w-full"
            >
              <MessageSquare size={16} />
              Contacter sur WhatsApp
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="ms-card">
          <div className="ms-card-body">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Mail size={24} className="text-blue-600" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[var(--ms-text)]">Email</h3>
            <p className="mb-4 text-sm text-[var(--ms-text-muted)]">
              Pour les demandes détaillées
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Demande de support SafeMotor")}`}
              className="ms-btn ms-btn-secondary w-full"
            >
              <Mail size={16} />
              Envoyer un email
            </a>
          </div>
        </div>

        {/* Create Ticket */}
        <div className="ms-card">
          <div className="ms-card-body">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Plus size={24} className="text-purple-600" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[var(--ms-text)]">Créer un ticket</h3>
            <p className="mb-4 text-sm text-[var(--ms-text-muted)]">
              Suivi et historique de vos demandes
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="ms-btn ms-btn-primary w-full"
            >
              <Plus size={16} />
              Créer un ticket
            </button>
          </div>
        </div>
      </div>

      {/* Create Ticket Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-[var(--ms-text)]">Créer un ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">Sujet *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Décrivez brièvement votre problème"
                  className="ms-input w-full"
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="ms-input w-full"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="ms-input w-full"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème en détail..."
                  className="ms-input w-full"
                  rows={5}
                  required
                  minLength={10}
                  maxLength={5000}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="ms-btn ms-btn-secondary"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ms-btn ms-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Créer le ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-[var(--ms-border)] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--ms-text)]">{selectedTicket.subject}</h2>
                  <p className="text-sm text-[var(--ms-text-muted)]">Ticket #{selectedTicket.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const cfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.OPEN;
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
                  >
                    ✕
                  </button>
                </div>
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
                          {msg.authorType === "ADMIN" ? "Support SafeMotor" : "Vous"}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleString("fr-FR")}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-[var(--ms-text)]">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Form */}
            {selectedTicket.status !== "CLOSED" && (
              <div className="border-t border-[var(--ms-border)] p-4">
                <div className="flex gap-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Votre réponse..."
                    className="ms-input flex-1"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleReply}
                      disabled={replying || !replyMessage.trim()}
                      className="ms-btn ms-btn-primary"
                    >
                      {replying ? <Loader2 size={16} className="animate-spin" /> : "Envoyer"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseTicket}
                      className="ms-btn ms-btn-secondary text-xs"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Tickets */}
      <div className="ms-card">
        <div className="ms-card-header">
          <h2 className="text-lg font-semibold text-[var(--ms-text)]">Mes tickets</h2>
        </div>
        <div className="ms-card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[var(--ms-primary)]" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-[var(--ms-text-muted)]">
              Aucun ticket pour le moment
            </div>
          ) : (
            <div className="divide-y divide-[var(--ms-border)]">
              {tickets.map((ticket) => {
                const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => void loadTicketDetail(ticket.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--ms-bg)]"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[var(--ms-text)]">{ticket.subject}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--ms-text-muted)]">
                        <span>{new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</span>
                        <span>•</span>
                        <span>{CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      <ChevronRight size={16} className="text-[var(--ms-text-muted)]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
