"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";

type ClientOption = { id: number; firstName: string; lastName: string };

type VehicleItem = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  client: ClientOption;
};

export default function VehiculesPage() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const toast = useToast();

  const [form, setForm] = useState({
    clientId: "",
    brand: "",
    model: "",
    plate: "",
    vin: "",
    fuel: "",
  });
  const [editing, setEditing] = useState<VehicleItem | null>(null);

  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<VehicleItem[]>("/api/vehicules", { noStore: true });
      setVehicles(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await fetcher<ClientOption[]>("/api/clients", { noStore: true });
      setClients(data ?? []);
    } catch {
      setClients([]);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadClients();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((vehicle) => {
      const data = `${vehicle.plate} ${vehicle.brand} ${vehicle.model} ${vehicle.client.firstName} ${vehicle.client.lastName}`.toLowerCase();
      return data.includes(q);
    });
  }, [vehicles, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const visibleVehicles = filtered.slice(0, visibleCount);

  const resetForm = () => {
    setEditing(null);
    setForm({ clientId: "", brand: "", model: "", plate: "", vin: "", fuel: "" });
  };

  const startEdit = (vehicle: VehicleItem) => {
    setEditing(vehicle);
    setForm({
      clientId: String(vehicle.client.id),
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      vin: vehicle.vin ?? "",
      fuel: vehicle.fuel ?? "",
    });
  };

  const submit = async () => {
    setError(null);
    try {
      const payload = {
        clientId: Number(form.clientId),
        brand: form.brand,
        model: form.model,
        plate: form.plate,
        vin: form.vin || null,
        fuel: form.fuel || null,
      };

      await requestJson<VehicleItem>(
        editing ? `/api/vehicules/${editing.id}` : "/api/vehicules",
        { method: editing ? "PUT" : "POST", body: payload }
      );
      toast.push({
        title: editing ? "Vehicule mis a jour" : "Vehicule cree",
        description: "Les informations sont enregistrees.",
        variant: "success",
      });
      resetForm();
      await loadVehicles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const requestDelete = (vehicleId: string) => {
    setPendingDeleteId(vehicleId);
    setConfirmOpen(true);
  };

  const removeVehicle = async () => {
    if (!pendingDeleteId) return;
    try {
      await requestJson(`/api/vehicules/${pendingDeleteId}`, { method: "DELETE" });
      toast.push({
        title: "Vehicule supprime",
        description: "Le vehicule a ete retire.",
        variant: "success",
      });
      await loadVehicles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Vehicules</p>
        <h1 className="mt-3 text-3xl font-semibold">Parc vehicule</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Chaque vehicule est rattache a un client. Accedez au dossier complet pour les interventions et le PDF.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, marque, client"
            />
            <Badge variant="accent">{filtered.length} vehicules</Badge>
          </div>

          {error ? <ErrorBanner message={error} /> : null}

          <DataTable stickyHeader>
            <DataTableHead sticky>
              <tr>
                <th className="px-5 py-4">Vehicule</th>
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
                    <EmptyState title="Aucun vehicule" description="Ajoutez un vehicule client." />
                  </td>
                </tr>
              ) : (
                visibleVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="border-t border-[rgba(31,41,55,0.7)] transition hover:bg-[rgba(139,92,246,0.06)]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold">{vehicle.plate}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {vehicle.brand} {vehicle.model}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">
                      {vehicle.client.firstName} {vehicle.client.lastName}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/vehicules/${vehicle.id}`} className="text-sm text-[var(--accent-2)]">
                          Dossier
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(vehicle)}>
                          Editer
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => requestDelete(vehicle.id)}>
                          Supprimer
                        </Button>
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
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              {editing ? "Edition" : "Nouveau vehicule"}
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {editing ? "Modifier le vehicule" : "Creer un vehicule"}
            </h2>
          </div>

          <div className="grid gap-4">
            <Select
              label="Client"
              value={form.clientId}
              onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
            >
              <option value="">Selectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </Select>
            <Input
              label="Marque"
              value={form.brand}
              onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              placeholder="BMW"
            />
            <Input
              label="Modele"
              value={form.model}
              onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
              placeholder="Serie 1"
            />
            <Input
              label="Immatriculation"
              value={form.plate}
              onChange={(event) => setForm((prev) => ({ ...prev, plate: event.target.value }))}
              placeholder="AB-123-CD"
            />
            <Input
              label="VIN"
              value={form.vin}
              onChange={(event) => setForm((prev) => ({ ...prev, vin: event.target.value }))}
              placeholder="WBA12345678900000"
            />
            <Input
              label="Carburant"
              value={form.fuel}
              onChange={(event) => setForm((prev) => ({ ...prev, fuel: event.target.value }))}
              placeholder="SP98"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={submit}>{editing ? "Mettre a jour" : "Creer"}</Button>
            {editing ? (
              <Button variant="ghost" onClick={resetForm}>
                Annuler
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce vehicule"
        description="Le vehicule sera retire du parc. Les interventions liees resteront visibles."
        confirmLabel="Supprimer"
        confirmVariant="destructive"
        onConfirm={removeVehicle}
      />
    </div>
  );
}
