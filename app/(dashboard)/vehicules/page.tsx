"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { fetcher, requestJson } from "@/lib/fetcher";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { useToast } from "@/components/ui/Toast";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { EmptyState } from "@/components/common/EmptyState";

type ClientOption = { id: number; firstName: string; lastName: string };

type VehicleItem = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  createdAt?: string;
  client: ClientOption;
};

type VehicleDetails = VehicleItem & {
  interventions?: Array<{ id: string; type: string; createdAt: string }>
};

export default function VehiculesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qFromUrl = searchParams.get("q") || "";
  const [query, setQuery] = useState(qFromUrl);

  const selectedFromUrl = searchParams.get("selected") || "";
  const [selectedId, setSelectedId] = useState<string | null>(selectedFromUrl || null);
  const [detail, setDetail] = useState<VehicleDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const toast = useToast();

  const [form, setForm] = useState({
    clientId: "",
    brand: "",
    model: "",
    plate: "",
    vin: "",
    fuel: "",
  });

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

  useEffect(() => {
    setSelectedId(selectedFromUrl || null);
  }, [selectedFromUrl]);

  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const data = await fetcher<VehicleDetails>(`/api/vehicules/${selectedId}`, { noStore: true });
        setDetail(data);
      } catch (err) {
        setDetail(null);
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((vehicle) => {
      const data = `${vehicle.plate} ${vehicle.brand} ${vehicle.model} ${vehicle.client.firstName} ${vehicle.client.lastName}`.toLowerCase();
      return data.includes(q);
    });
  }, [vehicles, query]);

  const openCreate = () => {
    setEditorMode("create");
    setForm({ clientId: "", brand: "", model: "", plate: "", vin: "", fuel: "" });
    setEditorOpen(true);
  };

  const openEdit = (vehicle: VehicleDetails) => {
    setEditorMode("edit");
    setForm({
      clientId: String(vehicle.client.id),
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      vin: vehicle.vin ?? "",
      fuel: vehicle.fuel ?? "",
    });
    setEditorOpen(true);
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

      if (editorMode === "edit" && detail) {
        await requestJson<VehicleItem>(`/api/vehicules/${detail.id}`, { method: "PUT", body: payload });
      } else {
        await requestJson<VehicleItem>("/api/vehicules", { method: "POST", body: payload });
      }
      toast.push({
        title: editorMode === "edit" ? "Véhicule mis à jour" : "Véhicule créé",
        description: "Les informations sont enregistrées.",
        variant: "success",
      });
      setEditorOpen(false);
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
        title: "Véhicule supprimé",
        description: "Le véhicule a été retiré.",
        variant: "success",
      });
      await loadVehicles();
      if (selectedId === pendingDeleteId) {
        setSelectedId(null);
        router.replace("/vehicules");
      }
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
    <div className="grid gap-6">
      <SectionHeader
        title="Véhicules"
        description="Parc véhicule, recherche et accès aux dossiers."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, marque, client"
            />
            <p className="mt-3 text-xs text-muted2">
              {loading ? "Chargement…" : `${filtered.length} véhicule(s)`}
            </p>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted2">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Aucun véhicule"
                  description="Créez un véhicule pour démarrer."
                  action={<Button onClick={openCreate}>Créer un véhicule</Button>}
                />
              </div>
            ) : (
              <div className="p-2">
                {filtered.map((vehicle) => {
                  const isActive = selectedId === vehicle.id;
                  return (
                    <Link
                      key={vehicle.id}
                      href={`/vehicules/${vehicle.id}`}
                      onClick={(e) => {
                        if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                          e.preventDefault();
                          setSelectedId(vehicle.id);
                          router.replace(`/vehicules?selected=${vehicle.id}`);
                        }
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        isActive
                          ? "bg-surface2 text-text border border-primary"
                          : "text-text hover:bg-surface2 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{vehicle.plate}</p>
                        <p className="truncate text-xs text-muted2">
                          {vehicle.brand} {vehicle.model} · {vehicle.client.firstName} {vehicle.client.lastName}
                        </p>
                      </div>
                      <Badge variant="accent">Dossier</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border p-4 flex items-start justify-between gap-3">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-muted2">
                {detail ? detail.plate : "Sélectionnez un véhicule"}
              </p>
            </div>

            {detail ? (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface2"
                    aria-label="Actions"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                }
              >
                <DropdownItem onClick={() => openEdit(detail)}>
                  <span className="inline-flex items-center gap-2"><Pencil size={16} /> Modifier</span>
                </DropdownItem>
                <DropdownItem onClick={() => requestDelete(detail.id)}>
                  <span className="inline-flex items-center gap-2 text-danger"><Trash2 size={16} /> Supprimer</span>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="p-4">
            {detailLoading ? (
              <div className="text-sm text-muted2">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucun véhicule sélectionné"
                description="Choisissez un véhicule dans la liste pour afficher son dossier."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-border bg-surface2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{detail.plate}</p>
                      <p className="mt-1 text-xs text-muted2">
                        {detail.brand} {detail.model}
                      </p>
                    </div>
                    <Badge variant="accent">{detail.fuel ?? "-"}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted2">
                    Client: <span className="text-text">{detail.client.firstName} {detail.client.lastName}</span>
                  </p>
                  {detail.vin ? (
                    <p className="mt-1 text-xs text-muted2">VIN: {detail.vin}</p>
                  ) : null}
                  <div className="mt-4">
                    <Link href={`/vehicules/${detail.id}`}>
                      <Button variant="secondary" size="sm">Ouvrir le dossier complet</Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-border bg-surface p-4">
                  <p className="text-sm font-semibold">Interventions récentes</p>
                  <div className="mt-3 grid gap-2">
                    {!detail.interventions || detail.interventions.length === 0 ? (
                      <p className="text-sm text-muted2">Aucune intervention.</p>
                    ) : (
                      detail.interventions.slice(0, 5).map((i) => (
                        <Link
                          key={i.id}
                          href={`/interventions/${i.id}`}
                          className="flex items-center justify-between rounded-xl border border-border bg-surface2 px-3 py-2 text-sm hover:bg-surface"
                        >
                          <span className="font-medium">{i.type}</span>
                          <span className="text-xs text-muted2">
                            {new Date(i.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editorMode === "edit" ? "Modifier le véhicule" : "Créer un véhicule"}
        description={editorMode === "edit" ? "Mettez à jour la fiche véhicule." : "Renseignez les informations du véhicule."}
        confirmLabel={editorMode === "edit" ? "Mettre à jour" : "Créer"}
        confirmVariant="primary"
        onConfirm={submit}
      >
        <div className="grid gap-4">
          <Select
            label="Client"
            value={form.clientId}
            onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Marque"
              value={form.brand}
              onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              placeholder="BMW"
            />
            <Input
              label="Modèle"
              value={form.model}
              onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
              placeholder="Série 1"
            />
          </div>

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
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce véhicule"
        description="Le véhicule sera retiré du parc."
        confirmLabel="Supprimer"
        confirmVariant="destructive"
        onConfirm={removeVehicle}
      />
    </div>
  );
}
