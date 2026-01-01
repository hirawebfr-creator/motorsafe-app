"use client";

import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SectionHeader } from "@/components/ui/SectionHeader";
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

  // Helper for relative date
  const getRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Header section premium */}
      <SectionHeader
        title="Parc véhicule"
        description="Chaque véhicule est rattaché à un client. Accédez au dossier complet pour les interventions et le PDF."
        level={1}
      />

      {/* Main content: Cards + Form */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Liste véhicules en cartes */}
        <div className="flex flex-col gap-5 relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, marque, client"
              className="w-full max-w-xs bg-[#15151f] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            <Tooltip content="Nombre de véhicules filtrés">
              <Badge variant="accent">{filtered.length} véhicules</Badge>
            </Tooltip>
          </div>
          {error ? <ErrorBanner message={error} /> : null}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Aucun véhicule" description="Aucun véhicule n'a été ajouté pour l'instant." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
              {visibleVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="card p-5 flex flex-col gap-2 hover:shadow-card transition group animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg tracking-wide text-[var(--text)] group-hover:text-[var(--accent)] transition">
                      {vehicle.plate}
                    </h3>
                    <Tooltip content={`${vehicle.brand} ${vehicle.model}`}>
                      <Badge variant="accent">{vehicle.brand} {vehicle.model}</Badge>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-1">Client : <span className="font-medium text-[var(--text)]">{vehicle.client.firstName} {vehicle.client.lastName}</span></p>
                  {vehicle.vin && (
                    <p className="text-xs text-[var(--muted)]">VIN : <span className="text-[var(--muted)]">{vehicle.vin}</span></p>
                  )}
                  {vehicle.fuel && (
                    <p className="text-xs text-[var(--muted)]">Carburant : <span className="text-[var(--accent)]">{vehicle.fuel}</span></p>
                  )}
                  <p className="text-xs text-gray-500">Ajouté <span title={vehicle.id}>{getRelativeDate(vehicle.id)}</span></p>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/vehicules/${vehicle.id}`} className="btn bg-transparent text-[var(--accent)] hover:bg-[var(--accent)]/10 font-medium px-3 py-1 min-h-0 h-9 text-sm">
                      Ouvrir dossier
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(vehicle)}>
                      Editer
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => requestDelete(vehicle.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filtered.length > visibleCount ? (
            <div className="flex justify-center mt-4">
              <Button variant="ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Afficher plus
              </Button>
            </div>
          ) : null}
          {/* Floating add button */}
          <a href="#form" className="absolute bottom-6 right-6 bg-[var(--accent)] text-white rounded-full p-3 shadow-lg hover:scale-105 transition" title="Ajouter un véhicule">
            <Plus size={20} />
          </a>
        </div>

        {/* Formulaire véhicule */}
        <div className="bg-[#15151f] border border-[#242433] rounded-xl p-6 shadow-sm flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              {editing ? "Edition" : "Nouveau véhicule"}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {editing ? "Modifier le véhicule" : "Créer un véhicule"}
            </h2>
          </div>
          <div className="grid gap-4">
            <Select
              label="Client"
              value={form.clientId}
              onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
              className="bg-[#23233a] border border-[#242433] text-white rounded-lg px-4 py-2"
            >
              <option value="">Sélectionner un client</option>
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
              className="bg-[#23233a] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            <Input
              label="Modèle"
              value={form.model}
              onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
              placeholder="Série 1"
              className="bg-[#23233a] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            <Input
              label="Immatriculation"
              value={form.plate}
              onChange={(event) => setForm((prev) => ({ ...prev, plate: event.target.value }))}
              placeholder="AB-123-CD"
              className="bg-[#23233a] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            <Input
              label="VIN"
              value={form.vin}
              onChange={(event) => setForm((prev) => ({ ...prev, vin: event.target.value }))}
              placeholder="WBA12345678900000"
              className="bg-[#23233a] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            <Input
              label="Carburant"
              value={form.fuel}
              onChange={(event) => setForm((prev) => ({ ...prev, fuel: event.target.value }))}
              placeholder="SP98"
              className="bg-[#23233a] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button onClick={submit}>{editing ? "Mettre à jour" : "Créer"}</Button>
            {editing ? (
              <Button variant="ghost" onClick={resetForm}>
                Annuler
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {/* Dialog de suppression */}
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce véhicule"
        description="Le véhicule sera retiré du parc. Les interventions liées resteront visibles."
        confirmLabel="Supprimer"
        confirmVariant="destructive"
        onConfirm={removeVehicle}
      />
    </div>
  );
}
