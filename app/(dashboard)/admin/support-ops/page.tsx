"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Inbox,
  Timer,
  Target,
  Zap,
  Book,
  Plus,
  ChevronRight,
  Tag,
} from "lucide-react";
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

// Types
interface OpsData {
  range: string;
  kpis: {
    ticketsCreated: number;
    ticketsResolved: number;
    avgFirstResponseTimeMs: number | null;
    avgResolutionTimeMs: number | null;
    slaRespectedPct: number;
    slaBreachedCount: number;
    backlog: number;
  };
  timeseries: Array<{ date: string; created: number; resolved: number }>;
  breakdown: {
    byCategory: Array<{ key: string; count: number }>;
    byPriority: Array<{ key: string; count: number }>;
    topTags: Array<{ key: string; count: number }>;
  };
  queues: {
    slaBreached: number;
    urgentOpen: number;
    followUpsDue: number;
    totalBacklog: number;
  };
  kbSuggestions: Array<{
    tag: string;
    count: number;
    reason: string;
    suggestTitle: string;
  }>;
}

type Range = "today" | "7d" | "30d";

// Helpers
function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

const CATEGORY_LABELS: Record<string, string> = {
  BUG: "Bug technique",
  BILLING: "Facturation",
  FEATURE: "Fonctionnalité",
  LEGAL: "Juridique",
  OTHER: "Autre",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  URGENT: "Urgente",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#D1D5DB",
  NORMAL: "#93C5FD",
  HIGH: "#FDBA74",
  URGENT: "#F87171",
};

const CATEGORY_COLORS = ["#93C5FD", "#86EFAC", "#FDE047", "#F87171", "#C4B5FD"];

export default function SupportOpsPage() {
  const { isMobile, isTablet } = useResponsive();
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");
  const [creatingKb, setCreatingKb] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher<OpsData>(`/api/admin/support/ops?range=${range}`);
      setData(res);
    } catch (err) {
      toast.error("Erreur de chargement des données");
      toast.error("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateKbDraft = async (suggestion: OpsData["kbSuggestions"][0]) => {
    try {
      setCreatingKb(suggestion.tag);
      await requestJson("/api/admin/kb/articles", {
        method: "POST",
        body: {
          title: suggestion.suggestTitle,
          slug: suggestion.tag.toLowerCase().replace(/\s+/g, "-"),
          categoryId: 1,
          bodyMarkdown: `# ${suggestion.suggestTitle}\n\n## Introduction\n\nCet article répond aux questions fréquentes concernant **${suggestion.tag}**.\n\n## Contenu\n\n_À compléter..._\n\n## Besoin d'aide ?\n\nContactez notre support si vous avez d'autres questions.`,
          tags: [suggestion.tag],
          isPublished: false,
        },
      });
      toast.success(`Article "${suggestion.suggestTitle}" créé en brouillon`);
      void loadData();
    } catch (err) {
      toast.error("Erreur de création du brouillon KB");
      toast.error("Impossible de créer le brouillon");
    } finally {
      setCreatingKb(null);
    }
  };

  const statCardStyle: React.CSSProperties = { padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" };

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={24} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Support Ops</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Tableau de bord opérationnel support</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Range Selector */}
          <div style={{ display: "flex", borderRadius: "10px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
            {(["today", "7d", "30d"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} style={{ padding: "8px 16px", border: "none", background: range === r ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#fff", fontSize: "14px", fontWeight: 500, color: range === r ? "#fff" : "#6B7280", cursor: "pointer" }}>
                {r === "today" ? "Aujourd'hui" : r === "7d" ? "7 jours" : "30 jours"}
              </button>
            ))}
          </div>
          <button onClick={() => void loadData()} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
            Actualiser
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px" }}>
          <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: "16px" }}>
            {[
              { title: "Tickets créés", value: data.kpis.ticketsCreated, icon: Inbox, color: "#2563EB", bg: "#DBEAFE" },
              { title: "Tickets résolus", value: data.kpis.ticketsResolved, icon: CheckCircle, color: "#059669", bg: "#D1FAE5" },
              { title: "Temps 1ère réponse", value: formatDuration(data.kpis.avgFirstResponseTimeMs), icon: Timer, color: "#7C3AED", bg: "#EDE9FE", subtitle: "Moyenne" },
              { title: "Temps résolution", value: formatDuration(data.kpis.avgResolutionTimeMs), icon: Clock, color: "#6366F1", bg: "#EEF2FF", subtitle: "Moyenne" },
              { title: "SLA respecté", value: `${data.kpis.slaRespectedPct}%`, icon: Target, color: data.kpis.slaRespectedPct >= 90 ? "#059669" : "#D97706", bg: data.kpis.slaRespectedPct >= 90 ? "#D1FAE5" : "#FEF3C7", subtitle: `${data.kpis.slaBreachedCount} dépassés` },
              { title: "Backlog", value: data.kpis.backlog, icon: BarChart3, color: data.kpis.backlog > 20 ? "#DC2626" : "#6B7280", bg: data.kpis.backlog > 20 ? "#FEE2E2" : "#F3F4F6", subtitle: "OPEN + IN_PROGRESS" },
            ].map((stat, i) => (
              <div key={i} style={statCardStyle}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{stat.title}</p>
                    <p style={{ fontSize: "24px", fontWeight: 700, color: stat.color, margin: "4px 0 0" }}>{stat.value}</p>
                    {stat.subtitle && <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "2px 0 0" }}>{stat.subtitle}</p>}
                  </div>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <stat.icon size={18} color={stat.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "16px" }}>
            {/* Mini Bar Chart */}
            <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Tickets par jour ({data.range})</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px" }}>
                {data.timeseries.map((d, i) => {
                  const maxValue = Math.max(...data.timeseries.map((t) => Math.max(t.created, t.resolved)), 1);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                      <div style={{ display: "flex", gap: "2px", height: "100px", width: "100%", alignItems: "flex-end" }}>
                        <div style={{ flex: 1, background: "#93C5FD", borderRadius: "4px 4px 0 0", height: `${(d.created / maxValue) * 100}%` }} title={`Créés: ${d.created}`} />
                        <div style={{ flex: 1, background: "#86EFAC", borderRadius: "4px 4px 0 0", height: `${(d.resolved / maxValue) * 100}%` }} title={`Résolus: ${d.resolved}`} />
                      </div>
                      <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{new Date(d.date).getDate()}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B7280" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#93C5FD" }} /> Créés
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B7280" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#86EFAC" }} /> Résolus
                </span>
              </div>
            </div>

            {/* By Category */}
            <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Par catégorie</h3>
              <div style={{ display: "flex", height: "20px", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                {data.breakdown.byCategory.map((d, i) => {
                  const total = data.breakdown.byCategory.reduce((a, b) => a + b.count, 0) || 1;
                  return <div key={d.key} style={{ width: `${(d.count / total) * 100}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} title={`${CATEGORY_LABELS[d.key] || d.key}: ${d.count}`} />;
                })}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.breakdown.byCategory.map((d, i) => (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span style={{ color: "#374151" }}>{CATEGORY_LABELS[d.key] || d.key}</span>
                    </span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Priority */}
            <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Par priorité</h3>
              <div style={{ display: "flex", height: "20px", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                {data.breakdown.byPriority.map((d) => {
                  const total = data.breakdown.byPriority.reduce((a, b) => a + b.count, 0) || 1;
                  return <div key={d.key} style={{ width: `${(d.count / total) * 100}%`, background: PRIORITY_COLORS[d.key] || "#D1D5DB" }} title={`${PRIORITY_LABELS[d.key] || d.key}: ${d.count}`} />;
                })}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.breakdown.byPriority.map((d) => (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: PRIORITY_COLORS[d.key] || "#D1D5DB" }} />
                      <span style={{ color: "#374151" }}>{PRIORITY_LABELS[d.key] || d.key}</span>
                    </span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Queues & Tags Row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
            {/* Queues */}
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Files d&apos;attente</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { title: "En retard SLA", count: data.queues.slaBreached, icon: AlertTriangle, href: "/admin/support?status=OPEN&slaBreached=true", color: "#DC2626", bg: "#FEE2E2", critical: true },
                  { title: "Urgent ouverts", count: data.queues.urgentOpen, icon: Zap, href: "/admin/support?priority=URGENT&status=OPEN", color: "#D97706", bg: "#FEF3C7", critical: true },
                  { title: "Relances dues", count: data.queues.followUpsDue, icon: Clock, href: "/admin/support?status=WAITING_CUSTOMER", color: "#CA8A04", bg: "#FEF9C3", critical: false },
                  { title: "Backlog total", count: data.queues.totalBacklog, icon: Inbox, href: "/admin/support?status=OPEN", color: "#2563EB", bg: "#DBEAFE", critical: false },
                ].map((q, i) => (
                  <Link key={i} href={q.href} style={{ display: "block", padding: "16px", borderRadius: "12px", background: "#fff", border: q.critical && q.count > 0 ? "2px solid #F87171" : "1px solid #E5E7EB", textDecoration: "none", transition: "transform 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: q.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <q.icon size={18} color={q.color} />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{q.title}</p>
                          <p style={{ fontSize: "20px", fontWeight: 700, color: q.critical && q.count > 0 ? "#DC2626" : "#111827", margin: 0 }}>{q.count}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Tags */}
            <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Tag size={16} color="#6B7280" />
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Top Tags</h3>
              </div>
              {data.breakdown.topTags.length === 0 ? (
                <p style={{ fontSize: "14px", color: "#6B7280" }}>Aucun tag sur cette période</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {data.breakdown.topTags.map((tag, i) => {
                    const maxCount = data.breakdown.topTags[0]?.count || 1;
                    return (
                      <div key={tag.key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ width: "16px", fontSize: "12px", color: "#9CA3AF", textAlign: "center" }}>{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>{tag.key}</span>
                            <span style={{ fontSize: "12px", color: "#6B7280" }}>{tag.count}</span>
                          </div>
                          <div style={{ height: "6px", borderRadius: "3px", background: "#F3F4F6" }}>
                            <div style={{ height: "6px", borderRadius: "3px", background: "#A78BFA", width: `${(tag.count / maxCount) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* KB Suggestions */}
          {data.kbSuggestions.length > 0 && (
            <div style={{ padding: "20px", borderRadius: "16px", background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Book size={16} color="#92400E" />
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#92400E", margin: 0 }}>Suggestions d&apos;articles KB</h3>
              </div>
              <p style={{ fontSize: "12px", color: "#A16207", marginBottom: "16px" }}>Ces tags reviennent souvent mais n&apos;ont pas d&apos;article KB associé.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.kbSuggestions.map((s) => (
                  <div key={s.tag} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "12px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: "#FEF3C7", color: "#92400E" }}>{s.tag}</span>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>{s.count} tickets</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0" }}>{s.reason}</p>
                    </div>
                    <button onClick={() => void handleCreateKbDraft(s)} disabled={creatingKb === s.tag} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer", opacity: creatingKb === s.tag ? 0.5 : 1 }}>
                      {creatingKb === s.tag ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
                      Créer brouillon
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
