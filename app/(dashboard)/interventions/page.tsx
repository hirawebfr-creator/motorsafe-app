"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Pencil,
  Plus,
  Trash2,
  Wrench,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/dashboard/stat-card";

type VehicleOption = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { firstName: string; lastName: string };
};

type InterventionItem = {
  id: string;
  type: string;
  createdAt: string;
  performedAt?: string | null;
  vehicle: VehicleOption;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function unwrapOk(json: unknown): unknown {
  if (isRecord(json) && json.ok === true && "data" in json) return json.data;
  return json;
}

function pickArray(json: unknown): unknown[] {
  const data = unwrapOk(json);
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  if (isRecord(data) && Array.isArray(data.data)) return data.data;
  return [];
}

function fmtDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  E85: { bg: "var(--ms-success-light)", text: "var(--ms-success)", label: "E85" },
  Reprog: { bg: "var(--ms-primary-light)", text: "var(--ms-primary)", label: "Reprog" },
  Diag: { bg: "var(--ms-warning-light)", text: "#B45309", label: "Diagnostic" },
  Autre: { bg: "var(--ms-bg-subtle)", text: "var(--ms-text-secondary)", label: "Autre" },
};

export default function InterventionsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InterventionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);

  async function load(search: string) {
    try {
      setLoading(true);
      setError(null);

      const url = new URL("/api/interventions", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "100");
      if (search.trim()) url.searchParams.set("q", search.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          json?.error?.message || json?.error || `GET /api/interventions ${res.status}`;
        throw new Error(message);
      }

      setItems(pickArray(json) as InterventionItem[]);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void load(q);
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  async function onDelete(id: string) {
    const ok = window.confirm(
      "Supprimer cette intervention ? Cette action est irréversible."
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/interventions/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          json?.error?.message ||
          json?.error ||
          `DELETE /api/interventions/${id} ${res.status}`;
        throw new Error(message);
      }
      await load(q);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur suppression");
    } finally {
      setDeletingId(null);
    }
  }

  const rows = useMemo(() => items ?? [], [items]);

  // Stats
  const stats = useMemo(() => {
    const total = rows.length;
    const thisMonth = rows.filter((r) => {
      const d = new Date(r.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const types = rows.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    return { total, thisMonth, topType: topType?.[0] || "—" };
  }, [rows]);

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <PageHeader
        title="Interventions"
        subtitle="Gérez toutes vos interventions et dossiers techniques"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Interventions" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Rechercher une intervention..."
              className="w-64"
            />
            <Link href="/interventions/nouveau" className="ms-btn ms-btn-primary">
              <Plus size={18} />
              Nouvelle intervention
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total interventions"
          value={loading ? "—" : stats.total}
          icon={Wrench}
          iconGradient="from-[var(--ms-primary)] to-[#8B5CF6]"
          loading={loading}
          delay={1}
        />
        <StatCard
          label="Ce mois-ci"
          value={loading ? "—" : stats.thisMonth}
          icon={TrendingUp}
          iconGradient="from-[var(--ms-success)] to-[#34D399]"
          trend={!loading && stats.thisMonth > 0 ? { direction: "up", label: `+${stats.thisMonth} ce mois` } : undefined}
          loading={loading}
          delay={2}
        />
        <StatCard
          label="Type principal"
          value={loading ? "—" : stats.topType}
          icon={Calendar}
          iconGradient="from-[#F59E0B] to-[#EAB308]"
          loading={loading}
          delay={3}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="ms-alert ms-alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="ms-table-container">
        <div
          className="ms-table-header"
          style={{ gridTemplateColumns: "1.2fr 1.5fr 1.2fr 100px 120px 100px" }}
        >
          <div>Immatriculation</div>
          <div>Véhicule</div>
          <div>Client</div>
          <div>Type</div>
          <div>Date</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="max-h-[calc(100vh-420px)] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="ms-skeleton h-16 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Aucune intervention"
              description="Créez votre première intervention pour commencer à suivre vos dossiers."
              action={{
                label: "Créer une intervention",
                href: "/interventions/nouveau",
              }}
            />
          ) : (
            rows.map((item, idx) => {
              const plate = item.vehicle?.plate || "—";
              const brandModel =
                `${item.vehicle?.brand ?? ""} ${item.vehicle?.model ?? ""}`.trim() ||
                "—";
              const clientName = item.vehicle?.client
                ? `${item.vehicle.client.firstName} ${item.vehicle.client.lastName}`
                : "—";
              const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.Autre;
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="ms-table-row ms-animate-slide-up"
                  style={{
                    gridTemplateColumns: "1.2fr 1.5fr 1.2fr 100px 120px 100px",
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  <Link
                    href={`/interventions/${item.id}`}
                    className="font-semibold text-[var(--ms-text)] hover:text-[var(--ms-primary)] transition-colors"
                  >
                    {plate}
                  </Link>
                  <div className="text-[var(--ms-text-secondary)] truncate">
                    {brandModel}
                  </div>
                  <div className="text-[var(--ms-text-secondary)] truncate">
                    {clientName}
                  </div>
                  <div>
                    <span
                      className="ms-badge"
                      style={{
                        background: typeConfig.bg,
                        color: typeConfig.text,
                      }}
                    >
                      {typeConfig.label}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--ms-text-muted)]">
                    {fmtDate(item.createdAt)}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`/api/interventions/${item.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="ms-btn-icon-sm ms-btn-ghost rounded-lg"
                      title="Télécharger PDF"
                    >
                      <FileText size={16} />
                    </a>
                    <Link
                      href={`/interventions/${item.id}`}
                      className="ms-btn-icon-sm ms-btn-ghost rounded-lg"
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      disabled={isDeleting}
                      className="ms-btn-icon-sm rounded-lg text-[var(--ms-text-muted)] hover:bg-[var(--ms-error-light)] hover:text-[var(--ms-error)] transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      {!loading && rows.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--ms-text-muted)]">
          <span>
            {rows.length} intervention{rows.length > 1 ? "s" : ""}
          </span>
          <span>Dernière mise à jour : maintenant</span>
        </div>
      )}
    </div>
  );
}
