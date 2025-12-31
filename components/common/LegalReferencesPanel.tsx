"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { fetcher } from "@/lib/fetcher";

type LegalReference = {
  id: string;
  title: string;
  summary?: string | null;
  sourceUrl?: string | null;
  code?: string | null;
  articleRef?: string | null;
  tags?: string | null;
  severity: "INFO" | "WARNING" | "CRITICAL";
};

const severityVariant: Record<LegalReference["severity"], "neutral" | "warning" | "accent"> = {
  INFO: "neutral",
  WARNING: "warning",
  CRITICAL: "accent",
};

export function LegalReferencesPanel({ type }: { type: string }) {
  const [items, setItems] = useState<LegalReference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;
    let active = true;
    setLoading(true);
    fetcher<LegalReference[]>(`/api/legal-references?type=${encodeURIComponent(type)}`, {
      noStore: true,
    })
      .then((data) => {
        if (active) setItems(data ?? []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [type]);

  return (
    <Card className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          References & conformite
        </p>
        <h3 className="mt-2 text-lg font-semibold">Cadre legal associe</h3>
      </div>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune reference associee"
          description="L'administration pourra ajouter des references legales liees a ce type."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-sm)] border border-[rgba(31,41,55,0.7)] bg-[rgba(15,18,30,0.8)] p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[var(--text)]">{item.title}</p>
                <Badge variant={severityVariant[item.severity]}>
                  {item.severity === "CRITICAL" ? "Critique" : item.severity === "WARNING" ? "Attention" : "Info"}
                </Badge>
              </div>
              {item.summary ? <p className="mt-2 text-xs text-[var(--muted)]">{item.summary}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                {item.code ? <span>{item.code}</span> : null}
                {item.articleRef ? <span>{item.articleRef}</span> : null}
                {item.tags ? <span>Tags: {item.tags}</span> : null}
                {item.sourceUrl ? (
                  <a href={item.sourceUrl} className="text-[var(--accent-2)]" target="_blank" rel="noreferrer">
                    Source
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
