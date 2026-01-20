"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Car,
  Fuel,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/dashboard/stat-card";

type ClientOption = { id: number; firstName: string; lastName: string };

type VehicleItem = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  year?: number | null;
  createdAt?: string;
  client: ClientOption;
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

const FUEL_LABELS: Record<string, string> = {
  Essence: "Essence",
  Diesel: "Diesel",
  E85: "E85",
  Hybride: "Hybride",
  Electrique: "Électrique",
};

export default function VehiculesPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VehicleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);

  async function load(search: string) {
    try {
      setLoading(true);
      setError(null);

      const url = new URL("/api/vehicules", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "100");
      if (search.trim()) url.searchParams.set("q", search.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          json?.error?.message || json?.error || `GET /api/vehicules ${res.status}`;
        throw new Error(message);
      }

      setItems(pickArray(json) as VehicleItem[]);
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
      "Supprimer ce véhicule ? Cette action est irréversible."
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/vehicules/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          json?.error?.message || json?.error || `DELETE /api/vehicules/${id} ${res.status}`;
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
    const fuels = rows.reduce((acc, r) => {
      if (r.fuel) acc[r.fuel] = (acc[r.fuel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topFuel = Object.entries(fuels).sort((a, b) => b[1] - a[1])[0];
    const thisMonth = rows.filter((r) => {
      if (!r.createdAt) return false;
      const d = new Date(r.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total, thisMonth, topFuel: topFuel?.[0] || "—" };
  }, [rows]);

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <PageHeader
        title="Véhicules"
        subtitle="Gérez le parc automobile de vos clients"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Véhicules" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Rechercher un véhicule..."
              className="w-64"
            />
            <Link href="/vehicules/nouveau" className="ms-btn ms-btn-primary">
              <Plus size={18} />
              Nouveau véhicule
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total véhicules"
          value={loading ? "—" : stats.total}
          icon={Car}
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
          label="Carburant principal"
          value={loading ? "—" : FUEL_LABELS[stats.topFuel] || stats.topFuel}
          icon={Fuel}
          iconGradient="from-[#F59E0B] to-[#EAB308]"
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
          style={{ gridTemplateColumns: "120px 1.5fr 1.2fr 100px 120px 80px" }}
        >
          <div>Immat</div>
          <div>Véhicule</div>
          <div>Propriétaire</div>
          <div>Carburant</div>
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
              icon={Car}
              title="Aucun véhicule"
              description="Ajoutez votre premier véhicule pour commencer."
              action={{
                label: "Ajouter un véhicule",
                href: "/vehicules/nouveau",
              }}
            />
          ) : (
            rows.map((item, idx) => {
              const plate = item.plate || "—";
              const brandModel = `${item.brand ?? ""} ${item.model ?? ""}`.trim() || "—";
              const clientName = item.client
                ? `${item.client.firstName} ${item.client.lastName}`
                : "—";
              const fuel = FUEL_LABELS[item.fuel ?? ""] || item.fuel || "—";
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="ms-table-row ms-animate-slide-up"
                  style={{
                    gridTemplateColumns: "120px 1.5fr 1.2fr 100px 120px 80px",
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  <Link
                    href={`/vehicules/${item.id}`}
                    className="font-semibold text-[var(--ms-text)] hover:text-[var(--ms-primary)] transition-colors font-mono"
                  >
                    {plate}
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ms-bg-subtle)]">
                      <Car size={18} className="text-[var(--ms-text-muted)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--ms-text)]">
                        {brandModel}
                      </div>
                      {item.year && (
                        <div className="text-xs text-[var(--ms-text-muted)]">
                          {item.year}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <User size={16} className="text-[var(--ms-text-muted)]" />
                    <span className="truncate">{clientName}</span>
                  </div>
                  <div>
                    <span className="ms-badge ms-badge-neutral">{fuel}</span>
                  </div>
                  <div className="text-sm text-[var(--ms-text-muted)]">
                    {fmtDate(item.createdAt)}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/vehicules/${item.id}`}
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
            {rows.length} véhicule{rows.length > 1 ? "s" : ""}
          </span>
          <span>Dernière mise à jour : maintenant</span>
        </div>
      )}
    </div>
  );
}
