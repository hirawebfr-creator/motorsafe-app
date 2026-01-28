"use client";

/**
 * LEADS-CRM-01: Lead Detail Page
 * SafeMotor Design System - Aligned with support page patterns
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Building2,
  MapPin,
  Edit2,
  Trash2,
  Copy,
  Check,
  Plus,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";

// Types
type LeadStatus = "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "DEMO_DONE" | "TRIAL_STARTED" | "WON" | "LOST";
type LeadChannel = "INSTAGRAM" | "FACEBOOK" | "SMS" | "EMAIL" | "PHONE" | "LINKEDIN" | "REFERRAL" | "OTHER";
type ActivityType = "NOTE" | "CALL" | "SMS" | "EMAIL" | "DM" | "DEMO" | "STATUS_CHANGE";

interface Activity {
  id: number;
  type: ActivityType;
  summary: string;
  details: string | null;
  oldStatus: LeadStatus | null;
  newStatus: LeadStatus | null;
  createdAt: string;
  createdBy: { id: string; email: string } | null;
}

interface Lead {
  id: number;
  garageName: string;
  city: string | null;
  postalCode: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: LeadStatus;
  channel: LeadChannel;
  source: string | null;
  notes: string | null;
  nextFollowUpAt: string | null;
  lastContactedAt: string | null;
  lostReason: string | null;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
  ownerUser: { id: string; email: string } | null;
  trialGarage: { id: number; name: string; status: string; plan: string } | null;
  activities: Activity[];
}

// Config
const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  NEW: { label: "Nouveau", color: "text-blue-600", bg: "bg-blue-100" },
  CONTACTED: { label: "Contacté", color: "text-indigo-600", bg: "bg-indigo-100" },
  DEMO_SCHEDULED: { label: "Démo planifiée", color: "text-yellow-700", bg: "bg-yellow-100" },
  DEMO_DONE: { label: "Démo effectuée", color: "text-orange-600", bg: "bg-orange-100" },
  TRIAL_STARTED: { label: "Essai démarré", color: "text-purple-600", bg: "bg-purple-100" },
  WON: { label: "Gagné", color: "text-emerald-600", bg: "bg-emerald-100" },
  LOST: { label: "Perdu", color: "text-red-600", bg: "bg-red-100" },
};

const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: React.ReactNode; bg: string }> = {
  NOTE: { label: "Note", icon: <MessageSquare className="h-4 w-4" />, bg: "bg-gray-100" },
  CALL: { label: "Appel", icon: <Phone className="h-4 w-4" />, bg: "bg-green-100" },
  SMS: { label: "SMS", icon: <MessageSquare className="h-4 w-4" />, bg: "bg-blue-100" },
  EMAIL: { label: "Email", icon: <Mail className="h-4 w-4" />, bg: "bg-indigo-100" },
  DM: { label: "DM", icon: <MessageSquare className="h-4 w-4" />, bg: "bg-pink-100" },
  DEMO: { label: "Démo", icon: <Calendar className="h-4 w-4" />, bg: "bg-yellow-100" },
  STATUS_CHANGE: { label: "Statut", icon: <Clock className="h-4 w-4" />, bg: "bg-purple-100" },
};

const CHANNEL_LABELS: Record<LeadChannel, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  SMS: "SMS",
  EMAIL: "Email",
  PHONE: "Téléphone",
  LINKEDIN: "LinkedIn",
  REFERRAL: "Parrainage",
  OTHER: "Autre",
};

const ACTIVITY_OPTIONS = [
  { value: "NOTE", label: "Note" },
  { value: "CALL", label: "Appel" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
  { value: "DM", label: "DM" },
  { value: "DEMO", label: "Démo" },
];

function formatDateTime(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export default function AdminLeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUser();
  const isAdmin = user?.role === "ADMIN";
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "NOTE" as ActivityType, summary: "", details: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<{ data: Lead }>(`/api/admin/leads/${leadId}`, { noStore: true });
      setLead(data.data);
      setEditForm(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (isAdmin && leadId) loadLead();
  }, [isAdmin, leadId, loadLead]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await requestJson(`/api/admin/leads/${leadId}`, { method: "PATCH", body: editForm });
      toast.success("Lead mis à jour");
      setEditing(false);
      loadLead();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === "LOST") {
        const reason = prompt("Raison de la perte (optionnel):");
        if (reason) body.lostReason = reason;
      }
      await requestJson(`/api/admin/leads/${leadId}/status`, { method: "POST", body });
      toast.success(`Statut: ${STATUS_CONFIG[newStatus].label}`);
      setShowStatusMenu(false);
      loadLead();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du changement de statut");
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await requestJson(`/api/admin/leads/${leadId}/activity`, { method: "POST", body: activityForm });
      toast.success("Activité ajoutée");
      setShowActivityForm(false);
      setActivityForm({ type: "NOTE", summary: "", details: "" });
      loadLead();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleAnonymize = async () => {
    if (!confirm("Anonymiser ce lead ? Cette action est irréversible (RGPD).")) return;
    try {
      await requestJson(`/api/admin/leads/${leadId}`, { method: "DELETE" });
      toast.success("Lead anonymisé");
      router.push("/admin/leads");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'anonymisation");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ms-bg-subtle)] mb-4">
          <User size={24} className="text-[var(--ms-text-muted)]" />
        </div>
        <p className="text-[var(--ms-text-secondary)]">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <p className="text-[var(--ms-text)] font-medium mb-2">{error || "Lead introuvable"}</p>
        <Link href="/admin/leads" className="ms-btn ms-btn-primary mt-4">
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[lead.status];

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div className="flex items-center gap-4">
          <Link href="/admin/leads" className="ms-btn ms-btn-ghost ms-btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="ms-page-title">{lead.garageName}</h1>
            {lead.city && (
              <p className="ms-page-subtitle flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {lead.postalCode} {lead.city}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium cursor-pointer transition-opacity hover:opacity-80 ${statusCfg.bg} ${statusCfg.color}`}
            >
              {statusCfg.label}
              <ChevronDown className="h-4 w-4" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-[var(--ms-border)] bg-white shadow-lg">
                {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as LeadStatus)}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-[var(--ms-surface-hover)] transition-colors first:rounded-t-lg last:rounded-b-lg ${lead.status === status ? "font-medium bg-[var(--ms-bg-subtle)]" : ""}`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setEditing(true)} className="ms-btn ms-btn-secondary ms-btn-icon">
            <Edit2 size={18} />
          </button>
          <button onClick={handleAnonymize} className="ms-btn ms-btn-ghost ms-btn-icon text-red-500 hover:bg-red-50">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact card */}
          <div className="ms-card">
            <div className="ms-card-header">
              <h2 className="text-base font-semibold text-[var(--ms-text)] flex items-center gap-2">
                <User size={18} />
                Contact
              </h2>
            </div>
            <div className="ms-card-body">
              <div className="space-y-3">
                {lead.contactName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--ms-text-muted)]">Nom</span>
                    <span className="font-medium text-[var(--ms-text)]">{lead.contactName}</span>
                  </div>
                )}
                {lead.contactPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--ms-text-muted)]">Téléphone</span>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${lead.contactPhone}`} className="font-medium text-[var(--ms-primary)] hover:underline">
                        {lead.contactPhone}
                      </a>
                      <button onClick={() => handleCopy(lead.contactPhone!, "phone")} className="text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]">
                        {copied === "phone" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                {lead.contactEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--ms-text-muted)]">Email</span>
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${lead.contactEmail}`} className="font-medium text-[var(--ms-primary)] hover:underline">
                        {lead.contactEmail}
                      </a>
                      <button onClick={() => handleCopy(lead.contactEmail!, "email")} className="text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]">
                        {copied === "email" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                {!lead.contactName && !lead.contactPhone && !lead.contactEmail && (
                  <p className="text-sm text-[var(--ms-text-muted)] text-center py-2">Aucun contact renseigné</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="ms-card">
              <div className="ms-card-header">
                <h2 className="text-base font-semibold text-[var(--ms-text)]">Notes</h2>
              </div>
              <div className="ms-card-body">
                <p className="whitespace-pre-wrap text-[var(--ms-text-secondary)]">{lead.notes}</p>
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="ms-card">
            <div className="ms-card-header flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--ms-text)]">Historique</h2>
              <button onClick={() => setShowActivityForm(true)} className="ms-btn ms-btn-primary ms-btn-sm">
                <Plus size={16} />
                Activité
              </button>
            </div>
            <div className="ms-card-body">
              {/* Activity form */}
              {showActivityForm && (
                <form onSubmit={handleAddActivity} className="mb-6 p-4 rounded-xl bg-[var(--ms-bg-subtle)] border border-[var(--ms-border)]">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <select
                      value={activityForm.type}
                      onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}
                      className="ms-input"
                    >
                      {ACTIVITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Résumé..."
                      value={activityForm.summary}
                      onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })}
                      className="ms-input flex-1 min-w-[200px]"
                    />
                  </div>
                  <textarea
                    placeholder="Détails (optionnel)..."
                    value={activityForm.details}
                    onChange={(e) => setActivityForm({ ...activityForm, details: e.target.value })}
                    className="ms-input w-full mb-3"
                    rows={2}
                    style={{ height: "auto", paddingTop: 10, paddingBottom: 10 }}
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowActivityForm(false)} className="ms-btn ms-btn-secondary ms-btn-sm">
                      Annuler
                    </button>
                    <button type="submit" disabled={saving} className="ms-btn ms-btn-primary ms-btn-sm">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : "Ajouter"}
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline */}
              <div className="space-y-4">
                {lead.activities.map((activity) => {
                  const cfg = ACTIVITY_CONFIG[activity.type];
                  return (
                    <div key={activity.id} className="flex gap-4">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.bg} text-[var(--ms-text-secondary)]`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[var(--ms-text-muted)] uppercase tracking-wide">
                            {cfg.label}
                          </span>
                          <span className="text-xs text-[var(--ms-text-muted)]">
                            {formatDateTime(activity.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--ms-text)]">{activity.summary}</p>
                        {activity.details && (
                          <p className="mt-1 text-sm text-[var(--ms-text-muted)]">{activity.details}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {lead.activities.length === 0 && (
                  <p className="text-center text-sm text-[var(--ms-text-muted)] py-4">Aucune activité</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta info */}
          <div className="ms-card">
            <div className="ms-card-header">
              <h2 className="text-base font-semibold text-[var(--ms-text)]">Informations</h2>
            </div>
            <div className="ms-card-body">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--ms-text-muted)]">Canal</span>
                  <span className="font-medium text-[var(--ms-text)]">{CHANNEL_LABELS[lead.channel]}</span>
                </div>
                {lead.source && (
                  <div className="flex justify-between">
                    <span className="text-[var(--ms-text-muted)]">Source</span>
                    <span className="font-medium text-[var(--ms-text)]">{lead.source}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--ms-text-muted)]">Créé le</span>
                  <span className="text-[var(--ms-text)]">{formatDate(lead.createdAt)}</span>
                </div>
                {lead.lastContactedAt && (
                  <div className="flex justify-between">
                    <span className="text-[var(--ms-text-muted)]">Dernier contact</span>
                    <span className="text-[var(--ms-text)]">{formatDate(lead.lastContactedAt)}</span>
                  </div>
                )}
                {lead.nextFollowUpAt && (
                  <div className="flex justify-between">
                    <span className="text-[var(--ms-text-muted)]">Prochaine relance</span>
                    <span className="font-medium text-orange-600">{formatDate(lead.nextFollowUpAt)}</span>
                  </div>
                )}
                {lead.ownerUser && (
                  <div className="flex justify-between">
                    <span className="text-[var(--ms-text-muted)]">Responsable</span>
                    <span className="text-[var(--ms-text)]">{lead.ownerUser.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conversion */}
          {lead.trialGarage && (
            <div className="ms-card border-emerald-200 bg-emerald-50">
              <div className="ms-card-header">
                <h2 className="text-base font-semibold text-emerald-800 flex items-center gap-2">
                  <Building2 size={18} />
                  Converti
                </h2>
              </div>
              <div className="ms-card-body">
                <div className="font-medium text-[var(--ms-text)]">{lead.trialGarage.name}</div>
                <div className="text-sm text-emerald-600 mt-1">
                  Plan: {lead.trialGarage.plan} • {lead.trialGarage.status}
                </div>
                {lead.wonAt && (
                  <div className="text-xs text-[var(--ms-text-muted)] mt-2">Gagné le {formatDate(lead.wonAt)}</div>
                )}
              </div>
            </div>
          )}

          {/* Lost reason */}
          {lead.status === "LOST" && lead.lostReason && (
            <div className="ms-card border-red-200 bg-red-50">
              <div className="ms-card-header">
                <h2 className="text-base font-semibold text-red-800">Raison de perte</h2>
              </div>
              <div className="ms-card-body">
                <p className="text-sm text-red-600">{lead.lostReason}</p>
                {lead.lostAt && (
                  <div className="text-xs text-[var(--ms-text-muted)] mt-2">Perdu le {formatDate(lead.lostAt)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="ms-modal-overlay" onClick={() => setEditing(false)}>
          <div className="ms-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title">Modifier le lead</h2>
            </div>
            <div className="ms-modal-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Nom du garage</label>
                  <input
                    type="text"
                    value={editForm.garageName || ""}
                    onChange={(e) => setEditForm({ ...editForm, garageName: e.target.value })}
                    className="ms-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Ville</label>
                  <input
                    type="text"
                    value={editForm.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="ms-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Code postal</label>
                  <input
                    type="text"
                    value={editForm.postalCode || ""}
                    onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    className="ms-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Contact</label>
                  <input
                    type="text"
                    value={editForm.contactName || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="ms-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.contactPhone || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    className="ms-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.contactEmail || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="ms-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Prochaine relance</label>
                  <input
                    type="date"
                    value={editForm.nextFollowUpAt?.split("T")[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, nextFollowUpAt: e.target.value })}
                    className="ms-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Source</label>
                  <input
                    type="text"
                    value={editForm.source || ""}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                    className="ms-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--ms-text)] mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="ms-input w-full"
                    style={{ height: "auto", paddingTop: 10, paddingBottom: 10 }}
                  />
                </div>
              </div>
            </div>
            <div className="ms-modal-footer">
              <button onClick={() => setEditing(false)} className="ms-btn ms-btn-secondary">
                Annuler
              </button>
              <button onClick={handleUpdate} disabled={saving} className="ms-btn ms-btn-primary">
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
