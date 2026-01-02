"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@/components/user-context";
import { SectionHeader } from "@/components/ui/SectionHeader";

type LegalReference = {
  id: string;
  title: string;
  summary?: string | null;
  sourceUrl?: string | null;
  code?: string | null;
  articleRef?: string | null;
  tags?: string | null;
  severity: "INFO" | "WARNING" | "CRITICAL";
  isActive: boolean;
  assignments: Array<{ interventionType: string }>;
};

const TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function AdminReferencesPage() {
  const user = useUser();
  if (!user) return null;
  const [items, setItems] = useState<LegalReference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    sourceUrl: "",
    code: "",
    articleRef: "",
    tags: "",
    severity: "INFO",
    types: [] as string[],
  });
  const toast = useToast();

  const load = async () => {
    setError(null);
    try {
      const data = await fetcher<LegalReference[]>("/api/legal-references", { noStore: true });
      setItems(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((item) => item !== type)
        : [...prev.types, type],
    }));
  };

  const submit = async () => {
    setError(null);
    try {
      await requestJson("/api/legal-references", {
        method: "POST",
        body: {
          title: form.title,
          summary: form.summary || null,
          sourceUrl: form.sourceUrl || null,
          code: form.code || null,
          articleRef: form.articleRef || null,
          tags: form.tags || null,
          severity: form.severity,
          types: form.types,
        },
      });
      toast.push({
        title: "Reference ajoutee",
        description: "La reference est maintenant disponible.",
        variant: "success",
      });
      setForm({
        title: "",
        summary: "",
        sourceUrl: "",
        code: "",
        articleRef: "",
        tags: "",
        severity: "INFO",
        types: [],
      });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const toggleActive = async (reference: LegalReference) => {
    try {
      await requestJson(`/api/legal-references/${reference.id}`, {
        method: "PUT",
        body: { isActive: !reference.isActive },
      });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const deleteReference = async (reference: LegalReference) => {
    if (!confirm("Supprimer cette reference ?")) return;
    try {
      await requestJson(`/api/legal-references/${reference.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const isAdmin = user.role === "ADMIN";

  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);

  if (!isAdmin) {
    return (
      <Card>
        <p className="text-sm text-[color:var(--textMuted)]">Accès réservé à l'administration.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Références légales"
        description="Gérez les références applicables aux interventions. Elles seront visibles dans les dossiers."
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-4 p-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Références actives</h2>
            <Badge variant="accent">{activeCount} actives</Badge>
          </div>
          <DataTable stickyHeader>
            <DataTableHead sticky>
              <tr>
                <th className="px-5 py-4">Référence</th>
                <th className="px-5 py-4">Types</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </DataTableHead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6" colSpan={3}>
                    <p className="text-sm text-[color:var(--textMuted)]">Aucune référence.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[color:var(--border)] transition hover:bg-[color:var(--surface2)]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[color:var(--text)]">{item.title}</p>
                      <p className="text-xs text-[color:var(--textMuted)]">{item.summary || "-"}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--textMuted)]">
                        {item.code ? <span>{item.code}</span> : null}
                        {item.articleRef ? <span>{item.articleRef}</span> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-[color:var(--textMuted)]">
                      {item.assignments.map((entry) => entry.interventionType).join(", ") || "-"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(item)}>
                          {item.isActive ? "Désactiver" : "Activer"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteReference(item)}>
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DataTable>
        </Card>

        <Card className="grid gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Nouvelle référence</p>
            <h2 className="mt-2 text-xl font-semibold">Ajouter une référence</h2>
          </div>
          <Input
            label="Titre"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Intervention E85 et obligations"
          />
          <Textarea
            label="Résumé"
            value={form.summary}
            onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            placeholder="Résumé court pour les techniciens."
          />
          <Input
            label="Source URL"
            value={form.sourceUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
            placeholder="https://..."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Code"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="Code de la route"
            />
            <Input
              label="Article"
              value={form.articleRef}
              onChange={(event) => setForm((prev) => ({ ...prev, articleRef: event.target.value }))}
              placeholder="R.123-4"
            />
          </div>
          <Input
            label="Tags"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="E85, anti-demarrage"
          />
          <Select
            label="Sévérité"
            value={form.severity}
            onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
          >
            <option value="INFO">Info</option>
            <option value="WARNING">Attention</option>
            <option value="CRITICAL">Critique</option>
          </Select>
          <div className="grid gap-2 text-xs text-[color:var(--textMuted)]">
            <p className="text-[color:var(--text)]">Types d'intervention associés</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-[var(--rButton)] border px-3 py-2 text-xs font-semibold transition ${
                    form.types.includes(type)
                      ? "border-[color:var(--accent)] bg-[rgba(124,92,255,0.16)] text-[color:var(--text)]"
                      : "border-[color:var(--border)] text-[color:var(--textMuted)] hover:bg-[color:var(--surface2)]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={submit}>Ajouter la référence</Button>
        </Card>
      </div>
    </div>
  );
}
