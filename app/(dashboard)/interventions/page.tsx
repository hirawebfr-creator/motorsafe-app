"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";
import { useToast } from "@/components/ui/Toast";

type VehicleOption = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { firstName: string; lastName: string };
};

type InterventionItem = {
  id: string;
  type: string;
  createdAt: string;
  performedAt?: string | null;
  vehicle: VehicleOption;
};

const INTERVENTION_TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const toast = useToast();

  const [form, setForm] = useState({
    vehicleId: "",
    type: "E85",
    notes: "",
    performedAt: "",
    odometerKm: "",
    ecuType: "",
    softwareVersion: "",
    checksum: "",
  });

  const loadInterventions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<InterventionItem[]>("/api/interventions", { noStore: true });
      setInterventions(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const data = await fetcher<VehicleOption[]>("/api/vehicules", { noStore: true });
      setVehicles(data ?? []);
    } catch {
      setVehicles([]);
    }
  };

  useEffect(() => {
    loadInterventions();
    loadVehicles();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return interventions;
    return interventions.filter((item) => {
      const data = `${item.vehicle.plate} ${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.client.firstName} ${item.vehicle.client.lastName} ${item.type}`.toLowerCase();
      return data.includes(q);
    });
  }, [interventions, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const visibleInterventions = filtered.slice(0, visibleCount);

  const submit = async () => {
    setError(null);
    try {
      const payload = {
        vehicleId: form.vehicleId,
        type: form.type,
        notes: form.notes || null,
        performedAt: form.performedAt || null,
        odometerKm: form.odometerKm || null,
        ecuType: form.ecuType || null,
        softwareVersion: form.softwareVersion || null,
        checksum: form.checksum || null,
      };
      await requestJson("/api/interventions", { method: "POST", body: payload });
      toast.push({
        title: "Intervention creee",
        description: "Le dossier a ete enregistre.",
        variant: "success",
      });
      setForm({
        vehicleId: "",
        type: "E85",
        notes: "",
        performedAt: "",
        odometerKm: "",
        ecuType: "",
        softwareVersion: "",
        checksum: "",
      });
      await loadInterventions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Interventions</p>
        <h1 className="mt-3 text-3xl font-semibold">Suivi des interventions</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Chaque intervention est horodatee, tracee et reliee a un dossier PDF conforme.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, client, type"
            />
            <Badge variant="accent">{filtered.length} dossiers</Badge>
          </div>

          {error ? <ErrorBanner message={error} /> : null}

          <DataTable stickyHeader>
            <DataTableHead sticky>
              <tr>
                <th className="px-5 py-4">Dossier</th>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4 text-right">Actions</th>
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
                    <EmptyState title="Aucune intervention" description="Creez un dossier d'intervention." />
                  </td>
                </tr>
              ) : (
                visibleInterventions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[rgba(31,41,55,0.7)] transition hover:bg-[rgba(139,92,246,0.06)]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {item.vehicle.plate} - {item.type}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">
                      {item.vehicle.client.firstName} {item.vehicle.client.lastName}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-3 text-sm">
                        <Link href={`/interventions/${item.id}`} className="text-[var(--accent-2)]">
                          Detail
                        </Link>
                        <a href={`/api/interventions/${item.id}/pdf`} className="text-[var(--accent-2)]">
                          PDF
                        </a>
                      </div>
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

        <Card className="grid gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Nouvelle intervention</p>
            <h2 className="mt-2 text-xl font-semibold">Creer un dossier</h2>
          </div>

          <Select
            label="Vehicule"
            value={form.vehicleId}
            onChange={(event) => setForm((prev) => ({ ...prev, vehicleId: event.target.value }))}
          >
            <option value="">Selectionner un vehicule</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate} - {vehicle.client.firstName} {vehicle.client.lastName}
              </option>
            ))}
          </Select>
          <Select
            label="Type"
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
          >
            {INTERVENTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Input
            label="Date realisee"
            type="datetime-local"
            value={form.performedAt}
            onChange={(event) => setForm((prev) => ({ ...prev, performedAt: event.target.value }))}
          />
          <Input
            label="Kilometrage"
            value={form.odometerKm}
            onChange={(event) => setForm((prev) => ({ ...prev, odometerKm: event.target.value }))}
            placeholder="120000"
          />
          <Input
            label="ECU"
            value={form.ecuType}
            onChange={(event) => setForm((prev) => ({ ...prev, ecuType: event.target.value }))}
            placeholder="Bosch EDC17"
          />
          <Input
            label="Version logicielle"
            value={form.softwareVersion}
            onChange={(event) => setForm((prev) => ({ ...prev, softwareVersion: event.target.value }))}
            placeholder="v3.2"
          />
          <Input
            label="Checksum"
            value={form.checksum}
            onChange={(event) => setForm((prev) => ({ ...prev, checksum: event.target.value }))}
            placeholder="SHA256"
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Details de l'intervention"
          />
          <LegalReferencesPanel type={form.type} />
          <Button onClick={submit}>Creer l'intervention</Button>
        </Card>
      </div>
    </div>
  );
}
