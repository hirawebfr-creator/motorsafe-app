"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  TrendingUp,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type QuoteItem = {
  id: string;
  quoteNumber: string | null;
  status: string;
  totalIncl: number;
  createdAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon", icon: Clock },
  SENT: { bg: "bg-blue-100", text: "text-blue-700", label: "Envoyé", icon: Send },
  ACCEPTED: { bg: "bg-green-100", text: "text-green-700", label: "Accepté", icon: CheckCircle },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Refusé", icon: XCircle },
  INVOICED: { bg: "bg-purple-100", text: "text-purple-700", label: "Facturé", icon: FileText },
};

export default function DevisPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const debounceRef = useRef<number | null>(null);

  async function load(search: string) {
    try {
      setLoading(true);
      setError(null);

      const url = new URL("/api/quotes", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "50");
      if (search.trim()) url.searchParams.set("q", search.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message || json?.error || `GET /api/quotes ${res.status}`;
        throw new Error(message);
      }

      const data = unwrapOk(json);
      if (isRecord(data) && typeof data.total === "number") {
        setTotal(data.total);
      }
      setItems(pickArray(json) as QuoteItem[]);
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

  // Stats
  const stats = useMemo(() => {
    const draft = items.filter((i) => i.status === "DRAFT").length;
    const sent = items.filter((i) => i.status === "SENT").length;
    const accepted = items.filter((i) => i.status === "ACCEPTED").length;
    const totalAmount = items.reduce((acc, i) => acc + (i.totalIncl || 0), 0);
    return { draft, sent, accepted, totalAmount };
  }, [items]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Devis"
        description="Gérez vos devis clients"
        action={
          <Link href="/devis/nouveau">
            <Button>
              <Plus size={18} />
              Nouveau devis
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted2">Total</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <FileText size={24} className="text-indigo-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted2">En attente</p>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </div>
            <Send size={24} className="text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted2">Acceptés</p>
              <p className="text-2xl font-bold">{stats.accepted}</p>
            </div>
            <CheckCircle size={24} className="text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted2">Montant total</p>
              <p className="text-2xl font-bold">{fmtEur(stats.totalAmount)}</p>
            </div>
            <TrendingUp size={24} className="text-emerald-500" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par numéro, client..."
            className="w-full rounded-lg border border-border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </Card>
      )}

      {/* List */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-muted2">Aucun devis trouvé</p>
            <Link href="/devis/nouveau" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                <Plus size={16} />
                Créer un devis
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
              const Icon = cfg.icon;
              return (
                <Link
                  key={item.id}
                  href={`/devis/${item.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface2"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.bg}`}>
                      <Icon size={20} className={cfg.text} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {item.quoteNumber || `Brouillon #${item.id.slice(0, 6)}`}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted2">
                        {item.client.firstName} {item.client.lastName}
                        {item.vehicle && ` • ${item.vehicle.brand} ${item.vehicle.model}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold">{fmtEur(item.totalIncl)}</p>
                      <p className="text-xs text-muted2">{fmtDate(item.createdAt)}</p>
                    </div>
                    <MoreHorizontal size={20} className="text-muted2" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
