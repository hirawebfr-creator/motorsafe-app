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
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edition state
  const [isEditing, setIsEditing] = useState(false);
  const [editLines, setEditLines] = useState<QuoteLine[]>([]);
  const [saving, setSaving] = useState(false);

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
      setEditLines(json.data.lines.map((l: QuoteLine) => ({
        description: l.description,
        qty: l.qty,
        unitPriceExcl: l.unitPriceExcl,
        vatRate: l.vatRate,
      })));
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

      // Special handling for convert - need to redirect to invoice
      if (action === "convert") {
        const res = await fetch(`/api/quotes/${id}/convert`, { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error?.message || "Erreur conversion");
        }
        // Redirect to the created invoice
        const invoiceId = json.data?.id;
        if (invoiceId) {
          router.push(`/factures/${invoiceId}`);
          return;
        }
      }

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

  // --- Line editing functions ---
  const handleLineChange = (index: number, field: keyof QuoteLine, value: string | number) => {
    setEditLines((prev) => {
      const updated = [...prev];
      if (field === "description") {
        updated[index] = { ...updated[index], description: String(value) };
      } else if (field === "qty") {
        updated[index] = { ...updated[index], qty: Number(value) || 1 };
      } else if (field === "unitPriceExcl") {
        updated[index] = { ...updated[index], unitPriceExcl: Number(value) || 0 };
      } else if (field === "vatRate") {
        updated[index] = { ...updated[index], vatRate: Number(value) || 0 };
      }
      return updated;
    });
  };

  const handleAddLine = () => {
    setEditLines((prev) => [
      ...prev,
      { description: "", qty: 1, unitPriceExcl: 0, vatRate: DEFAULT_VAT_RATE },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setEditLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveLines = async () => {
    // Validate
    const validLines = editLines.filter((l) => l.description.trim().length > 0);
    if (validLines.length === 0) {
      setError("Au moins une ligne est requise");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: validLines.map((l) => ({
            description: l.description.trim(),
            qty: l.qty,
            unitPriceExcl: l.unitPriceExcl,
            vatRate: l.vatRate,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur sauvegarde");
      }

      setIsEditing(false);
      await loadQuote();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original lines
    if (quote) {
      setEditLines(quote.lines.map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPriceExcl: l.unitPriceExcl,
        vatRate: l.vatRate,
      })));
    }
    setIsEditing(false);
  };

  // Calculate preview totals
  const previewTotals = editLines.reduce(
    (acc, l) => {
      const lineExcl = l.qty * l.unitPriceExcl;
      const lineVat = lineExcl * l.vatRate;
      const lineIncl = lineExcl + lineVat;
      return {
        subtotalExcl: acc.subtotalExcl + lineExcl,
        totalVat: acc.totalVat + lineVat,
        totalIncl: acc.totalIncl + lineIncl,
      };
    },
    { subtotalExcl: 0, totalVat: 0, totalIncl: 0 }
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !quote) {
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

  if (!quote) return null;

  const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;
  const canEdit = quote.status === "DRAFT";

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
            <Button variant="ghost" onClick={() => void loadQuote()} disabled={!!actionLoading || saving}>
              <RefreshCw size={16} />
            </Button>
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={!!actionLoading || saving}>
              {actionLoading === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              PDF
            </Button>
            {quote.status === "DRAFT" && (
              <Button onClick={() => handleAction("send")} disabled={!!actionLoading || saving}>
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
                <p className="text-2xl font-bold">{fmtEur(isEditing ? previewTotals.totalIncl : quote.totalIncl)}</p>
                <p className="text-sm text-muted2">TTC</p>
              </div>
            </div>
          </Card>

          {/* Lines */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border bg-surface2 px-5 py-3">
              <h3 className="font-semibold">Lignes du devis</h3>
              {canEdit && !isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil size={14} />
                  Modifier
                </Button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saving}>
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleSaveLines} disabled={saving}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              /* Edit Mode */
              <div className="divide-y divide-border">
                {editLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 px-5 py-4">
                    <div className="col-span-5">
                      <label className="mb-1 block text-xs text-muted2">Description</label>
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                        placeholder="Description..."
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs text-muted2">Qté</label>
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) => handleLineChange(idx, "qty", e.target.value)}
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs text-muted2">Prix HT</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPriceExcl}
                        onChange={(e) => handleLineChange(idx, "unitPriceExcl", e.target.value)}
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs text-muted2">TVA %</label>
                      <select
                        value={line.vatRate}
                        onChange={(e) => handleLineChange(idx, "vatRate", e.target.value)}
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="0">0%</option>
                        <option value="0.055">5.5%</option>
                        <option value="0.1">10%</option>
                        <option value="0.2">20%</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex items-end justify-center pb-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        disabled={editLines.length <= 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <Button variant="ghost" size="sm" onClick={handleAddLine}>
                    <Plus size={14} />
                    Ajouter une ligne
                  </Button>
                </div>
              </div>
            ) : (
              /* View Mode */
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
                      <p className="font-semibold">{fmtEur(line.lineTotalIncl || 0)}</p>
                      <p className="text-xs text-muted2">{fmtEur(line.lineTotalExcl || 0)} HT</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border bg-surface2 px-5 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted2">Sous-total HT</span>
                <span>{fmtEur(isEditing ? previewTotals.subtotalExcl : quote.subtotalExcl)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-muted2">TVA</span>
                <span>{fmtEur(isEditing ? previewTotals.totalVat : quote.totalVat)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-lg font-bold">
                <span>Total TTC</span>
                <span>{fmtEur(isEditing ? previewTotals.totalIncl : quote.totalIncl)}</span>
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
