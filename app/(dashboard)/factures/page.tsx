"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Plus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  FileDown,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/components/shared/use-toast";

type InvoiceItem = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  totalIncl: number;
  createdAt: string;
  issuedAt: string | null;
  paidAt: string | null;
  dueAt: string | null;
  client: {
    id: number;
    firstName: string;
    lastName: string;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    plate: string;
  } | null;
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
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function fmtEur(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string; icon: typeof Clock }> = {
  DRAFT: { bg: "#F3F4F6", text: "#4B5563", border: "#9CA3AF", label: "Brouillon", icon: Clock },
  ISSUED: { bg: "#DBEAFE", text: "#1D4ED8", border: "#60A5FA", label: "Emise", icon: Receipt },
  PARTIALLY_PAID: { bg: "#FEF3C7", text: "#D97706", border: "#FBBF24", label: "Partielle", icon: CreditCard },
  PAID: { bg: "#D1FAE5", text: "#047857", border: "#34D399", label: "Payee", icon: CheckCircle },
  OVERDUE: { bg: "#FEE2E2", text: "#B91C1C", border: "#F87171", label: "En retard", icon: AlertCircle },
  CANCELLED: { bg: "#F3F4F6", text: "#6B7280", border: "#9CA3AF", label: "Annulee", icon: XCircle },
};

export default function FacturesPage() {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<number | null>(null);

  const load = useCallback(async (search: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/invoices", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "50");
      if (search.trim()) url.searchParams.set("q", search.trim());
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || `Erreur ${res.status}`);
      const data = unwrapOk(json);
      if (isRecord(data) && typeof data.total === "number") setTotal(data.total);
      setItems(pickArray(json) as InvoiceItem[]);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(""); }, [load]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void load(q), 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [q, load]);

  const handleDownloadPdf = useCallback(async (id: string, invoiceNumber: string | null) => {
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`);
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message || "Erreur PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoiceNumber || id.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF telecharge");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF");
    }
  }, [toast]);

  const stats = useMemo(() => {
    const issued = items.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE").length;
    const paid = items.filter((i) => i.status === "PAID").length;
    const paidAmount = items
      .filter((i) => i.status === "PAID")
      .reduce((acc, i) => acc + (i.totalIncl || 0), 0);
    return { issued, paid, paidAmount };
  }, [items]);

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>Factures</h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Gerez vos factures clients</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => void load(q)}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "12px",
              border: "1px solid #E5E7EB", background: "#fff",
              fontSize: "14px", fontWeight: "500", color: "#374151",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <Link href="/factures/nouveau" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "12px",
              border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              fontSize: "14px", fontWeight: "600", color: "#fff",
              cursor: "pointer", boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
            }}>
              <Plus size={18} />
              Nouvelle facture
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "500", color: "#6B7280", margin: 0 }}>Total factures</p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: "4px 0 0" }}>{total}</p>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)" }}>
              <Receipt size={24} color="#fff" />
            </div>
          </div>
        </div>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "500", color: "#6B7280", margin: 0 }}>En attente</p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: "4px 0 0" }}>{stats.issued}</p>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>
              <Clock size={24} color="#fff" />
            </div>
          </div>
        </div>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "500", color: "#6B7280", margin: 0 }}>Payees</p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: "4px 0 0" }}>{stats.paid}</p>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}>
              <CheckCircle size={24} color="#fff" />
            </div>
          </div>
        </div>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "500", color: "#6B7280", margin: 0 }}>CA encaisse</p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "4px 0 0" }}>{fmtEur(stats.paidAmount)}</p>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}>
              <TrendingUp size={24} color="#fff" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "16px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ position: "relative" }}>
          <Search size={20} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par numero, client, vehicule..."
            style={{
              width: "100%", padding: "14px 16px 14px 48px",
              borderRadius: "12px", border: "1px solid #E5E7EB",
              fontSize: "14px", color: "#111827", background: "#F9FAFB",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", marginBottom: "24px" }}>
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#E5E7EB", animation: "pulse 1.5s infinite" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "30%", height: "16px", borderRadius: "4px", background: "#E5E7EB", marginBottom: "8px" }} />
                  <div style={{ width: "20%", height: "12px", borderRadius: "4px", background: "#E5E7EB" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "64px 24px", borderRadius: "20px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto", borderRadius: "50%", background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Receipt size={40} color="#6366F1" />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: "24px 0 8px" }}>Aucune facture</h3>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Creez votre premiere facture pour commencer</p>
          <Link href="/factures/nouveau" style={{ textDecoration: "none" }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "12px", marginTop: "24px",
              border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              fontSize: "14px", fontWeight: "600", color: "#fff", cursor: "pointer",
            }}>
              <Plus size={18} />
              Nouvelle facture
            </button>
          </Link>
        </div>
      )}

      {/* List */}
      {!loading && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/factures/${item.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "20px", borderRadius: "16px",
                  background: "#fff", border: "1px solid #E5E7EB",
                  cursor: "pointer", transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#A5B4FC"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: cfg.bg }}>
                  <Icon size={24} style={{ color: cfg.text }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                      {item.invoiceNumber || `Brouillon #${item.id.slice(0, 8)}`}
                    </span>
                    <span style={{ padding: "5px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600", background: cfg.bg, color: cfg.text, border: `2px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", fontSize: "13px", color: "#6B7280" }}>
                    <span style={{ fontWeight: "500", color: "#374151" }}>{item.client.firstName} {item.client.lastName}</span>
                    {item.vehicle && (
                      <>
                        <span>•</span>
                        <span>{item.vehicle.brand} {item.vehicle.model}</span>
                        <span style={{ fontFamily: "monospace", fontSize: "11px", background: "#F3F4F6", padding: "2px 6px", borderRadius: "4px" }}>{item.vehicle.plate}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }} className="hidden sm:block">
                  <p style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>{fmtEur(item.totalIncl)}</p>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0" }}>
                    {item.paidAt ? `Payee ${fmtDate(item.paidAt)}` : fmtDate(item.createdAt)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => void handleDownloadPdf(item.id, item.invoiceNumber)}
                    style={{ width: "36px", height: "36px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                  >
                    <FileDown size={18} />
                  </button>
                  <ChevronRight size={20} style={{ marginLeft: "8px", color: "#D1D5DB" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .hidden { display: none; }
        @media (min-width: 640px) { .sm\\:block { display: block !important; } }
      `}</style>
    </div>
  );
}
