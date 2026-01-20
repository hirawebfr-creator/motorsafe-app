"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  CheckCircle,
  Loader2,
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
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";

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
  // PAYMENTS-01
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
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function fmtEur(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon" },
  ISSUED: { bg: "bg-blue-100", text: "text-blue-700", label: "Émise" },
  PARTIALLY_PAID: { bg: "bg-amber-100", text: "text-amber-700", label: "Partiellement payée" },
  PAID: { bg: "bg-green-100", text: "text-green-700", label: "Payée" },
  OVERDUE: { bg: "bg-red-100", text: "text-red-700", label: "En retard" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", label: "Annulée" },
};

export default function FactureDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // PAYMENTS-01: Payment link states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<"FULL" | "DEPOSIT">("FULL");
  const [depositAmount, setDepositAmount] = useState("");
  const [generatedPayUrl, setGeneratedPayUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check for payment success/cancelled from URL
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setSuccess("Paiement effectué avec succès !");
      // Clear URL params
      window.history.replaceState({}, "", `/factures/${id}`);
    } else if (payment === "cancelled") {
      setError("Paiement annulé");
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

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

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
      if (!res.ok) throw new Error("Erreur génération PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoice?.invoiceNumber || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur PDF");
    } finally {
      setActionLoading(null);
    }
  };

  // PAYMENTS-01: Create payment link
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
      
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur création lien");
      }
      
      setGeneratedPayUrl(json.data.payUrl);
      await loadInvoice();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  // PAYMENTS-01: Send payment link via email
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
      
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur envoi email");
      }
      
      setSuccess("Lien de paiement envoyé par email !");
      setShowPaymentModal(false);
      setGeneratedPayUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  // Copy payment link to clipboard
  const handleCopyLink = async () => {
    const url = generatedPayUrl || invoice?.paymentLinkUrl;
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Link href="/factures" className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-text">
          <ArrowLeft size={16} />
          Retour aux factures
        </Link>
        <Card className="border-red-200 bg-red-50 p-6 text-red-700">
          {error || "Facture introuvable"}
        </Card>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="space-y-6">
      <Link href="/factures" className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-text">
        <ArrowLeft size={16} />
        Retour aux factures
      </Link>

      <SectionHeader
        title={invoice.invoiceNumber || `Brouillon #${invoice.id.slice(0, 8)}`}
        description={`Créée le ${fmtDate(invoice.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => void loadInvoice()} disabled={!!actionLoading}>
              <RefreshCw size={16} />
            </Button>
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={!!actionLoading}>
              {actionLoading === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              PDF
            </Button>
            {invoice.status === "DRAFT" && (
              <Button onClick={() => handleAction("issue")} disabled={!!actionLoading}>
                {actionLoading === "issue" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Émettre
              </Button>
            )}
            {(invoice.status === "ISSUED" || invoice.status === "OVERDUE" || invoice.status === "PARTIALLY_PAID") && (
              <>
                <Button variant="secondary" onClick={() => handleAction("send")} disabled={!!actionLoading}>
                  {actionLoading === "send" ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Envoyer
                </Button>
                <Button variant="secondary" onClick={() => setShowPaymentModal(true)} disabled={!!actionLoading}>
                  <CreditCard size={16} />
                  Paiement en ligne
                </Button>
                <Button onClick={() => handleAction("mark-paid")} disabled={!!actionLoading}>
                  {actionLoading === "mark-paid" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Marquer payée
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">{error}</Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50 p-4 text-green-700 flex items-center gap-2">
          <Check size={18} />
          {success}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cfg.bg}`}>
                  <Receipt size={24} className={cfg.text} />
                </div>
                <div>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  {invoice.issuedAt && <p className="mt-1 text-xs text-muted2">Émise le {fmtDate(invoice.issuedAt)}</p>}
                  {invoice.paidAt && <p className="mt-1 text-xs text-green-600">Payée le {fmtDate(invoice.paidAt)}</p>}
                  {invoice.dueAt && !invoice.paidAt && (
                    <p className="mt-1 text-xs text-muted2">Échéance: {fmtDate(invoice.dueAt)}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{fmtEur(invoice.totalIncl)}</p>
                <p className="text-sm text-muted2">TTC</p>
              </div>
            </div>
          </Card>

          {/* Lines */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border bg-surface2 px-5 py-3">
              <h3 className="font-semibold">Lignes de la facture</h3>
            </div>
            <div className="divide-y divide-border">
              {invoice.lines.map((line, idx) => (
                <div key={idx} className="flex items-center justify-between px-5 py-4">
                  <div className="flex-1">
                    <p className="font-medium">{line.description}</p>
                    <p className="text-sm text-muted2">
                      {line.qty} × {fmtEur(line.unitPriceExcl)} HT
                      {line.vatRate > 0 && ` • TVA ${(line.vatRate * 100).toFixed(0)}%`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmtEur(line.totalIncl)}</p>
                    <p className="text-xs text-muted2">{fmtEur(line.totalExcl)} HT</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border bg-surface2 px-5 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted2">Sous-total HT</span>
                <span>{fmtEur(invoice.subtotalExcl)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-muted2">TVA</span>
                <span>{fmtEur(invoice.totalVat)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-lg font-bold">
                <span>Total TTC</span>
                <span>{fmtEur(invoice.totalIncl)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <User size={18} className="text-indigo-500" />
              Client
            </h3>
            <p className="font-medium">{invoice.client.firstName} {invoice.client.lastName}</p>
            {invoice.client.email && <p className="text-sm text-muted2">{invoice.client.email}</p>}
            {invoice.client.phone && <p className="text-sm text-muted2">{invoice.client.phone}</p>}
            <Link href={`/clients/${invoice.client.id}`} className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
              Voir le client →
            </Link>
          </Card>

          {/* Vehicle */}
          {invoice.vehicle && (
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Car size={18} className="text-orange-500" />
                Véhicule
              </h3>
              <p className="font-medium">{invoice.vehicle.brand} {invoice.vehicle.model}</p>
              <p className="text-sm text-muted2">{invoice.vehicle.plate}</p>
              <Link href={`/vehicules/${invoice.vehicle.id}`} className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
                Voir le véhicule →
              </Link>
            </Card>
          )}

          {/* Payment Info */}
          <Card className={`p-5 ${invoice.status === "PAID" ? "border-green-200 bg-green-50" : ""}`}>
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <CreditCard size={18} className={invoice.status === "PAID" ? "text-green-600" : "text-gray-500"} />
              Paiement
            </h3>
            {invoice.status === "PAID" ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={18} />
                <span>Payée le {fmtDate(invoice.paidAt)}</span>
              </div>
            ) : invoice.status === "PARTIALLY_PAID" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle size={18} />
                  <span>Partiellement payée</span>
                </div>
                <p className="text-sm text-muted2">
                  Payé: {fmtEur(invoice.amountPaid)} / {fmtEur(invoice.totalIncl)}
                </p>
                <p className="text-sm text-muted2">
                  Reste: {fmtEur(invoice.totalIncl - invoice.amountPaid)}
                </p>
              </div>
            ) : invoice.status === "ISSUED" || invoice.status === "OVERDUE" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock size={18} />
                  <span>En attente de paiement</span>
                </div>
                {invoice.dueAt && (
                  <p className="text-sm text-muted2">
                    Échéance: {fmtDate(invoice.dueAt)}
                  </p>
                )}
                {invoice.amountPaid > 0 && (
                  <p className="text-sm text-muted2">
                    Déjà payé: {fmtEur(invoice.amountPaid)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted2">Facture non émise</p>
            )}

            {/* Payment Link Status */}
            {invoice.paymentLinkUrl && invoice.status !== "PAID" && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted2 uppercase mb-2">Lien de paiement</p>
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} className="text-indigo-500" />
                  <a 
                    href={invoice.paymentLinkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline truncate flex-1"
                  >
                    Ouvrir
                  </a>
                  <button 
                    onClick={handleCopyLink}
                    className="p-1 hover:bg-surface2 rounded"
                    title="Copier le lien"
                  >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-muted2" />}
                  </button>
                </div>
                {invoice.paymentLinkExpiresAt && (
                  <p className="text-xs text-muted2 mt-1">
                    Expire le {fmtDate(invoice.paymentLinkExpiresAt)}
                  </p>
                )}
              </div>
            )}

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted2 uppercase mb-2">Historique</p>
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${
                          p.status === "SUCCEEDED" ? "bg-green-500" :
                          p.status === "PENDING" ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                        <span className="text-muted2">
                          {p.paymentType === "DEPOSIT" ? "Acompte" : "Total"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{fmtEur(p.amount)}</span>
                        {p.paidAt && (
                          <span className="text-xs text-muted2 ml-2">{fmtDate(p.paidAt)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Linked Quote */}
          {invoice.quoteId && (
            <Card className="border-indigo-200 bg-indigo-50 p-5">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-indigo-700">
                <Receipt size={18} />
                Devis lié
              </h3>
              <Link href={`/devis/${invoice.quoteId}`} className="text-sm text-indigo-600 hover:underline">
                Voir le devis →
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Créer un lien de paiement</h3>
            
            {!generatedPayUrl ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type de paiement</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentType"
                        value="FULL"
                        checked={paymentType === "FULL"}
                        onChange={(e) => setPaymentType(e.target.value as "FULL" | "DEPOSIT")}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span>Montant total</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentType"
                        value="DEPOSIT"
                        checked={paymentType === "DEPOSIT"}
                        onChange={(e) => setPaymentType(e.target.value as "FULL" | "DEPOSIT")}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span>Acompte</span>
                    </label>
                  </div>
                </div>

                {paymentType === "FULL" ? (
                  <div className="p-4 bg-surface2 rounded-lg">
                    <p className="text-sm text-muted2">Montant à payer</p>
                    <p className="text-2xl font-bold">{fmtEur(invoice.totalIncl - invoice.amountPaid)}</p>
                    {invoice.amountPaid > 0 && (
                      <p className="text-xs text-muted2 mt-1">
                        Total {fmtEur(invoice.totalIncl)} - déjà payé {fmtEur(invoice.amountPaid)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2">Montant de l&apos;acompte (€)</label>
                    <input
                      type="number"
                      min="1"
                      max={(invoice.totalIncl - invoice.amountPaid) / 100}
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Ex: 150.00"
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-muted2 mt-1">
                      Maximum: {fmtEur(invoice.totalIncl - invoice.amountPaid)}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentType("FULL");
                      setDepositAmount("");
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreatePaymentLink}
                    disabled={actionLoading === "payment-link" || (paymentType === "DEPOSIT" && !depositAmount)}
                    className="flex-1"
                  >
                    {actionLoading === "payment-link" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <ExternalLink size={16} />
                        Générer le lien
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Check size={18} />
                    <span className="font-medium">Lien créé avec succès !</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded border px-3 py-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedPayUrl}
                      className="flex-1 text-sm bg-transparent outline-none truncate"
                    />
                    <button onClick={handleCopyLink} className="p-1 hover:bg-surface2 rounded">
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-muted2" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted2 mt-2">Ce lien est valable 24 heures</p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setGeneratedPayUrl(null);
                      setPaymentType("FULL");
                      setDepositAmount("");
                    }}
                    className="flex-1"
                  >
                    Fermer
                  </Button>
                  <Button 
                    onClick={handleSendPaymentLink}
                    disabled={actionLoading === "send-payment"}
                    className="flex-1"
                  >
                    {actionLoading === "send-payment" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={16} />
                        Envoyer par email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
