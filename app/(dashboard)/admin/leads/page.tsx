"use client";

/**
 * LEADS-CRM-01: Lead Pipeline Dashboard
 * 
 * Admin-only page for managing sales leads
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Download,
  Calendar,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageSquare,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";
import { useToast } from "@/components/ui/Toast";

// Types
type LeadStatus = "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "DEMO_DONE" | "TRIAL_STARTED" | "WON" | "LOST";
type LeadChannel = "INSTAGRAM" | "FACEBOOK" | "SMS" | "EMAIL" | "PHONE" | "LINKEDIN" | "REFERRAL" | "OTHER";

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
  createdAt: string;
  ownerUser: { id: string; email: string } | null;
  trialGarage: { id: number; name: string } | null;
  _count: { activities: number };
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
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CONTACTED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  DEMO_SCHEDULED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  DEMO_DONE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  TRIAL_STARTED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  WON: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const CHANNEL_ICONS: Record<LeadChannel, React.ReactNode> = {
  INSTAGRAM: <Instagram className="h-4 w-4" />,
  FACEBOOK: <Facebook className="h-4 w-4" />,
  SMS: <MessageSquare className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  PHONE: <Phone className="h-4 w-4" />,
  LINKEDIN: <span className="font-bold text-xs">in</span>,
  REFERRAL: <span className="text-xs">🤝</span>,
  OTHER: <span className="text-xs">•</span>,
};

function formatDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

function isToday(input?: string | null): boolean {
  if (!input) return false;
  const d = new Date(input);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function isPast(input?: string | null): boolean {
  if (!input) return false;
  const d = new Date(input);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export default function AdminLeadsPage() {
  const user = useUser();
  const toast = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [channelFilter, setChannelFilter] = useState<LeadChannel | "">("");
  const [followUpToday, setFollowUpToday] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  // New lead form state
  const [newLead, setNewLead] = useState({
    garageName: "",
    city: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    channel: "OTHER" as LeadChannel,
    source: "",
    notes: "",
    nextFollowUpAt: "",
  });

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (channelFilter) params.set("channel", channelFilter);
      if (followUpToday) params.set("followUpToday", "true");

      const data = await fetcher<{ data: Lead[] }>(`/api/admin/leads?${params}`, {
        noStore: true,
      });
      setLeads(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, channelFilter, followUpToday]);

  useEffect(() => {
    if (isAdmin) loadLeads();
  }, [isAdmin, loadLeads]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestJson("/api/admin/leads", {
        method: "POST",
        body: newLead,
      });
      toast.push({
        title: "Lead créé",
        description: `${newLead.garageName} ajouté au pipeline`,
        variant: "success",
      });
      setShowNewForm(false);
      setNewLead({
        garageName: "",
        city: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        channel: "OTHER",
        source: "",
        notes: "",
        nextFollowUpAt: "",
      });
      loadLeads();
    } catch (err) {
      toast.push({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de créer le lead",
        variant: "error",
      });
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    window.open(`/api/admin/leads/export?${params}`, "_blank");
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-gray-500">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  // Stats
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "NEW").length,
    inProgress: leads.filter((l) => 
      ["CONTACTED", "DEMO_SCHEDULED", "DEMO_DONE", "TRIAL_STARTED"].includes(l.status)
    ).length,
    won: leads.filter((l) => l.status === "WON").length,
    followUpToday: leads.filter((l) => isToday(l.nextFollowUpAt)).length,
    overdue: leads.filter((l) => isPast(l.nextFollowUpAt)).length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Leads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            CRM interne pour la prospection garages
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.new}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Nouveaux</div>
        </div>
        <div className="rounded-lg border bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/30">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.inProgress}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">En cours</div>
        </div>
        <div className="rounded-lg border bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.won}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Gagnés</div>
        </div>
        <div className="rounded-lg border bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/30">
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.followUpToday}</div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Relances aujourd&apos;hui</div>
        </div>
        <div className="rounded-lg border bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.overdue}</div>
          <div className="text-sm text-red-600 dark:text-red-400">En retard</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as LeadChannel | "")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Tous les canaux</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
          <option value="PHONE">Téléphone</option>
          <option value="LINKEDIN">LinkedIn</option>
          <option value="REFERRAL">Parrainage</option>
          <option value="OTHER">Autre</option>
        </select>
        <button
          onClick={() => setFollowUpToday(!followUpToday)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            followUpToday 
              ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-300"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Relances du jour
        </button>
        <button onClick={loadLeads} className="text-sm text-primary-600 hover:underline">
          Actualiser
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-gray-500">
          Chargement...
        </div>
      )}

      {/* Leads Table */}
      {!loading && leads.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Garage</th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
                <th className="px-4 py-3 text-left font-medium">Canal</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Relance</th>
                <th className="px-4 py-3 text-left font-medium">Activités</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{lead.garageName}</div>
                    {lead.city && (
                      <div className="text-xs text-gray-500">{lead.postalCode} {lead.city}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.contactName && <div className="font-medium">{lead.contactName}</div>}
                    {lead.contactPhone && (
                      <div className="text-xs text-gray-500">{lead.contactPhone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      {CHANNEL_ICONS[lead.channel]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.nextFollowUpAt && (
                      <span className={`text-sm ${
                        isPast(lead.nextFollowUpAt) 
                          ? "font-medium text-red-600 dark:text-red-400"
                          : isToday(lead.nextFollowUpAt)
                          ? "font-medium text-orange-600 dark:text-orange-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}>
                        {formatDate(lead.nextFollowUpAt)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead._count.activities}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                    >
                      Voir <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && leads.length === 0 && (
        <div className="py-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-gray-500">Aucun lead trouvé</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-4 text-sm text-primary-600 hover:underline"
          >
            Créer un nouveau lead
          </button>
        </div>
      )}

      {/* New Lead Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Nouveau Lead</h2>
              <button onClick={() => setShowNewForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Nom du garage *</label>
                  <input
                    type="text"
                    required
                    value={newLead.garageName}
                    onChange={(e) => setNewLead({ ...newLead, garageName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Ville</label>
                  <input
                    type="text"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Canal</label>
                  <select
                    value={newLead.channel}
                    onChange={(e) => setNewLead({ ...newLead, channel: e.target.value as LeadChannel })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Téléphone</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="REFERRAL">Parrainage</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Contact</label>
                  <input
                    type="text"
                    value={newLead.contactName}
                    onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Téléphone</label>
                  <input
                    type="tel"
                    value={newLead.contactPhone}
                    onChange={(e) => setNewLead({ ...newLead, contactPhone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={newLead.contactEmail}
                    onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Source</label>
                  <input
                    type="text"
                    placeholder="Ex: Campagne IG Janvier"
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Prochaine relance</label>
                  <input
                    type="date"
                    value={newLead.nextFollowUpAt}
                    onChange={(e) => setNewLead({ ...newLead, nextFollowUpAt: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Notes</label>
                  <textarea
                    rows={2}
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
