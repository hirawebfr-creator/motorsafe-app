"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileText, FolderOpen, Search, TrendingUp } from "lucide-react";

type DocumentItem = {
  id: string;
  type: string;
  createdAt: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    client: { firstName: string; lastName: string };
  };
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

export default function DocumentsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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

      setItems(pickArray(json) as DocumentItem[]);
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

  const rows = useMemo(() => items ?? [], [items]);

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Documents</h1>
          <p className="ms-page-subtitle">
            Téléchargez vos dossiers PDF générés depuis les interventions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="ms-search">
            <Search size={18} className="ms-search-icon" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un document..."
              className="ms-search-input"
            />
          </div>
          <Link href="/interventions" className="ms-btn ms-btn-secondary">
            <FileText size={18} />
            Voir interventions
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Total documents</div>
              <div className="ms-stat-value">{loading ? "—" : rows.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
              <FolderOpen size={24} className="text-[var(--ms-primary)]" />
            </div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">PDFs générés</div>
              <div className="ms-stat-value">{loading ? "—" : rows.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
              <FileText size={24} className="text-[var(--ms-success)]" />
            </div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Téléchargements</div>
              <div className="ms-stat-value">—</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]">
              <TrendingUp size={24} className="text-[#B45309]" />
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
          style={{ gridTemplateColumns: "1.2fr 1.5fr 1.2fr 100px 120px 100px" }}
        >
          <div>Immatriculation</div>
          <div>Véhicule</div>
          <div>Client</div>
          <div>Type</div>
          <div>Date</div>
          <div className="text-right">PDF</div>
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
                <FolderOpen size={28} />
              </div>
              <div className="ms-empty-title">Aucun document</div>
              <div className="ms-empty-text">
                Les PDFs seront disponibles ici après création d'interventions.
              </div>
            </div>
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
                      style={{ background: typeConfig.bg, color: typeConfig.text }}
                    >
                      {typeConfig.label}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--ms-text-muted)]">
                    {fmtDate(item.createdAt)}
                  </div>
                  <div className="flex justify-end">
                    <a
                      href={`/api/interventions/${item.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="ms-btn ms-btn-sm ms-btn-primary"
                    >
                      <Download size={14} />
                      PDF
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      {!loading && rows.length > 0 && (
        <div className="mt-4 text-sm text-[var(--ms-text-muted)]">
          {rows.length} document{rows.length > 1 ? "s" : ""} disponible
          {rows.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
