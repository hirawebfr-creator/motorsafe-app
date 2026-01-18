"use client";

/**
 * LEADS-CRM-01: Lead Detail Page
 * 
 * Admin-only page for managing a single lead with activity timeline
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
  X,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";
import { useToast } from "@/components/ui/Toast";

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

// Labels
const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  DEMO_SCHEDULED: "Démo planifiée",
  DEMO_DONE: "Démo effectuée",
  TRIAL_STARTED: "Essai démarré",
  WON: "Gagné",
  LOST: "Perdu",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-indigo-100 text-indigo-800",
  DEMO_SCHEDULED: "bg-yellow-100 text-yellow-800",
  DEMO_DONE: "bg-orange-100 text-orange-800",
  TRIAL_STARTED: "bg-purple-100 text-purple-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  NOTE: <MessageSquare className="h-4 w-4" />,
  CALL: <Phone className="h-4 w-4" />,
  SMS: <MessageSquare className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  DM: <MessageSquare className="h-4 w-4" />,
  DEMO: <Calendar className="h-4 w-4" />,
  STATUS_CHANGE: <Clock className="h-4 w-4" />,
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  NOTE: "Note",
  CALL: "Appel",
  SMS: "SMS",
  EMAIL: "Email",
  DM: "DM",
  DEMO: "Démo",
  STATUS_CHANGE: "Changement statut",
};

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
  const toast = useToast();
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

  const loadLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<{ data: Lead }>(`/api/admin/leads/${leadId}`, {
        noStore: true,
      });
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
    try {
      await requestJson(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        body: editForm,
      });
      toast.push({ title: "Lead mis à jour", variant: "success" });
      setEditing(false);
      loadLead();
    } catch (err) {
      toast.push({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Échec de la mise à jour",
        variant: "error",
      });
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      let body: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === "LOST") {
        const reason = prompt("Raison de la perte (optionnel):");
        if (reason) body.lostReason = reason;
      }

      await requestJson(`/api/admin/leads/${leadId}/status`, {
        method: "POST",
        body,
      });
      toast.push({ title: `Statut: ${STATUS_LABELS[newStatus]}`, variant: "success" });
      setShowStatusMenu(false);
      loadLead();
    } catch (err) {
      toast.push({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Échec du changement de statut",
        variant: "error",
      });
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestJson(`/api/admin/leads/${leadId}/activity`, {
        method: "POST",
        body: activityForm,
      });
      toast.push({ title: "Activité ajoutée", variant: "success" });
      setShowActivityForm(false);
      setActivityForm({ type: "NOTE", summary: "", details: "" });
      loadLead();
    } catch (err) {
      toast.push({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Échec de l'ajout",
        variant: "error",
      });
    }
  };

  const handleAnonymize = async () => {
    if (!confirm("Anonymiser ce lead ? Cette action est irréversible (RGPD).")) return;
    try {
      await requestJson(`/api/admin/leads/${leadId}`, {
        method: "DELETE",
      });
      toast.push({ title: "Lead anonymisé", variant: "success" });
      router.push("/admin/leads");
    } catch (err) {
      toast.push({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Échec de l'anonymisation",
        variant: "error",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-gray-500">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  }

  if (error || !lead) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error || "Lead introuvable"}</p>
        <Link href="/admin/leads" className="mt-4 inline-block text-primary-600 hover:underline">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/leads" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{lead.garageName}</h1>
            {lead.city && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
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
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${STATUS_COLORS[lead.status]}`}
            >
              {STATUS_LABELS[lead.status]}
              <ChevronDown className="h-4 w-4" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as LeadStatus)}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      lead.status === status ? "font-medium" : ""
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleAnonymize}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact
            </h2>
            <div className="space-y-3">
              {lead.contactName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{lead.contactName}</span>
                </div>
              )}
              {lead.contactPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Téléphone</span>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${lead.contactPhone}`} className="font-medium text-primary-600 hover:underline">
                      {lead.contactPhone}
                    </a>
                    <button
                      onClick={() => handleCopy(lead.contactPhone!, "phone")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copied === "phone" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              {lead.contactEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Email</span>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${lead.contactEmail}`} className="font-medium text-primary-600 hover:underline">
                      {lead.contactEmail}
                    </a>
                    <button
                      onClick={() => handleCopy(lead.contactEmail!, "email")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copied === "email" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold">Notes</h2>
              <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{lead.notes}</p>
            </div>
          )}

          {/* Activities */}
          <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historique</h2>
              <button
                onClick={() => setShowActivityForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Activité
              </button>
            </div>

            {/* Activity form */}
            {showActivityForm && (
              <form onSubmit={handleAddActivity} className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-3 flex gap-3">
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="NOTE">Note</option>
                    <option value="CALL">Appel</option>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                    <option value="DM">DM</option>
                    <option value="DEMO">Démo</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Résumé..."
                    value={activityForm.summary}
                    onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
                <textarea
                  placeholder="Détails (optionnel)..."
                  value={activityForm.details}
                  onChange={(e) => setActivityForm({ ...activityForm, details: e.target.value })}
                  className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowActivityForm(false)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              {lead.activities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {ACTIVITY_ICONS[activity.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {ACTIVITY_LABELS[activity.type]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{activity.summary}</p>
                    {activity.details && (
                      <p className="mt-1 text-sm text-gray-500">{activity.details}</p>
                    )}
                  </div>
                </div>
              ))}
              {lead.activities.length === 0 && (
                <p className="text-center text-sm text-gray-500">Aucune activité</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta */}
          <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold">Informations</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Canal</span>
                <span className="font-medium">{lead.channel}</span>
              </div>
              {lead.source && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Source</span>
                  <span className="font-medium">{lead.source}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Créé le</span>
                <span>{formatDate(lead.createdAt)}</span>
              </div>
              {lead.lastContactedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Dernier contact</span>
                  <span>{formatDate(lead.lastContactedAt)}</span>
                </div>
              )}
              {lead.nextFollowUpAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Prochaine relance</span>
                  <span className="font-medium text-orange-600">{formatDate(lead.nextFollowUpAt)}</span>
                </div>
              )}
              {lead.ownerUser && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Responsable</span>
                  <span>{lead.ownerUser.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Conversion */}
          {lead.trialGarage && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/30">
              <h2 className="mb-4 text-lg font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Converti
              </h2>
              <div className="space-y-2 text-sm">
                <div className="font-medium">{lead.trialGarage.name}</div>
                <div className="text-green-600 dark:text-green-400">
                  Plan: {lead.trialGarage.plan} • {lead.trialGarage.status}
                </div>
                {lead.wonAt && (
                  <div className="text-gray-500">Gagné le {formatDate(lead.wonAt)}</div>
                )}
              </div>
            </div>
          )}

          {/* Lost reason */}
          {lead.status === "LOST" && lead.lostReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/30">
              <h2 className="mb-2 text-sm font-semibold text-red-800 dark:text-red-200">Raison de perte</h2>
              <p className="text-sm text-red-600 dark:text-red-300">{lead.lostReason}</p>
              {lead.lostAt && (
                <div className="mt-2 text-xs text-gray-500">Perdu le {formatDate(lead.lostAt)}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Modifier le lead</h2>
              <button onClick={() => setEditing(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Nom du garage</label>
                  <input
                    type="text"
                    value={editForm.garageName || ""}
                    onChange={(e) => setEditForm({ ...editForm, garageName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Ville</label>
                  <input
                    type="text"
                    value={editForm.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Code postal</label>
                  <input
                    type="text"
                    value={editForm.postalCode || ""}
                    onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Contact</label>
                  <input
                    type="text"
                    value={editForm.contactName || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.contactPhone || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={editForm.contactEmail || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Prochaine relance</label>
                  <input
                    type="date"
                    value={editForm.nextFollowUpAt?.split("T")[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, nextFollowUpAt: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Source</label>
                  <input
                    type="text"
                    value={editForm.source || ""}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdate}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
