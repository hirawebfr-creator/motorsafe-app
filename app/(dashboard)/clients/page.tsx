"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

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
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Clients</h1>
          <p className="ms-page-subtitle">
            Gérez votre base de clients et leurs informations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="ms-search">
            <Search size={18} className="ms-search-icon" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un client..."
              className="ms-search-input"
            />
          </div>
          <Link href="/clients/nouveau" className="ms-btn ms-btn-primary">
            <Plus size={18} />
            Nouveau client
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Total clients</div>
              <div className="ms-stat-value">{loading ? "—" : stats.total}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
              <Users size={24} className="text-[var(--ms-primary)]" />
            </div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Ce mois-ci</div>
              <div className="ms-stat-value">{loading ? "—" : stats.thisMonth}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
              <TrendingUp size={24} className="text-[var(--ms-success)]" />
            </div>
          </div>
          {!loading && stats.thisMonth > 0 && (
            <div className="ms-stat-trend ms-stat-trend-up">
              <TrendingUp size={14} />
              +{stats.thisMonth} ce mois
            </div>
          )}
        </div>
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Avec email</div>
              <div className="ms-stat-value">{loading ? "—" : stats.withEmail}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-info-light)]">
              <Mail size={24} className="text-[var(--ms-info)]" />
            </div>
          </div>
        </div>
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
            <div className="ms-empty">
              <div className="ms-empty-icon">
                <Users size={28} />
              </div>
              <div className="ms-empty-title">Aucun client</div>
              <div className="ms-empty-text">
                Ajoutez votre premier client pour commencer.
              </div>
              <Link href="/clients/nouveau" className="ms-btn ms-btn-primary mt-4">
                <Plus size={18} />
                Ajouter un client
              </Link>
            </div>
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

