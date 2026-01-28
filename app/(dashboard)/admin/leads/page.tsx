"use client";

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
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/components/user-context";
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

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  NEW: { label: "Nouveau", color: "#2563EB", bg: "#DBEAFE" },
  CONTACTED: { label: "Contacté", color: "#6366F1", bg: "#EEF2FF" },
  DEMO_SCHEDULED: { label: "Démo planifiée", color: "#D97706", bg: "#FEF3C7" },
  DEMO_DONE: { label: "Démo effectuée", color: "#EA580C", bg: "#FFEDD5" },
  TRIAL_STARTED: { label: "Essai démarré", color: "#7C3AED", bg: "#EDE9FE" },
  WON: { label: "Gagné", color: "#059669", bg: "#D1FAE5" },
  LOST: { label: "Perdu", color: "#DC2626", bg: "#FEE2E2" },
};

const CHANNEL_ICONS: Record<LeadChannel, { icon: typeof Instagram; color: string }> = {
  INSTAGRAM: { icon: Instagram, color: "#E1306C" },
  FACEBOOK: { icon: Facebook, color: "#1877F2" },
  SMS: { icon: MessageSquare, color: "#10B981" },
  EMAIL: { icon: Mail, color: "#6B7280" },
  PHONE: { icon: Phone, color: "#6366F1" },
  LINKEDIN: { icon: Users, color: "#0A66C2" },
  REFERRAL: { icon: Users, color: "#F59E0B" },
  OTHER: { icon: Users, color: "#9CA3AF" },
};

const CHANNEL_OPTIONS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Téléphone" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "REFERRAL", label: "Parrainage" },
  { value: "OTHER", label: "Autre" },
];

function formatDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
}

function isToday(input?: string | null): boolean {
  if (!input) return false;
  return new Date(input).toDateString() === new Date().toDateString();
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
  const { isMobile, isTablet } = useResponsive();
  const isAdmin = user?.role === "ADMIN";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [channelFilter, setChannelFilter] = useState<LeadChannel | "">("");
  const [followUpToday, setFollowUpToday] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating] = useState(false);

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
      const data = await fetcher<Lead[]>(`/api/admin/leads?${params}`, { noStore: true });
      setLeads(data ?? []);
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
    setCreating(true);
    try {
      await requestJson("/api/admin/leads", { method: "POST", body: newLead });
      toast.success(`${newLead.garageName} ajouté au pipeline`);
      setShowNewForm(false);
      setNewLead({ garageName: "", city: "", contactName: "", contactEmail: "", contactPhone: "", channel: "OTHER", source: "", notes: "", nextFollowUpAt: "" });
      loadLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de créer le lead");
    } finally {
      setCreating(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    window.open(`/api/admin/leads/export?${params}`, "_blank");
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "14px", color: "#111827", background: "#fff", outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" };

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <Shield size={32} color="#DC2626" />
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Accès refusé</h2>
        <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "NEW").length,
    inProgress: leads.filter((l) => ["CONTACTED", "DEMO_SCHEDULED", "DEMO_DONE", "TRIAL_STARTED"].includes(l.status)).length,
    won: leads.filter((l) => l.status === "WON").length,
    followUpToday: leads.filter((l) => isToday(l.nextFollowUpAt)).length,
    overdue: leads.filter((l) => isPast(l.nextFollowUpAt)).length,
  };

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={24} color="#6366F1" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Pipeline Leads</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>CRM interne pour la prospection garages</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowNewForm(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Plus size={16} /> Nouveau Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total", value: stats.total, icon: Users, color: "#6366F1", bg: "#EEF2FF" },
          { label: "Nouveaux", value: stats.new, icon: Plus, color: "#2563EB", bg: "#DBEAFE" },
          { label: "En cours", value: stats.inProgress, icon: TrendingUp, color: "#D97706", bg: "#FEF3C7" },
          { label: "Gagnés", value: stats.won, icon: CheckCircle, color: "#059669", bg: "#D1FAE5" },
          { label: "Relances", value: stats.followUpToday, icon: Clock, color: "#EA580C", bg: "#FFEDD5" },
          { label: "En retard", value: stats.overdue, icon: AlertTriangle, color: "#DC2626", bg: "#FEE2E2" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ padding: "16px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 4px" }}>{item.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={item.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "300px" }}>
          <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: "40px" }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")} style={{ ...inputStyle, width: "auto", minWidth: "150px" }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
        </select>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as LeadChannel | "")} style={{ ...inputStyle, width: "auto", minWidth: "150px" }}>
          <option value="">Tous les canaux</option>
          {CHANNEL_OPTIONS.map((ch) => (<option key={ch.value} value={ch.value}>{ch.label}</option>))}
        </select>
        <button onClick={() => setFollowUpToday(!followUpToday)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", borderRadius: "10px", border: followUpToday ? "none" : "1px solid #E5E7EB", background: followUpToday ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#fff", fontSize: "14px", fontWeight: 500, color: followUpToday ? "#fff" : "#374151", cursor: "pointer" }}>
          <Calendar size={16} /> Relances du jour
        </button>
        <button onClick={() => void loadLeads()} style={{ padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
          <RefreshCw size={18} color="#6B7280" style={loading ? { animation: "spin 1s linear infinite" } : {}} />
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: "24px" }}>
          <AlertTriangle size={20} color="#DC2626" />
          <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
          <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {!loading && leads.length > 0 && (
        <div style={{ borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {isMobile ? (
            <div>
              {leads.map((lead, idx) => {
                const statusCfg = STATUS_CONFIG[lead.status];
                const channelCfg = CHANNEL_ICONS[lead.channel];
                const ChannelIcon = channelCfg.icon;
                return (
                  <div key={lead.id} style={{ padding: "16px", borderBottom: idx < leads.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>{lead.garageName}</span>
                      <ChannelIcon size={16} color={channelCfg.color} />
                    </div>
                    {lead.city && <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 8px" }}>{lead.postalCode} {lead.city}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                      {lead.nextFollowUpAt && (
                        <span style={{ fontSize: "12px", fontWeight: 500, color: isPast(lead.nextFollowUpAt) ? "#DC2626" : isToday(lead.nextFollowUpAt) ? "#EA580C" : "#6B7280" }}>
                          {formatDate(lead.nextFollowUpAt)}
                        </span>
                      )}
                    </div>
                    <Link href={`/admin/leads/${lead.id}`} style={{ fontSize: "14px", color: "#6366F1", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                      Voir <ChevronRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Garage</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Contact</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Canal</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Statut</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Relance</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Activités</th>
                    <th style={{ padding: "12px 16px", width: "100px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, idx) => {
                    const statusCfg = STATUS_CONFIG[lead.status];
                    const channelCfg = CHANNEL_ICONS[lead.channel];
                    const ChannelIcon = channelCfg.icon;
                    return (
                      <tr key={lead.id} style={{ borderBottom: idx < leads.length - 1 ? "1px solid #F3F4F6" : "none", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{lead.garageName}</div>
                          {lead.city && <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lead.postalCode} {lead.city}</div>}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {lead.contactName && <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{lead.contactName}</div>}
                          {lead.contactPhone && <div style={{ fontSize: "12px", color: "#6B7280" }}>{lead.contactPhone}</div>}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ChannelIcon size={16} color={channelCfg.color} />
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {lead.nextFollowUpAt && (
                            <span style={{ fontSize: "14px", fontWeight: 500, color: isPast(lead.nextFollowUpAt) ? "#DC2626" : isToday(lead.nextFollowUpAt) ? "#EA580C" : "#6B7280" }}>
                              {formatDate(lead.nextFollowUpAt)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "14px", color: "#6B7280" }}>{lead._count.activities}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <Link href={`/admin/leads/${lead.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "14px", fontWeight: 500, color: "#6366F1", textDecoration: "none" }}>
                            Voir <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && leads.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Users size={32} color="#9CA3AF" />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Aucun lead trouvé</p>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>Commencez par ajouter votre premier prospect</p>
          <button onClick={() => setShowNewForm(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Plus size={16} /> Créer un lead
          </button>
        </div>
      )}

      {/* Modal */}
      {showNewForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }} onClick={() => setShowNewForm(false)}>
          <div style={{ width: "100%", maxWidth: "560px", borderRadius: "16px", background: "#fff", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Nouveau Lead</h2>
              <button onClick={() => setShowNewForm(false)} style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer" }}><X size={20} color="#6B7280" /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: "24px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                  <label style={labelStyle}>Nom du garage *</label>
                  <input type="text" required value={newLead.garageName} onChange={(e) => setNewLead({ ...newLead, garageName: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input type="text" value={newLead.city} onChange={(e) => setNewLead({ ...newLead, city: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Canal</label>
                  <select value={newLead.channel} onChange={(e) => setNewLead({ ...newLead, channel: e.target.value as LeadChannel })} style={inputStyle}>
                    {CHANNEL_OPTIONS.map((ch) => (<option key={ch.value} value={ch.value}>{ch.label}</option>))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Contact</label>
                  <input type="text" value={newLead.contactName} onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="tel" value={newLead.contactPhone} onChange={(e) => setNewLead({ ...newLead, contactPhone: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={newLead.contactEmail} onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Source</label>
                  <input type="text" placeholder="Ex: Campagne IG Janvier" value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Prochaine relance</label>
                  <input type="date" value={newLead.nextFollowUpAt} onChange={(e) => setNewLead({ ...newLead, nextFollowUpAt: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea rows={2} value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                <button type="button" onClick={() => setShowNewForm(false)} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Annuler</button>
                <button type="submit" disabled={creating} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: creating ? 0.5 : 1 }}>
                  {creating ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />} Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
