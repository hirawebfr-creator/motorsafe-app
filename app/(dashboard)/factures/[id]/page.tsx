"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
  createdAt: string;
  issuedAt: string | null;
  paidAt: string | null;
  dueAt: string | null;
  quoteId: string | null;
  lines: InvoiceLine[];
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
  PAID: { bg: "bg-green-100", text: "text-green-700", label: "Payée" },
  OVERDUE: { bg: "bg-red-100", text: "text-red-700", label: "En retard" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", label: "Annulée" },
};

export default function FactureDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
            {invoice.status === "ISSUED" && (
              <Button onClick={() => handleAction("mark-paid")} disabled={!!actionLoading}>
                {actionLoading === "mark-paid" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Marquer payée
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">{error}</Card>
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
            ) : invoice.status === "ISSUED" ? (
              <div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock size={18} />
                  <span>En attente de paiement</span>
                </div>
                {invoice.dueAt && (
                  <p className="mt-2 text-sm text-muted2">
                    Échéance: {fmtDate(invoice.dueAt)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted2">Facture non émise</p>
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
    </div>
  );
}
