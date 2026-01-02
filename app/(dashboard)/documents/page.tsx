"use client";

import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDistance } from "date-fns/formatDistance";
import { fr } from "date-fns/locale/fr";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { fetcher } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useRouter } from "next/navigation";

type DocumentItem = {
  id: string;
  type: string;
  createdAt: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    client: { firstName: string; lastName: string };
  };
};

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<DocumentItem[]>("/api/interventions", { noStore: true });
      setDocuments(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => {
      const data = `${doc.vehicle.plate} ${doc.vehicle.brand} ${doc.vehicle.model} ${doc.vehicle.client.firstName} ${doc.vehicle.client.lastName} ${doc.type}`.toLowerCase();
      return data.includes(q);
    });
  }, [documents, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const visibleDocuments = filtered.slice(0, visibleCount);

  // Helper for relative date
  const getRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistance(d, new Date(), { addSuffix: true, locale: fr });
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Documents"
        description="Téléchargez les dossiers PDF générés depuis les interventions."
        action={<Button onClick={() => router.push("/interventions")}>Ouvrir interventions</Button>}
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border p-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par plaque, client, type"
            className="max-w-md"
          />
          <p className="mt-3 text-xs text-muted2">
            {loading ? "Chargement…" : `${filtered.length} document(s)`}
          </p>
        </div>

        <DataTable stickyHeader variant="plain">
          <DataTableHead sticky>
            <tr>
              <th>Intervention</th>
              <th>Client</th>
              <th className="text-right">PDF</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={3}>
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <EmptyState title="Aucun document" description="Les PDFs seront disponibles ici." />
                </td>
              </tr>
            ) : (
              visibleDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <p className="font-semibold text-text">
                      {doc.vehicle.plate} · {doc.type}
                    </p>
                    <p className="mt-1 text-xs text-muted2">
                      <span title={new Date(doc.createdAt).toLocaleString("fr-FR")}>{getRelativeDate(doc.createdAt)}</span>
                    </p>
                  </td>
                  <td className="text-sm text-muted2">
                    {doc.vehicle.client.firstName} {doc.vehicle.client.lastName}
                  </td>
                  <td className="text-right">
                    <a
                      href={`/api/interventions/${doc.id}/pdf`}
                      className="text-sm font-semibold text-primary hover:text-primaryHover"
                    >
                      Télécharger
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>

        {filtered.length > visibleCount ? (
          <div className="border-t border-border p-4 flex justify-center">
            <Button variant="ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Afficher plus
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
