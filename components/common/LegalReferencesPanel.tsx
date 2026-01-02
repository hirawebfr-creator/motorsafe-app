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
        <p className="ms-kicker">Références & conformité</p>
        <h3 className="mt-2 text-lg font-semibold">Cadre légal associé</h3>
      </div>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune référence associée"
          description="L'administration pourra ajouter des références légales liées à ce type."
        />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <details
              key={item.id}
              className="rounded-[var(--r)] border border-border/60 bg-surface"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted2">
                    {item.code || item.articleRef || item.tags ? "Voir le détail" : ""}
                  </p>
                </div>
                <Badge variant={severityVariant[item.severity]}>
                  {item.severity === "CRITICAL" ? "Critique" : item.severity === "WARNING" ? "Attention" : "Info"}
                </Badge>
              </summary>

              <div className="border-t border-border/60 px-4 py-3 text-sm">
                {item.summary ? (
                  <p className="text-sm text-muted2">{item.summary}</p>
                ) : (
                  <p className="text-sm text-muted2">Aucun résumé.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted2">
                  {item.code ? <span>{item.code}</span> : null}
                  {item.articleRef ? <span>{item.articleRef}</span> : null}
                  {item.tags ? <span>Tags: {item.tags}</span> : null}
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      className="font-semibold text-primary hover:text-primaryHover"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source
                    </a>
                  ) : null}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </Card>
  );
}
