"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
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
import { useToast } from "@/components/ui/Toast";

// ============================================
// Types
// ============================================

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

// ============================================
// Helpers
// ============================================

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}j ${hours % 24}h`;
  }
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
  LOW: "bg-gray-200",
  NORMAL: "bg-blue-200",
  HIGH: "bg-orange-300",
  URGENT: "bg-red-400",
};

// ============================================
// Components
// ============================================

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = "text-[var(--ms-primary)]",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="ms-card">
      <div className="ms-card-body">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--ms-text-muted)]">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-[var(--ms-text-muted)]">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Icon size={24} className={color} />
            {trend === "up" && <TrendingUp size={14} className="text-green-500" />}
            {trend === "down" && <TrendingDown size={14} className="text-red-500" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data, label }: { data: Array<{ date: string; created: number; resolved: number }>; label: string }) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.created, d.resolved)), 1);
  
  return (
    <div className="ms-card">
      <div className="ms-card-header">
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
      <div className="ms-card-body">
        <div className="flex items-end gap-1 h-32">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5" style={{ height: "100px" }}>
                <div
                  className="flex-1 bg-blue-400 rounded-t"
                  style={{ height: `${(d.created / maxValue) * 100}%`, marginTop: "auto" }}
                  title={`Créés: ${d.created}`}
                />
                <div
                  className="flex-1 bg-green-400 rounded-t"
                  style={{ height: `${(d.resolved / maxValue) * 100}%`, marginTop: "auto" }}
                  title={`Résolus: ${d.resolved}`}
                />
              </div>
              <span className="text-[8px] text-[var(--ms-text-muted)]">
                {new Date(d.date).getDate()}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-400" /> Créés
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-400" /> Résolus
          </span>
        </div>
      </div>
    </div>
  );
}

function PieBreakdown({
  title,
  data,
  labels,
  colors,
}: {
  title: string;
  data: Array<{ key: string; count: number }>;
  labels: Record<string, string>;
  colors?: Record<string, string>;
}) {
  const total = data.reduce((a, b) => a + b.count, 0) || 1;
  const defaultColors = ["bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-red-400", "bg-purple-400"];

  return (
    <div className="ms-card">
      <div className="ms-card-header">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="ms-card-body">
        {/* Simple horizontal stacked bar */}
        <div className="flex h-6 rounded-full overflow-hidden mb-3">
          {data.map((d, i) => (
            <div
              key={d.key}
              className={colors?.[d.key] || defaultColors[i % defaultColors.length]}
              style={{ width: `${(d.count / total) * 100}%` }}
              title={`${labels[d.key] || d.key}: ${d.count}`}
            />
          ))}
        </div>
        <div className="space-y-1">
          {data.map((d, i) => (
            <div key={d.key} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded ${colors?.[d.key] || defaultColors[i % defaultColors.length]}`}
                />
                {labels[d.key] || d.key}
              </span>
              <span className="font-medium">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QueueCard({
  title,
  count,
  icon: Icon,
  href,
  color,
  critical,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  href: string;
  color: string;
  critical?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`ms-card transition-transform hover:scale-[1.02] ${critical && count > 0 ? "ring-2 ring-red-400" : ""}`}
    >
      <div className="ms-card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${color}`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-[var(--ms-text-muted)]">{title}</p>
              <p className={`text-xl font-bold ${critical && count > 0 ? "text-red-600" : "text-[var(--ms-text)]"}`}>
                {count}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-[var(--ms-text-muted)]" />
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Main Page
// ============================================

export default function SupportOpsPage() {
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");
  const [creatingKb, setCreatingKb] = useState<string | null>(null);
  const toast = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher<OpsData>(`/api/admin/support/ops?range=${range}`);
      setData(res);
    } catch (err) {
      console.error("Failed to load ops data:", err);
      toast.push({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [range, toast]);

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
          categoryId: 1, // Default category
          bodyMarkdown: `# ${suggestion.suggestTitle}\n\n## Introduction\n\nCet article répond aux questions fréquentes concernant **${suggestion.tag}**.\n\n## Contenu\n\n_À compléter..._\n\n## Besoin d'aide ?\n\nContactez notre support si vous avez d'autres questions.`,
          tags: [suggestion.tag],
          isPublished: false, // Draft only
        },
      });
      toast.push({
        title: "Brouillon créé",
        description: `Article "${suggestion.suggestTitle}" créé en brouillon`,
        variant: "success",
      });
      void loadData();
    } catch (err) {
      console.error("Failed to create KB draft:", err);
      toast.push({
        title: "Erreur",
        description: "Impossible de créer le brouillon",
        variant: "error",
      });
    } finally {
      setCreatingKb(null);
    }
  };

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Support Ops</h1>
          <p className="ms-page-subtitle">Tableau de bord opérationnel support</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range Selector */}
          <div className="flex rounded-lg border border-[var(--ms-border)] bg-white">
            {(["today", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  range === r
                    ? "bg-[var(--ms-primary)] text-white"
                    : "text-[var(--ms-text-muted)] hover:bg-gray-50"
                } ${r === "today" ? "rounded-l-lg" : ""} ${r === "30d" ? "rounded-r-lg" : ""}`}
              >
                {r === "today" ? "Aujourd'hui" : r === "7d" ? "7 jours" : "30 jours"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="ms-btn ms-btn-secondary"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Actualiser
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              title="Tickets créés"
              value={data.kpis.ticketsCreated}
              icon={Inbox}
              color="text-blue-600"
            />
            <StatCard
              title="Tickets résolus"
              value={data.kpis.ticketsResolved}
              icon={CheckCircle}
              color="text-green-600"
            />
            <StatCard
              title="Temps 1ère réponse"
              value={formatDuration(data.kpis.avgFirstResponseTimeMs)}
              icon={Timer}
              color="text-purple-600"
              subtitle="Moyenne"
            />
            <StatCard
              title="Temps résolution"
              value={formatDuration(data.kpis.avgResolutionTimeMs)}
              icon={Clock}
              color="text-indigo-600"
              subtitle="Moyenne"
            />
            <StatCard
              title="SLA respecté"
              value={`${data.kpis.slaRespectedPct}%`}
              icon={Target}
              color={data.kpis.slaRespectedPct >= 90 ? "text-green-600" : "text-orange-600"}
              subtitle={`${data.kpis.slaBreachedCount} dépassés`}
            />
            <StatCard
              title="Backlog"
              value={data.kpis.backlog}
              icon={BarChart3}
              color={data.kpis.backlog > 20 ? "text-red-600" : "text-gray-600"}
              subtitle="OPEN + IN_PROGRESS"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MiniBarChart
              data={data.timeseries}
              label={`Tickets par jour (${data.range})`}
            />
            <PieBreakdown
              title="Par catégorie"
              data={data.breakdown.byCategory}
              labels={CATEGORY_LABELS}
            />
            <PieBreakdown
              title="Par priorité"
              data={data.breakdown.byPriority}
              labels={PRIORITY_LABELS}
              colors={PRIORITY_COLORS}
            />
          </div>

          {/* Queues & Tags Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Queues */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[var(--ms-text)]">Files d'attente</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <QueueCard
                  title="En retard SLA"
                  count={data.queues.slaBreached}
                  icon={AlertTriangle}
                  href="/admin/support?status=OPEN&slaBreached=true"
                  color="bg-red-500"
                  critical
                />
                <QueueCard
                  title="Urgent ouverts"
                  count={data.queues.urgentOpen}
                  icon={Zap}
                  href="/admin/support?priority=URGENT&status=OPEN"
                  color="bg-orange-500"
                  critical
                />
                <QueueCard
                  title="Relances dues"
                  count={data.queues.followUpsDue}
                  icon={Clock}
                  href="/admin/support?status=WAITING_CUSTOMER"
                  color="bg-yellow-500"
                />
                <QueueCard
                  title="Backlog total"
                  count={data.queues.totalBacklog}
                  icon={Inbox}
                  href="/admin/support?status=OPEN"
                  color="bg-blue-500"
                />
              </div>
            </div>

            {/* Top Tags */}
            <div className="ms-card">
              <div className="ms-card-header">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Tag size={16} />
                  Top Tags
                </h3>
              </div>
              <div className="ms-card-body">
                {data.breakdown.topTags.length === 0 ? (
                  <p className="text-sm text-[var(--ms-text-muted)]">Aucun tag sur cette période</p>
                ) : (
                  <div className="space-y-2">
                    {data.breakdown.topTags.map((tag, i) => {
                      const maxCount = data.breakdown.topTags[0]?.count || 1;
                      return (
                        <div key={tag.key} className="flex items-center gap-3">
                          <span className="w-4 text-xs text-[var(--ms-text-muted)]">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{tag.key}</span>
                              <span className="text-xs text-[var(--ms-text-muted)]">{tag.count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100">
                              <div
                                className="h-1.5 rounded-full bg-purple-400"
                                style={{ width: `${(tag.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KB Suggestions */}
          {data.kbSuggestions.length > 0 && (
            <div className="ms-card border-amber-200 bg-amber-50">
              <div className="ms-card-header">
                <h3 className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <Book size={16} />
                  Suggestions d'articles KB
                </h3>
              </div>
              <div className="ms-card-body">
                <p className="mb-3 text-xs text-amber-700">
                  Ces tags reviennent souvent mais n'ont pas d'article KB associé.
                </p>
                <div className="space-y-2">
                  {data.kbSuggestions.map((s) => (
                    <div
                      key={s.tag}
                      className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {s.tag}
                          </span>
                          <span className="text-xs text-[var(--ms-text-muted)]">
                            {s.count} tickets
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--ms-text-muted)]">{s.reason}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCreateKbDraft(s)}
                        disabled={creatingKb === s.tag}
                        className="ms-btn ms-btn-secondary text-xs"
                      >
                        {creatingKb === s.tag ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Plus size={14} />
                        )}
                        Créer brouillon
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
