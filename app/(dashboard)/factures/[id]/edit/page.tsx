"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/shared/use-toast";

type InvoiceLine = {
  description: string;
  qty: number;
  unitPriceExcl: number;
  vatRate: number;
};

type InvoiceDetail = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  vatMode: string;
  lines: InvoiceLine[];
  client: { id: number; firstName: string; lastName: string };
  vehicle: { id: string; brand: string; model: string; plate: string } | null;
};

function fmtEur(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export default function EditFacturePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/invoices/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Facture introuvable");
      setInvoice(json.data);
      setLines(json.data.lines || [{ description: "", qty: 1, unitPriceExcl: 0, vatRate: 0.2 }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadInvoice(); }, [loadInvoice]);

  const handleLineChange = (index: number, field: keyof InvoiceLine, value: string | number) => {
    setLines(prev => prev.map((line, i) => i === index ? { ...line, [field]: value } : line));
  };

  const addLine = () => {
    setLines(prev => [...prev, { description: "", qty: 1, unitPriceExcl: 0, vatRate: 0.2 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotalExcl = 0;
    let totalVat = 0;
    lines.forEach(line => {
      const lineExcl = line.qty * line.unitPriceExcl;
      const lineVat = lineExcl * line.vatRate;
      subtotalExcl += lineExcl;
      totalVat += lineVat;
    });
    return { subtotalExcl, totalVat, totalIncl: subtotalExcl + totalVat };
  };

  const handleSave = async () => {
    if (lines.some(l => !l.description.trim())) {
      setError("Toutes les lignes doivent avoir une description");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur sauvegarde");
      toast.success("Facture mise a jour");
      router.push(`/factures/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    fontSize: "14px",
    color: "#111827",
    background: "#F9FAFB",
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #E5E7EB", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
        <Link href="/factures" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Retour aux factures
        </Link>
        <div style={{ ...cardStyle, padding: "24px", background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  if (invoice.status !== "DRAFT") {
    return (
      <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
        <Link href={`/factures/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Retour a la facture
        </Link>
        <div style={{ ...cardStyle, padding: "24px", background: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }}>
          Cette facture ne peut plus etre modifiee car elle a deja ete emise.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Back Link */}
      <Link href={`/factures/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}>
        <ArrowLeft size={16} /> Retour a la facture
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>Modifier la facture</h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
            {invoice.client.firstName} {invoice.client.lastName}
            {invoice.vehicle && ` • ${invoice.vehicle.brand} ${invoice.vehicle.model}`}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Lines */}
      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Lignes de la facture</h3>
          <button
            onClick={addLine}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", borderRadius: "10px",
              border: "none", background: "#EEF2FF",
              fontSize: "13px", fontWeight: "500", color: "#4F46E5",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Ajouter une ligne
          </button>
        </div>
        <div style={{ padding: "16px 24px" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 120px 80px 100px 40px", gap: "12px", marginBottom: "12px", fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase" }}>
            <span>Description</span>
            <span>Qte</span>
            <span>Prix HT</span>
            <span>TVA</span>
            <span>Total</span>
            <span></span>
          </div>
          {/* Lines */}
          {lines.map((line, idx) => {
            const lineTotal = line.qty * line.unitPriceExcl * (1 + line.vatRate);
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 80px 120px 80px 100px 40px", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
                <input
                  type="text"
                  value={line.description}
                  onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                  placeholder="Description..."
                  style={inputStyle}
                />
                <input
                  type="number"
                  min="1"
                  value={line.qty}
                  onChange={(e) => handleLineChange(idx, "qty", parseInt(e.target.value) || 1)}
                  style={{ ...inputStyle, textAlign: "center" }}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitPriceExcl}
                  onChange={(e) => handleLineChange(idx, "unitPriceExcl", parseFloat(e.target.value) || 0)}
                  style={{ ...inputStyle, textAlign: "right" }}
                />
                <select
                  value={line.vatRate}
                  onChange={(e) => handleLineChange(idx, "vatRate", parseFloat(e.target.value))}
                  style={{ ...inputStyle, padding: "10px 8px" }}
                >
                  <option value={0}>0%</option>
                  <option value={0.055}>5.5%</option>
                  <option value={0.1}>10%</option>
                  <option value={0.2}>20%</option>
                </select>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827", textAlign: "right" }}>
                  {fmtEur(lineTotal)}
                </div>
                <button
                  onClick={() => removeLine(idx)}
                  disabled={lines.length <= 1}
                  style={{
                    width: "36px", height: "36px",
                    borderRadius: "8px", border: "none",
                    background: lines.length <= 1 ? "#F3F4F6" : "#FEE2E2",
                    color: lines.length <= 1 ? "#9CA3AF" : "#B91C1C",
                    cursor: lines.length <= 1 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "300px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                <span style={{ color: "#6B7280" }}>Sous-total HT</span>
                <span style={{ color: "#111827" }}>{fmtEur(totals.subtotalExcl)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "12px" }}>
                <span style={{ color: "#6B7280" }}>TVA</span>
                <span style={{ color: "#111827" }}>{fmtEur(totals.totalVat)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "700", paddingTop: "12px", borderTop: "1px solid #E5E7EB" }}>
                <span style={{ color: "#111827" }}>Total TTC</span>
                <span style={{ color: "#4F46E5" }}>{fmtEur(totals.totalIncl)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <Link href={`/factures/${id}`} style={{ textDecoration: "none" }}>
          <button style={{
            padding: "12px 24px", borderRadius: "12px",
            border: "1px solid #E5E7EB", background: "#fff",
            fontSize: "14px", fontWeight: "500", color: "#374151",
            cursor: "pointer",
          }}>
            Annuler
          </button>
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "12px 24px", borderRadius: "12px",
            border: "none", background: saving ? "#9CA3AF" : "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
            fontSize: "14px", fontWeight: "600", color: "#fff",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 14px rgba(79, 70, 229, 0.4)",
          }}
        >
          {saving ? (
            <>
              <div style={{ width: "18px", height: "18px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save size={18} />
              Sauvegarder
            </>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
