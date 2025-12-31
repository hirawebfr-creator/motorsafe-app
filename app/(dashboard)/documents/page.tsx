"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { fetcher } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";

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

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Documents</p>
        <h1 className="mt-3 text-3xl font-semibold">Dossiers PDF</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Telechargez les dossiers d'intervention generes a la demande. Chaque PDF reprend les preuves, hashes et revisions.
        </p>
      </div>

      <Card className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par plaque, client, type"
          />
          <Badge variant="accent">{filtered.length} documents</Badge>
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        <DataTable stickyHeader>
          <DataTableHead sticky>
            <tr>
              <th className="px-5 py-4">Intervention</th>
              <th className="px-5 py-4">Client</th>
              <th className="px-5 py-4 text-right">PDF</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-6" colSpan={3}>
                  <Loading />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-5 py-6" colSpan={3}>
                  <EmptyState title="Aucun document" description="Les PDFs seront disponibles ici." />
                </td>
              </tr>
            ) : (
              visibleDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-t border-[rgba(31,41,55,0.7)] transition hover:bg-[rgba(139,92,246,0.06)]"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold">
                      {doc.vehicle.plate} - {doc.type}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">
                    {doc.vehicle.client.firstName} {doc.vehicle.client.lastName}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a href={`/api/interventions/${doc.id}/pdf`} className="text-[var(--accent-2)]">
                      Telecharger
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
        {filtered.length > visibleCount ? (
          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Afficher plus
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
