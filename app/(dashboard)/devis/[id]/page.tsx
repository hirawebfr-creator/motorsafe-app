"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Car,
  FileDown,
  RefreshCw,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  Pencil,
  Clock,
  Calendar,
  Euro,
  Hash,
  FileSignature,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/shared/use-toast";

type QuoteLine = {
  id?: string;
  description: string;
  qty: number;
  unitPriceExcl: number;
  vatRate: number;
  lineTotalExcl?: number;
  lineVatAmount?: number;
  lineTotalIncl?: number;
};

const DEFAULT_VAT_RATE = 0.2;

type QuoteDetail = {
  id: string;
  quoteNumber: string | null;
  status: string;
  vatMode: string;
  subtotalExcl: number;
  totalVat: number;
  totalIncl: number;
  createdAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  invoicedAt: string | null;
  invoiceId: string | null;
  lines: QuoteLine[];
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    plate: string;
  } | null;
};

function fmtDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function fmtEur(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

type StatusCfg = { gradient: string; label: string };
const STATUS_CONFIG: Record<string, StatusCfg> = {
  DRAFT: { gradient: "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)", label: "Brouillon" },
  SENT: { gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", label: "Envoyé" },
  ACCEPTED: { gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)", label: "Accepté" },
  REJECTED: { gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)", label: "Refusé" },
  INVOICED: { gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)", label: "Facturé" },
};

export default function DevisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editLines, setEditLines] = useState<QuoteLine[]>([]);
  const [saving, setSaving] = useState(false);

  // Signature modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureSending, setSignatureSending] = useState(false);

  const loadQuote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/quotes/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Devis introuvable");
      setQuote(json.data);
      setEditLines(json.data.lines.map((l: QuoteLine) => ({
        description: l.description, qty: l.qty, unitPriceExcl: l.unitPriceExcl, vatRate: l.vatRate,
      })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadQuote(); }, [loadQuote]);

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action);
      if (action === "convert") {
        const res = await fetch(`/api/quotes/${id}/convert`, { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur conversion");
        toast.success("Devis converti en facture");
        if (json.data?.id) { router.push(`/factures/${json.data.id}`); return; }
      }
      const res = await fetch(`/api/quotes/${id}/${action}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || `Erreur ${action}`);
      toast.success({ send: "Devis envoyé", accept: "Devis accepté", reject: "Devis refusé" }[action] || "OK");
      await loadQuote();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setActionLoading("pdf");
      const res = await fetch(`/api/quotes/${id}/pdf`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Erreur lors de la génération du PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devis-${quote?.quoteNumber || id}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF téléchargé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLineChange = (idx: number, field: keyof QuoteLine, value: string | number) => {
    setEditLines((prev) => {
      const u = [...prev];
      if (field === "description") u[idx] = { ...u[idx], description: String(value) };
      else if (field === "qty") u[idx] = { ...u[idx], qty: Number(value) || 1 };
      else if (field === "unitPriceExcl") u[idx] = { ...u[idx], unitPriceExcl: Number(value) || 0 };
      else if (field === "vatRate") u[idx] = { ...u[idx], vatRate: Number(value) || 0 };
      return u;
    });
  };
  const handleAddLine = () => setEditLines((p) => [...p, { description: "", qty: 1, unitPriceExcl: 0, vatRate: DEFAULT_VAT_RATE }]);
  const handleRemoveLine = (idx: number) => setEditLines((p) => p.filter((_, i) => i !== idx));

  const handleSaveLines = async () => {
    const valid = editLines.filter((l) => l.description.trim());
    if (!valid.length) { toast.error("Au moins une ligne requise"); return; }
    try {
      setSaving(true);
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: valid.map((l) => ({ description: l.description.trim(), qty: l.qty, unitPriceExcl: l.unitPriceExcl, vatRate: l.vatRate })) }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur");
      toast.success("Lignes enregistrées");
      setIsEditing(false);
      await loadQuote();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    if (quote) setEditLines(quote.lines.map((l) => ({ description: l.description, qty: l.qty, unitPriceExcl: l.unitPriceExcl, vatRate: l.vatRate })));
    setIsEditing(false);
  };

  const handleSendForSignature = async () => {
    try {
      setSignatureSending(true);
      const res = await fetch("/api/signatures/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: "QUOTE", documentId: id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (json.error?.code === "CLIENT_EMAIL_REQUIRED") {
          toast.error("L'email du client est requis pour envoyer une demande de signature.");
          return;
        }
        throw new Error(json.error?.message || "Erreur lors de l'envoi");
      }
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${baseUrl}/sign/${json.data.token}`;
      setSignatureUrl(url);
      setShowSignatureModal(true);
      toast.success("Demande de signature envoyée !");
      await loadQuote();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSignatureSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!signatureUrl) return;
    try {
      await navigator.clipboard.writeText(signatureUrl);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const previewTotals = editLines.reduce((a, l) => {
    const ex = l.qty * l.unitPriceExcl, vat = ex * l.vatRate;
    return { subtotalExcl: a.subtotalExcl + ex, totalVat: a.totalVat + vat, totalIncl: a.totalIncl + ex + vat };
  }, { subtotalExcl: 0, totalVat: 0, totalIncl: 0 });

  const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

  if (loading) return (
    <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", margin: "0 auto", borderRadius: "50%", border: "4px solid #E0E7FF", borderTopColor: "#4F46E5", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "16px", color: "#6B7280", fontSize: "14px" }}>Chargement...</p>
      </div>
      <style>{spinKeyframes}</style>
    </div>
  );

  if (error && !quote) return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Link href="/devis" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}>
        <ArrowLeft size={16} />Retour
      </Link>
      <div style={{ padding: "48px", borderRadius: "20px", background: "#FEF2F2", border: "1px solid #FECACA", textAlign: "center" }}>
        <XCircle size={48} style={{ margin: "0 auto", color: "#EF4444" }} />
        <p style={{ marginTop: "16px", color: "#DC2626", fontSize: "16px" }}>{error}</p>
      </div>
    </div>
  );

  if (!quote) return null;
  const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;
  const canEdit = quote.status === "DRAFT";

  const btnBase: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer" };
  const btnWhiteGlass: React.CSSProperties = { ...btnBase, background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" };
  const btnWhiteSolid: React.CSSProperties = { ...btnBase, background: "#fff", color: "#111827", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: "14px", outline: "none" };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <style>{spinKeyframes}</style>

      <Link href="/devis" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}>
        <ArrowLeft size={16} />Retour aux devis
      </Link>

      {/* Hero Header */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: "24px", background: cfg.gradient, padding: "32px", color: "#fff", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-40px", top: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", left: "-30px", bottom: "-30px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />

        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
                <FileText size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>{quote.quoteNumber || `Brouillon #${quote.id.slice(0, 8)}`}</h1>
                <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px", opacity: 0.9 }}>
                  <Clock size={16} />
                  <span style={{ fontWeight: 500 }}>{cfg.label}</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "20px", fontSize: "14px", opacity: 0.85 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={16} /><span>Créé le {fmtDate(quote.createdAt)}</span></div>
              {quote.sentAt && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Send size={16} /><span>Envoyé le {fmtDate(quote.sentAt)}</span></div>}
              {quote.acceptedAt && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} /><span>Accepté le {fmtDate(quote.acceptedAt)}</span></div>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "14px", opacity: 0.75, margin: 0 }}>Total TTC</p>
            <p style={{ fontSize: "36px", fontWeight: 700, margin: "4px 0 0" }}>{fmtEur(isEditing ? previewTotals.totalIncl : quote.totalIncl)}</p>
          </div>
        </div>

        <div style={{ position: "relative", marginTop: "28px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button onClick={() => void loadQuote()} disabled={!!actionLoading} style={{ ...btnWhiteGlass, opacity: actionLoading ? 0.6 : 1 }}>
            <RefreshCw size={16} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />Actualiser
          </button>
          <button onClick={handleDownloadPdf} disabled={!!actionLoading} style={{ ...btnWhiteGlass, opacity: actionLoading ? 0.6 : 1 }}>
            {actionLoading === "pdf" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <FileDown size={16} />}Télécharger PDF
          </button>
          {quote.status === "DRAFT" && (
            <button onClick={handleSendForSignature} disabled={!!actionLoading || signatureSending} style={{ ...btnWhiteSolid, opacity: (actionLoading || signatureSending) ? 0.6 : 1 }}>
              {signatureSending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <FileSignature size={16} />}Envoyer pour signature
            </button>
          )}
          {quote.status === "SENT" && (
            <>
              <button onClick={handleSendForSignature} disabled={!!actionLoading || signatureSending} style={{ ...btnWhiteGlass, opacity: (actionLoading || signatureSending) ? 0.6 : 1 }}>
                {signatureSending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <FileSignature size={16} />}Renvoyer lien
              </button>
              <button onClick={() => handleAction("accept")} disabled={!!actionLoading} style={{ ...btnWhiteSolid, color: "#059669", opacity: actionLoading ? 0.6 : 1 }}>
                {actionLoading === "accept" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={16} />}Accepter
              </button>
              <button onClick={() => handleAction("reject")} disabled={!!actionLoading} style={{ ...btnBase, background: "#EF4444", color: "#fff", opacity: actionLoading ? 0.6 : 1 }}>
                {actionLoading === "reject" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={16} />}Refuser
              </button>
            </>
          )}
          {quote.status === "ACCEPTED" && !quote.invoicedAt && (
            <button onClick={() => handleAction("convert")} disabled={!!actionLoading} style={{ ...btnWhiteSolid, color: "#7C3AED", opacity: actionLoading ? 0.6 : 1 }}>
              {actionLoading === "convert" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={16} />}Convertir en facture
            </button>
          )}
        </div>
      </div>

      {/* Signature Link Modal */}
      {showSignatureModal && signatureUrl && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowSignatureModal(false)}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", maxWidth: "500px", width: "90%", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={28} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>Demande envoyée !</h2>
                <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0" }}>Le client a reçu un email avec le lien</p>
              </div>
            </div>

            <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6B7280", marginBottom: "8px", textTransform: "uppercase" }}>Lien de signature</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="text" readOnly value={signatureUrl} style={{ flex: 1, padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "13px", color: "#374151" }} />
                <button onClick={handleCopyLink} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#fff", fontWeight: 500, cursor: "pointer" }}>
                  <Copy size={16} />Copier
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => window.open(signatureUrl, "_blank")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 500, cursor: "pointer" }}>
                <ExternalLink size={16} />Voir la page
              </button>
              <button onClick={() => setShowSignatureModal(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Lines Card */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Hash size={20} color="#4F46E5" />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Lignes du devis</h3>
            </div>
            {canEdit && !isEditing && (
              <button onClick={() => setIsEditing(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)", color: "#4F46E5", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                <Pencil size={16} />Modifier
              </button>
            )}
            {isEditing && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleCancelEdit} disabled={saving} style={{ padding: "10px 16px", borderRadius: "12px", border: "none", background: "#F3F4F6", color: "#374151", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>Annuler</button>
                <button onClick={handleSaveLines} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}Enregistrer
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div>
              {editLines.map((line, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 80px 100px 80px 50px", gap: "12px", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Description</label>
                    <input type="text" value={line.description} onChange={(e) => handleLineChange(idx, "description", e.target.value)} placeholder="Description..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Qté</label>
                    <input type="number" min="1" value={line.qty} onChange={(e) => handleLineChange(idx, "qty", e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Prix HT</label>
                    <input type="number" min="0" step="0.01" value={line.unitPriceExcl} onChange={(e) => handleLineChange(idx, "unitPriceExcl", e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>TVA</label>
                    <select value={line.vatRate} onChange={(e) => handleLineChange(idx, "vatRate", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="0">0%</option><option value="0.055">5.5%</option><option value="0.1">10%</option><option value="0.2">20%</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "2px" }}>
                    <button onClick={() => handleRemoveLine(idx)} disabled={editLines.length <= 1} style={{ width: "40px", height: "40px", borderRadius: "10px", border: "none", background: "transparent", color: editLines.length <= 1 ? "#D1D5DB" : "#EF4444", cursor: editLines.length <= 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ padding: "16px 24px" }}>
                <button onClick={handleAddLine} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "2px dashed #E5E7EB", background: "transparent", color: "#6B7280", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                  <Plus size={16} />Ajouter une ligne
                </button>
              </div>
            </div>
          ) : (
            <div>
              {quote.lines.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <FileText size={48} style={{ margin: "0 auto", color: "#D1D5DB" }} />
                  <p style={{ marginTop: "16px", color: "#6B7280" }}>Aucune ligne</p>
                  {canEdit && (
                    <button onClick={() => setIsEditing(true)} style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                      <Plus size={16} />Ajouter
                    </button>
                  )}
                </div>
              ) : quote.lines.map((line, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: idx < quote.lines.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "15px", fontWeight: 500, color: "#111827", margin: 0 }}>{line.description}</p>
                    <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                      {line.qty} × {fmtEur(line.unitPriceExcl)} HT
                      {line.vatRate > 0 && <span style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "999px", background: "#F3F4F6", fontSize: "12px", fontWeight: 500 }}>TVA {(line.vatRate * 100).toFixed(0)}%</span>}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "17px", fontWeight: 600, color: "#111827", margin: 0 }}>{fmtEur(line.lineTotalIncl || 0)}</p>
                    <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>{fmtEur(line.lineTotalExcl || 0)} HT</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid #E5E7EB", background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6B7280" }}>
              <span>Sous-total HT</span>
              <span style={{ fontWeight: 500 }}>{fmtEur(isEditing ? previewTotals.subtotalExcl : quote.subtotalExcl)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
              <span>TVA</span>
              <span style={{ fontWeight: 500 }}>{fmtEur(isEditing ? previewTotals.totalVat : quote.totalVat)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E5E7EB" }}>
              <span style={{ fontSize: "17px", fontWeight: 600, color: "#111827" }}>Total TTC</span>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>{fmtEur(isEditing ? previewTotals.totalIncl : quote.totalIncl)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #E5E7EB", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>
                <User size={24} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Client</p>
                <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>{quote.client.firstName} {quote.client.lastName}</p>
              </div>
            </div>
            <div style={{ marginTop: "16px", fontSize: "14px", color: "#6B7280" }}>
              {quote.client.email && <p style={{ margin: "4px 0" }}>{quote.client.email}</p>}
              {quote.client.phone && <p style={{ margin: "4px 0" }}>{quote.client.phone}</p>}
            </div>
            <Link href={`/clients/${quote.client.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "16px", fontSize: "14px", fontWeight: 500, color: "#4F46E5", textDecoration: "none" }}>
              Voir le client <ArrowRight size={14} />
            </Link>
          </div>

          {quote.vehicle && (
            <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #E5E7EB", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}>
                  <Car size={24} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Véhicule</p>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>{quote.vehicle.brand} {quote.vehicle.model}</p>
                </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: "10px", background: "#F3F4F6", fontFamily: "monospace", fontSize: "14px", fontWeight: 500, color: "#374151" }}>{quote.vehicle.plate}</span>
              </div>
              <Link href={`/vehicules/${quote.vehicle.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "16px", fontSize: "14px", fontWeight: 500, color: "#4F46E5", textDecoration: "none" }}>
                Voir le véhicule <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {quote.invoiceId && (
            <div style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)", borderRadius: "20px", border: "1px solid #DDD6FE", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)" }}>
                  <Euro size={24} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#7C3AED", margin: 0 }}>Facture générée</p>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "#5B21B6", margin: 0 }}>Ce devis a été converti</p>
                </div>
              </div>
              <Link href={`/factures/${quote.invoiceId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "16px", fontSize: "14px", fontWeight: 500, color: "#7C3AED", textDecoration: "none" }}>
                Voir la facture <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
