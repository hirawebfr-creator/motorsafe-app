"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type QuoteLine = {
  description: string;
  qty: number;
  unitPriceExcl: number;
  vatRate: number;
  totalExcl: number;
  totalVat: number;
  totalIncl: number;
};

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
  SENT: { bg: "bg-blue-100", text: "text-blue-700", label: "Envoyé" },
  ACCEPTED: { bg: "bg-green-100", text: "text-green-700", label: "Accepté" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Refusé" },
  INVOICED: { bg: "bg-purple-100", text: "text-purple-700", label: "Facturé" },
};

export default function DevisDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadQuote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/quotes/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Devis introuvable");
      }
      setQuote(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action);
      setError(null);
      const res = await fetch(`/api/quotes/${id}/${action}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || `Erreur ${action}`);
      }
      await loadQuote();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setActionLoading("pdf");
      const res = await fetch(`/api/quotes/${id}/pdf`);
      if (!res.ok) throw new Error("Erreur génération PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devis-${quote?.quoteNumber || id}.pdf`;
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

  if (error || !quote) {
    return (
      <div className="space-y-6">
        <Link href="/devis" className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-text">
          <ArrowLeft size={16} />
          Retour aux devis
        </Link>
        <Card className="border-red-200 bg-red-50 p-6 text-red-700">
          {error || "Devis introuvable"}
        </Card>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="space-y-6">
      <Link href="/devis" className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-text">
        <ArrowLeft size={16} />
        Retour aux devis
      </Link>

      <SectionHeader
        title={quote.quoteNumber || `Brouillon #${quote.id.slice(0, 8)}`}
        description={`Créé le ${fmtDate(quote.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => void loadQuote()} disabled={!!actionLoading}>
              <RefreshCw size={16} />
            </Button>
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={!!actionLoading}>
              {actionLoading === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              PDF
            </Button>
            {quote.status === "DRAFT" && (
              <Button onClick={() => handleAction("send")} disabled={!!actionLoading}>
                {actionLoading === "send" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Envoyer
              </Button>
            )}
            {quote.status === "SENT" && (
              <>
                <Button onClick={() => handleAction("accept")} disabled={!!actionLoading}>
                  {actionLoading === "accept" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Accepter
                </Button>
                <Button variant="danger" onClick={() => handleAction("reject")} disabled={!!actionLoading}>
                  {actionLoading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Refuser
                </Button>
              </>
            )}
            {quote.status === "ACCEPTED" && !quote.invoicedAt && (
              <Button onClick={() => handleAction("convert")} disabled={!!actionLoading}>
                {actionLoading === "convert" ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Convertir en facture
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
                  <FileText size={24} className={cfg.text} />
                </div>
                <div>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  {quote.sentAt && <p className="mt-1 text-xs text-muted2">Envoyé le {fmtDate(quote.sentAt)}</p>}
                  {quote.acceptedAt && <p className="mt-1 text-xs text-green-600">Accepté le {fmtDate(quote.acceptedAt)}</p>}
                  {quote.rejectedAt && <p className="mt-1 text-xs text-red-600">Refusé le {fmtDate(quote.rejectedAt)}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{fmtEur(quote.totalIncl)}</p>
                <p className="text-sm text-muted2">TTC</p>
              </div>
            </div>
          </Card>

          {/* Lines */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border bg-surface2 px-5 py-3">
              <h3 className="font-semibold">Lignes du devis</h3>
            </div>
            <div className="divide-y divide-border">
              {quote.lines.map((line, idx) => (
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
                <span>{fmtEur(quote.subtotalExcl)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-muted2">TVA</span>
                <span>{fmtEur(quote.totalVat)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-lg font-bold">
                <span>Total TTC</span>
                <span>{fmtEur(quote.totalIncl)}</span>
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
            <p className="font-medium">{quote.client.firstName} {quote.client.lastName}</p>
            {quote.client.email && <p className="text-sm text-muted2">{quote.client.email}</p>}
            {quote.client.phone && <p className="text-sm text-muted2">{quote.client.phone}</p>}
            <Link href={`/clients/${quote.client.id}`} className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
              Voir le client →
            </Link>
          </Card>

          {/* Vehicle */}
          {quote.vehicle && (
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Car size={18} className="text-orange-500" />
                Véhicule
              </h3>
              <p className="font-medium">{quote.vehicle.brand} {quote.vehicle.model}</p>
              <p className="text-sm text-muted2">{quote.vehicle.plate}</p>
              <Link href={`/vehicules/${quote.vehicle.id}`} className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
                Voir le véhicule →
              </Link>
            </Card>
          )}

          {/* Linked Invoice */}
          {quote.invoiceId && (
            <Card className="border-purple-200 bg-purple-50 p-5">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-purple-700">
                <FileText size={18} />
                Facture liée
              </h3>
              <Link href={`/factures/${quote.invoiceId}`} className="text-sm text-purple-600 hover:underline">
                Voir la facture →
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
