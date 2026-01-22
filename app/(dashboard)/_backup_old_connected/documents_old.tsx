"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  FileText,
  FolderOpen,
  Search,
  FileCheck,
  Receipt,
  CheckCircle,
  Clock,
  Send,
  XCircle,
} from "lucide-react";

// =========================================================
// Types
// =========================================================

type InterventionItem = {
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

type QuoteItem = {
  id: string;
  quoteNumber: string | null;
  status: string;
  totalIncl: number;
  createdAt: string;
  client: { firstName: string; lastName: string };
};

type InvoiceItem = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  totalIncl: number;
  createdAt: string;
  client: { firstName: string; lastName: string };
};

// =========================================================
// Helpers
// =========================================================

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

function fmtEur(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

const INTERVENTION_TYPE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  E85: { bg: "var(--ms-success-light)", text: "var(--ms-success)", label: "E85" },
  Reprog: { bg: "var(--ms-primary-light)", text: "var(--ms-primary)", label: "Reprog" },
  Diag: { bg: "var(--ms-warning-light)", text: "#B45309", label: "Diagnostic" },
  Autre: { bg: "var(--ms-bg-subtle)", text: "var(--ms-text-secondary)", label: "Autre" },
};

const QUOTE_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon", icon: Clock },
  SENT: { bg: "bg-blue-100", text: "text-blue-700", label: "Envoyé", icon: Send },
  ACCEPTED: { bg: "bg-green-100", text: "text-green-700", label: "Accepté", icon: CheckCircle },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Refusé", icon: XCircle },
  INVOICED: { bg: "bg-purple-100", text: "text-purple-700", label: "Facturé", icon: FileText },
};

const INVOICE_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon", icon: Clock },
  ISSUED: { bg: "bg-blue-100", text: "text-blue-700", label: "Émise", icon: Receipt },
  PAID: { bg: "bg-green-100", text: "text-green-700", label: "Payée", icon: CheckCircle },
  OVERDUE: { bg: "bg-red-100", text: "text-red-700", label: "En retard", icon: Clock },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", label: "Annulée", icon: XCircle },
};

type Tab = "interventions" | "devis" | "factures";

// =========================================================
// Component
// =========================================================

export default function DocumentsPage() {
  const [tab, setTab] = useState<Tab>("interventions");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    try {
      setLoading(true);
      setError(null);

      const [intRes, quotesRes, invoicesRes] = await Promise.all([
        fetch("/api/interventions?page=1&pageSize=50", { cache: "no-store" }),
        fetch("/api/quotes?page=1&pageSize=50", { cache: "no-store" }),
        fetch("/api/invoices?page=1&pageSize=50", { cache: "no-store" }),
      ]);

      const intJson = await intRes.json().catch(() => null);
      const quotesJson = await quotesRes.json().catch(() => null);
      const invoicesJson = await invoicesRes.json().catch(() => null);

      if (!intRes.ok) {
        console.warn("Interventions fetch failed:", intJson?.error?.message);
      } else {
        setInterventions(pickArray(intJson) as InterventionItem[]);
      }

      if (!quotesRes.ok) {
        console.warn("Quotes fetch failed:", quotesJson?.error?.message);
      } else {
        setQuotes(pickArray(quotesJson) as QuoteItem[]);
      }

      if (!invoicesRes.ok) {
        console.warn("Invoices fetch failed:", invoicesJson?.error?.message);
      } else {
        setInvoices(pickArray(invoicesJson) as InvoiceItem[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  // Filter by search
  const filteredInterventions = useMemo(() => {
    if (!q.trim()) return interventions;
    const search = q.toLowerCase();
    return interventions.filter(
      (item) =>
        item.vehicle?.plate?.toLowerCase().includes(search) ||
        item.vehicle?.brand?.toLowerCase().includes(search) ||
        item.vehicle?.client?.firstName?.toLowerCase().includes(search) ||
        item.vehicle?.client?.lastName?.toLowerCase().includes(search)
    );
  }, [interventions, q]);

  const filteredQuotes = useMemo(() => {
    if (!q.trim()) return quotes;
    const search = q.toLowerCase();
    return quotes.filter(
      (item) =>
        item.quoteNumber?.toLowerCase().includes(search) ||
        item.client?.firstName?.toLowerCase().includes(search) ||
        item.client?.lastName?.toLowerCase().includes(search)
    );
  }, [quotes, q]);

  const filteredInvoices = useMemo(() => {
    if (!q.trim()) return invoices;
    const search = q.toLowerCase();
    return invoices.filter(
      (item) =>
        item.invoiceNumber?.toLowerCase().includes(search) ||
        item.client?.firstName?.toLowerCase().includes(search) ||
        item.client?.lastName?.toLowerCase().includes(search)
    );
  }, [invoices, q]);

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Documents</h1>
          <p className="ms-page-subtitle">
            Centralisez vos interventions, devis et factures
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="ms-search">
            <Search size={18} className="ms-search-icon" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher..."
              className="ms-search-input"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/interventions" className="ms-stat-card hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Interventions</div>
              <div className="ms-stat-value">{loading ? "—" : interventions.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
              <FolderOpen size={24} className="text-[var(--ms-primary)]" />
            </div>
          </div>
        </Link>
        <Link href="/devis" className="ms-stat-card hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Devis</div>
              <div className="ms-stat-value">{loading ? "—" : quotes.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <FileCheck size={24} className="text-blue-600" />
            </div>
          </div>
        </Link>
        <Link href="/factures" className="ms-stat-card hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Factures</div>
              <div className="ms-stat-value">{loading ? "—" : invoices.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <Receipt size={24} className="text-green-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("interventions")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "interventions"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FolderOpen size={16} className="inline mr-1.5 -mt-0.5" />
          Interventions ({filteredInterventions.length})
        </button>
        <button
          onClick={() => setTab("devis")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "devis"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileCheck size={16} className="inline mr-1.5 -mt-0.5" />
          Devis ({filteredQuotes.length})
        </button>
        <button
          onClick={() => setTab("factures")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "factures"
              ? "border-b-2 border-green-500 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Receipt size={16} className="inline mr-1.5 -mt-0.5" />
          Factures ({filteredInvoices.length})
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="ms-alert ms-alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="ms-skeleton h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Interventions Tab */}
          {tab === "interventions" && (
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
              <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                {filteredInterventions.length === 0 ? (
                  <div className="ms-empty">
                    <div className="ms-empty-icon">
                      <FolderOpen size={28} />
                    </div>
                    <div className="ms-empty-title">Aucune intervention</div>
                  </div>
                ) : (
                  filteredInterventions.map((item, idx) => {
                    const plate = item.vehicle?.plate || "—";
                    const brandModel =
                      `${item.vehicle?.brand ?? ""} ${item.vehicle?.model ?? ""}`.trim() || "—";
                    const clientName = item.vehicle?.client
                      ? `${item.vehicle.client.firstName} ${item.vehicle.client.lastName}`
                      : "—";
                    const typeConfig =
                      INTERVENTION_TYPE_CONFIG[item.type] || INTERVENTION_TYPE_CONFIG.Autre;

                    return (
                      <div
                        key={item.id}
                        className="ms-table-row ms-animate-slide-up"
                        style={{
                          gridTemplateColumns: "1.2fr 1.5fr 1.2fr 100px 120px 100px",
                          animationDelay: `${idx * 20}ms`,
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
          )}

          {/* Devis Tab */}
          {tab === "devis" && (
            <div className="ms-table-container">
              <div
                className="ms-table-header"
                style={{ gridTemplateColumns: "1.2fr 1.5fr 100px 120px 120px 100px" }}
              >
                <div>N° Devis</div>
                <div>Client</div>
                <div>Statut</div>
                <div>Montant</div>
                <div>Date</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                {filteredQuotes.length === 0 ? (
                  <div className="ms-empty">
                    <div className="ms-empty-icon">
                      <FileCheck size={28} />
                    </div>
                    <div className="ms-empty-title">Aucun devis</div>
                    <Link href="/devis/nouveau" className="ms-btn ms-btn-primary mt-4">
                      Créer un devis
                    </Link>
                  </div>
                ) : (
                  filteredQuotes.map((item, idx) => {
                    const cfg = QUOTE_STATUS_CONFIG[item.status] || QUOTE_STATUS_CONFIG.DRAFT;
                    return (
                      <div
                        key={item.id}
                        className="ms-table-row ms-animate-slide-up"
                        style={{
                          gridTemplateColumns: "1.2fr 1.5fr 100px 120px 120px 100px",
                          animationDelay: `${idx * 20}ms`,
                        }}
                      >
                        <Link
                          href={`/devis/${item.id}`}
                          className="font-semibold text-[var(--ms-text)] hover:text-blue-600 transition-colors"
                        >
                          {item.quoteNumber || `#${item.id.slice(0, 8)}`}
                        </Link>
                        <div className="text-[var(--ms-text-secondary)] truncate">
                          {item.client?.firstName} {item.client?.lastName}
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="font-medium">{fmtEur(item.totalIncl)}</div>
                        <div className="text-sm text-[var(--ms-text-muted)]">
                          {fmtDate(item.createdAt)}
                        </div>
                        <div className="flex justify-end gap-1">
                          <a
                            href={`/api/quotes/${item.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="ms-btn ms-btn-sm ms-btn-secondary"
                          >
                            <Download size={14} />
                          </a>
                          <Link
                            href={`/devis/${item.id}`}
                            className="ms-btn ms-btn-sm ms-btn-primary"
                          >
                            Voir
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Factures Tab */}
          {tab === "factures" && (
            <div className="ms-table-container">
              <div
                className="ms-table-header"
                style={{ gridTemplateColumns: "1.2fr 1.5fr 100px 120px 120px 100px" }}
              >
                <div>N° Facture</div>
                <div>Client</div>
                <div>Statut</div>
                <div>Montant</div>
                <div>Date</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                {filteredInvoices.length === 0 ? (
                  <div className="ms-empty">
                    <div className="ms-empty-icon">
                      <Receipt size={28} />
                    </div>
                    <div className="ms-empty-title">Aucune facture</div>
                    <p className="text-sm text-muted2 mt-2">
                      Les factures sont créées à partir de devis acceptés
                    </p>
                  </div>
                ) : (
                  filteredInvoices.map((item, idx) => {
                    const cfg = INVOICE_STATUS_CONFIG[item.status] || INVOICE_STATUS_CONFIG.DRAFT;
                    return (
                      <div
                        key={item.id}
                        className="ms-table-row ms-animate-slide-up"
                        style={{
                          gridTemplateColumns: "1.2fr 1.5fr 100px 120px 120px 100px",
                          animationDelay: `${idx * 20}ms`,
                        }}
                      >
                        <Link
                          href={`/factures/${item.id}`}
                          className="font-semibold text-[var(--ms-text)] hover:text-green-600 transition-colors"
                        >
                          {item.invoiceNumber || `#${item.id.slice(0, 8)}`}
                        </Link>
                        <div className="text-[var(--ms-text-secondary)] truncate">
                          {item.client?.firstName} {item.client?.lastName}
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="font-medium">{fmtEur(item.totalIncl)}</div>
                        <div className="text-sm text-[var(--ms-text-muted)]">
                          {fmtDate(item.createdAt)}
                        </div>
                        <div className="flex justify-end gap-1">
                          <a
                            href={`/api/invoices/${item.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="ms-btn ms-btn-sm ms-btn-secondary"
                          >
                            <Download size={14} />
                          </a>
                          <Link
                            href={`/factures/${item.id}`}
                            className="ms-btn ms-btn-sm ms-btn-primary"
                          >
                            Voir
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
