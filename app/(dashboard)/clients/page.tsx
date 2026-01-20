"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/dashboard/stat-card";

type ClientItem = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
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

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClientItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const debounceRef = useRef<number | null>(null);

  async function load(search: string) {
    try {
      setLoading(true);
      setError(null);

      const url = new URL("/api/clients", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "100");
      if (search.trim()) url.searchParams.set("q", search.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          json?.error?.message || json?.error || `GET /api/clients ${res.status}`;
        throw new Error(message);
      }

      setItems(pickArray(json) as ClientItem[]);
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

  async function onDelete(id: number) {
    const ok = window.confirm(
      "Supprimer ce client ? Cette action est irréversible."
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          json?.error?.message || json?.error || `DELETE /api/clients/${id} ${res.status}`;
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
    const withEmail = rows.filter((r) => r.email).length;
    return { total, thisMonth, withEmail };
  }, [rows]);

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <PageHeader
        title="Clients"
        subtitle="Gérez votre base de clients et leurs informations"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clients" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Rechercher un client..."
              className="w-64"
            />
            <Link href="/clients/nouveau" className="ms-btn ms-btn-primary">
              <Plus size={18} />
              Nouveau client
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total clients"
          value={loading ? "—" : stats.total}
          icon={Users}
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
          label="Avec email"
          value={loading ? "—" : stats.withEmail}
          icon={Mail}
          iconGradient="from-[var(--ms-info)] to-[#60A5FA]"
          loading={loading}
          delay={3}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="ms-alert ms-alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="ms-table-container">
        <div
          className="ms-table-header"
          style={{ gridTemplateColumns: "1.5fr 1.5fr 140px 120px 80px" }}
        >
          <div>Client</div>
          <div>Contact</div>
          <div>Téléphone</div>
          <div>Date ajout</div>
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
              icon={Users}
              title="Aucun client"
              description="Ajoutez votre premier client pour commencer."
              action={{
                label: "Ajouter un client",
                href: "/clients/nouveau",
              }}
            />
          ) : (
            rows.map((item, idx) => {
              const fullName = `${item.firstName} ${item.lastName}`.trim() || "Client";
              const initials = `${item.firstName?.[0] ?? ""}${item.lastName?.[0] ?? ""}`.toUpperCase() || "?";
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="ms-table-row ms-animate-slide-up"
                  style={{
                    gridTemplateColumns: "1.5fr 1.5fr 140px 120px 80px",
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
                      <span className="text-sm font-semibold text-white">{initials}</span>
                    </div>
                    <div>
                      <Link
                        href={`/clients/${item.id}`}
                        className="font-semibold text-[var(--ms-text)] hover:text-[var(--ms-primary)] transition-colors"
                      >
                        {fullName}
                      </Link>
                      <div className="text-xs text-[var(--ms-text-muted)]">
                        ID: {item.id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)]">
                    <Mail size={14} className="text-[var(--ms-text-muted)]" />
                    <span className="truncate">{item.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)]">
                    <Phone size={14} className="text-[var(--ms-text-muted)]" />
                    <span>{item.phone || "—"}</span>
                  </div>
                  <div className="text-sm text-[var(--ms-text-muted)]">
                    {fmtDate(item.createdAt)}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/clients/${item.id}`}
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
            {rows.length} client{rows.length > 1 ? "s" : ""}
          </span>
          <span>Dernière mise à jour : maintenant</span>
        </div>
      )}
    </div>
  );
}

