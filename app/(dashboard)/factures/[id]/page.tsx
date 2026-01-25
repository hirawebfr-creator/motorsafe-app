"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  CheckCircle,
  User,
  Car,
  FileDown,
  RefreshCw,
  CreditCard,
  Clock,
  Send,
  Mail,
  Copy,
  ExternalLink,
  AlertCircle,
  Check,
  XCircle,
  Trash2,
  Edit3,
} from "lucide-react";
import { useToast } from "@/components/shared/use-toast";

type InvoiceLine = {
  description: string;
  qty: number;
  unitPriceExcl: number;
  vatRate: number;
  totalExcl: number;
  totalVat: number;
  totalIncl: number;
};

type InvoiceDetail = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  vatMode: string;
  subtotalExcl: number;
  totalVat: number;
  totalIncl: number;
  amountPaid: number;
  createdAt: string;
  issuedAt: string | null;
  paidAt: string | null;
  dueAt: string | null;
  quoteId: string | null;
  paymentLinkUrl: string | null;
  paymentLinkExpiresAt: string | null;
  lines: InvoiceLine[];
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    paymentType: string | null;
    paidAt: string;
  }>;
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string; icon: typeof Clock }> = {
  DRAFT: { bg: "#F3F4F6", text: "#4B5563", border: "#9CA3AF", label: "Brouillon", icon: Clock },
  ISSUED: { bg: "#DBEAFE", text: "#1D4ED8", border: "#60A5FA", label: "Emise", icon: Receipt },
  PARTIALLY_PAID: { bg: "#FEF3C7", text: "#D97706", border: "#FBBF24", label: "Partiellement payee", icon: CreditCard },
  PAID: { bg: "#D1FAE5", text: "#047857", border: "#34D399", label: "Payee", icon: CheckCircle },
  OVERDUE: { bg: "#FEE2E2", text: "#B91C1C", border: "#F87171", label: "En retard", icon: AlertCircle },
  CANCELLED: { bg: "#F3F4F6", text: "#6B7280", border: "#9CA3AF", label: "Annulee", icon: XCircle },
};

export default function FactureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<"FULL" | "DEPOSIT">("FULL");
  const [depositAmount, setDepositAmount] = useState("");
  const [generatedPayUrl, setGeneratedPayUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setSuccess("Paiement effectue avec succes !");
      window.history.replaceState({}, "", `/factures/${id}`);
    } else if (payment === "cancelled") {
      setError("Paiement annule");
      window.history.replaceState({}, "", `/factures/${id}`);
    }
  }, [searchParams, id]);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/invoices/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Facture introuvable");
      }
      setInvoice(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadInvoice(); }, [loadInvoice]);

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action);
      setError(null);
      setSuccess(null);
      const res = await fetch(`/api/invoices/${id}/${action}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || `Erreur ${action}`);
      }
      if (action === "mark-paid") setSuccess("Facture marquee comme payee");
      if (action === "issue") setSuccess("Facture emise avec succes");
      if (action === "send") setSuccess("Facture envoyee par email");
      await loadInvoice();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setActionLoading("pdf");
      const res = await fetch(`/api/invoices/${id}/pdf`);
      if (!res.ok) throw new Error("Erreur generation PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoice?.invoiceNumber || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF telecharge");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur PDF");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePaymentLink = async () => {
    try {
      setActionLoading("payment-link");
      setError(null);
      const amountCents = paymentType === "DEPOSIT" && depositAmount 
        ? Math.round(parseFloat(depositAmount) * 100) 
        : undefined;
      const res = await fetch(`/api/invoices/${id}/payments/create-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: paymentType, amountCents }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur creation lien");
      setGeneratedPayUrl(json.data.payUrl);
      await loadInvoice();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendPaymentLink = async () => {
    try {
      setActionLoading("send-payment");
      setError(null);
      const payUrl = generatedPayUrl || invoice?.paymentLinkUrl;
      const res = await fetch(`/api/invoices/${id}/payments/send-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur envoi email");
      setSuccess("Lien de paiement envoye par email !");
      setShowPaymentModal(false);
      setGeneratedPayUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLink = async () => {
    const url = generatedPayUrl || invoice?.paymentLinkUrl;
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copie !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette facture ?")) return;
    try {
      setActionLoading("delete");
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur suppression");
      toast.success("Facture supprimee");
      router.push("/factures");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  // Styles
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const buttonBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
  };

  const primaryBtn: React.CSSProperties = {
    ...buttonBase,
    background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
  };

  const secondaryBtn: React.CSSProperties = {
    ...buttonBase,
    background: "#fff",
    color: "#374151",
    border: "1px solid #E5E7EB",
  };

  const dangerBtn: React.CSSProperties = {
    ...buttonBase,
    background: "#FEE2E2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
  };

  const successBtn: React.CSSProperties = {
    ...buttonBase,
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
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
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
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

  const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = cfg.icon;
  const remainingAmount = invoice.totalIncl - invoice.amountPaid;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Back Link */}
      <Link href="/factures" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}>
        <ArrowLeft size={16} /> Retour aux factures
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>
              {invoice.invoiceNumber || `Brouillon #${invoice.id.slice(0, 8)}`}
            </h1>
            <span style={{ padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: "600", background: cfg.bg, color: cfg.text, border: `2px solid ${cfg.border}` }}>
              {cfg.label}
            </span>
          </div>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Creee le {fmtDate(invoice.createdAt)}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button onClick={() => void loadInvoice()} disabled={!!actionLoading} style={{ ...secondaryBtn, padding: "10px", opacity: actionLoading ? 0.5 : 1 }}>
            <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <button onClick={handleDownloadPdf} disabled={!!actionLoading} style={secondaryBtn}>
            <FileDown size={18} /> PDF
          </button>
          {invoice.status === "DRAFT" && (
            <>
              <button onClick={() => router.push(`/factures/${id}/edit`)} style={secondaryBtn}>
                <Edit3 size={18} /> Modifier
              </button>
              <button onClick={() => void handleAction("issue")} disabled={!!actionLoading} style={primaryBtn}>
                <Send size={18} /> Emettre
              </button>
              <button onClick={handleDelete} disabled={!!actionLoading} style={dangerBtn}>
                <Trash2 size={18} />
              </button>
            </>
          )}
          {(invoice.status === "ISSUED" || invoice.status === "OVERDUE" || invoice.status === "PARTIALLY_PAID") && (
            <>
              <button onClick={() => void handleAction("send")} disabled={!!actionLoading} style={secondaryBtn}>
                <Mail size={18} /> Envoyer
              </button>
              <button onClick={() => setShowPaymentModal(true)} disabled={!!actionLoading} style={secondaryBtn}>
                <CreditCard size={18} /> Paiement en ligne
              </button>
              <button onClick={() => void handleAction("mark-paid")} disabled={!!actionLoading} style={successBtn}>
                <CheckCircle size={18} /> Marquer payee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ ...cardStyle, padding: "16px", background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div style={{ ...cardStyle, padding: "16px", background: "#D1FAE5", borderColor: "#34D399", color: "#047857", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Check size={18} /> {success}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          
          {/* Status Card */}
          <div style={{ ...cardStyle, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StatusIcon size={28} style={{ color: cfg.text }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Statut actuel</p>
                <p style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: "4px 0 0" }}>{cfg.label}</p>
                {invoice.issuedAt && <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0 0" }}>Emise le {fmtDate(invoice.issuedAt)}</p>}
                {invoice.paidAt && <p style={{ fontSize: "12px", color: "#047857", margin: "4px 0 0" }}>Payee le {fmtDate(invoice.paidAt)}</p>}
                {invoice.dueAt && !invoice.paidAt && <p style={{ fontSize: "12px", color: invoice.status === "OVERDUE" ? "#B91C1C" : "#6B7280", margin: "4px 0 0" }}>Echeance: {fmtDate(invoice.dueAt)}</p>}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>{fmtEur(invoice.totalIncl)}</p>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0" }}>TTC</p>
              </div>
            </div>
          </div>

          {/* Client Card */}
          <div style={{ ...cardStyle, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={20} color="#fff" />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Client</h3>
            </div>
            <p style={{ fontSize: "15px", fontWeight: "600", color: "#111827", margin: 0 }}>{invoice.client.firstName} {invoice.client.lastName}</p>
            {invoice.client.email && <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>{invoice.client.email}</p>}
            {invoice.client.phone && <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>{invoice.client.phone}</p>}
            <Link href={`/clients/${invoice.client.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6366F1", textDecoration: "none", marginTop: "12px" }}>
              Voir le client <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
            </Link>
          </div>

          {/* Vehicle Card */}
          {invoice.vehicle && (
            <div style={{ ...cardStyle, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Car size={20} color="#fff" />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Vehicule</h3>
              </div>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "#111827", margin: 0 }}>{invoice.vehicle.brand} {invoice.vehicle.model}</p>
              <p style={{ fontSize: "13px", fontFamily: "monospace", color: "#6B7280", background: "#F3F4F6", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginTop: "8px" }}>{invoice.vehicle.plate}</p>
              <Link href={`/vehicules/${invoice.vehicle.id}`} style={{ display: "block", fontSize: "13px", color: "#6366F1", textDecoration: "none", marginTop: "12px" }}>
                Voir le vehicule →
              </Link>
            </div>
          )}

          {/* Payment Card */}
          <div style={{ ...cardStyle, padding: "24px", ...(invoice.status === "PAID" ? { background: "#F0FDF4", borderColor: "#86EFAC" } : {}) }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: invoice.status === "PAID" ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={20} color="#fff" />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Paiement</h3>
            </div>
            
            {invoice.status === "PAID" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#047857" }}>
                <CheckCircle size={20} />
                <span style={{ fontWeight: "600" }}>Payee le {fmtDate(invoice.paidAt)}</span>
              </div>
            ) : invoice.status === "PARTIALLY_PAID" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#D97706", marginBottom: "12px" }}>
                  <AlertCircle size={20} />
                  <span style={{ fontWeight: "600" }}>Partiellement payee</span>
                </div>
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                    <span style={{ color: "#6B7280" }}>Paye</span>
                    <span style={{ fontWeight: "600", color: "#10B981" }}>{fmtEur(invoice.amountPaid)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#6B7280" }}>Reste a payer</span>
                    <span style={{ fontWeight: "600", color: "#B91C1C" }}>{fmtEur(remainingAmount)}</span>
                  </div>
                  <div style={{ height: "6px", background: "#E5E7EB", borderRadius: "3px", marginTop: "12px", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: "3px", width: `${(invoice.amountPaid / invoice.totalIncl) * 100}%` }} />
                  </div>
                </div>
              </div>
            ) : invoice.status === "ISSUED" || invoice.status === "OVERDUE" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: invoice.status === "OVERDUE" ? "#B91C1C" : "#1D4ED8", marginBottom: "8px" }}>
                  <Clock size={20} />
                  <span style={{ fontWeight: "600" }}>{invoice.status === "OVERDUE" ? "En retard" : "En attente de paiement"}</span>
                </div>
                {invoice.dueAt && <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Echeance: {fmtDate(invoice.dueAt)}</p>}
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "#6B7280" }}>Facture non emise</p>
            )}

            {/* Payment Link */}
            {invoice.paymentLinkUrl && invoice.status !== "PAID" && (
              <div style={{ borderTop: "1px solid #E5E7EB", marginTop: "16px", paddingTop: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Lien de paiement</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F9FAFB", padding: "8px 12px", borderRadius: "8px" }}>
                  <ExternalLink size={14} style={{ color: "#6366F1" }} />
                  <a href={invoice.paymentLinkUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "13px", color: "#6366F1", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Ouvrir</a>
                  <button onClick={handleCopyLink} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                    {copied ? <Check size={16} style={{ color: "#10B981" }} /> : <Copy size={16} style={{ color: "#6B7280" }} />}
                  </button>
                </div>
                {invoice.paymentLinkExpiresAt && <p style={{ fontSize: "11px", color: "#6B7280", marginTop: "8px" }}>Expire le {fmtDate(invoice.paymentLinkExpiresAt)}</p>}
              </div>
            )}

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div style={{ borderTop: "1px solid #E5E7EB", marginTop: "16px", paddingTop: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Historique des paiements</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {invoice.payments.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#F9FAFB", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.status === "SUCCEEDED" ? "#10B981" : p.status === "PENDING" ? "#F59E0B" : "#EF4444" }} />
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>{p.paymentType === "DEPOSIT" ? "Acompte" : "Total"}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>{fmtEur(p.amount)}</span>
                        {p.paidAt && <span style={{ fontSize: "11px", color: "#6B7280", marginLeft: "8px" }}>{fmtDate(p.paidAt)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Linked Quote */}
          {invoice.quoteId && (
            <div style={{ ...cardStyle, padding: "24px", background: "#EEF2FF", borderColor: "#C7D2FE" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Receipt size={24} style={{ color: "#6366F1" }} />
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#4F46E5", margin: 0 }}>Devis lie</h3>
                  <Link href={`/devis/${invoice.quoteId}`} style={{ fontSize: "13px", color: "#6366F1", textDecoration: "none" }}>Voir le devis →</Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Lines */}
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Lignes de la facture</h3>
          </div>
          <div>
            {invoice.lines.map((line, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: idx < invoice.lines.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: "500", color: "#111827", margin: 0 }}>{line.description}</p>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>
                    {line.qty} x {fmtEur(line.unitPriceExcl)} HT
                    {line.vatRate > 0 && <span style={{ marginLeft: "8px" }}>• TVA {(line.vatRate * 100).toFixed(0)}%</span>}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "15px", fontWeight: "600", color: "#111827", margin: 0 }}>{fmtEur(line.totalIncl)}</p>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: "2px 0 0" }}>{fmtEur(line.totalExcl)} HT</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
              <span style={{ color: "#6B7280" }}>Sous-total HT</span>
              <span style={{ color: "#111827" }}>{fmtEur(invoice.subtotalExcl)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "12px" }}>
              <span style={{ color: "#6B7280" }}>TVA</span>
              <span style={{ color: "#111827" }}>{fmtEur(invoice.totalVat)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "700", paddingTop: "12px", borderTop: "1px solid #E5E7EB" }}>
              <span style={{ color: "#111827" }}>Total TTC</span>
              <span style={{ color: "#4F46E5" }}>{fmtEur(invoice.totalIncl)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ ...cardStyle, width: "100%", maxWidth: "480px", padding: "24px", margin: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "20px" }}>Creer un lien de paiement</h3>
            
            {!generatedPayUrl ? (
              <div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "12px" }}>Type de paiement</label>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input type="radio" name="paymentType" value="FULL" checked={paymentType === "FULL"} onChange={(e) => setPaymentType(e.target.value as "FULL" | "DEPOSIT")} style={{ width: "16px", height: "16px", accentColor: "#6366F1" }} />
                      <span style={{ fontSize: "14px", color: "#374151" }}>Montant total</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input type="radio" name="paymentType" value="DEPOSIT" checked={paymentType === "DEPOSIT"} onChange={(e) => setPaymentType(e.target.value as "FULL" | "DEPOSIT")} style={{ width: "16px", height: "16px", accentColor: "#6366F1" }} />
                      <span style={{ fontSize: "14px", color: "#374151" }}>Acompte</span>
                    </label>
                  </div>
                </div>

                {paymentType === "FULL" ? (
                  <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px" }}>Montant a payer</p>
                    <p style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>{fmtEur(remainingAmount)}</p>
                    {invoice.amountPaid > 0 && (
                      <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "8px" }}>
                        Total {fmtEur(invoice.totalIncl)} - deja paye {fmtEur(invoice.amountPaid)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>Montant de l&apos;acompte (EUR)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Ex: 150.00"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    />
                    <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "8px" }}>Maximum: {fmtEur(remainingAmount)}</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => { setShowPaymentModal(false); setPaymentType("FULL"); setDepositAmount(""); }} style={{ ...secondaryBtn, flex: 1, justifyContent: "center" }}>
                    Annuler
                  </button>
                  <button onClick={handleCreatePaymentLink} disabled={actionLoading === "payment-link" || (paymentType === "DEPOSIT" && !depositAmount)} style={{ ...primaryBtn, flex: 1, justifyContent: "center", opacity: (actionLoading === "payment-link" || (paymentType === "DEPOSIT" && !depositAmount)) ? 0.5 : 1 }}>
                    <ExternalLink size={18} /> Generer le lien
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: "#D1FAE5", border: "1px solid #34D399", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#047857", marginBottom: "12px" }}>
                    <Check size={18} />
                    <span style={{ fontWeight: "600" }}>Lien cree avec succes !</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px" }}>
                    <input type="text" readOnly value={generatedPayUrl} style={{ flex: 1, fontSize: "13px", border: "none", outline: "none", background: "transparent", overflow: "hidden", textOverflow: "ellipsis" }} />
                    <button onClick={handleCopyLink} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                      {copied ? <Check size={16} style={{ color: "#10B981" }} /> : <Copy size={16} style={{ color: "#6B7280" }} />}
                    </button>
                  </div>
                  <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "8px" }}>Ce lien est valable 24 heures</p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => { setShowPaymentModal(false); setGeneratedPayUrl(null); setPaymentType("FULL"); setDepositAmount(""); }} style={{ ...secondaryBtn, flex: 1, justifyContent: "center" }}>
                    Fermer
                  </button>
                  <button onClick={handleSendPaymentLink} disabled={actionLoading === "send-payment"} style={{ ...primaryBtn, flex: 1, justifyContent: "center", opacity: actionLoading === "send-payment" ? 0.5 : 1 }}>
                    <Mail size={18} /> Envoyer par email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
