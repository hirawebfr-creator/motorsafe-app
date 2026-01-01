"use client";

import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useUser } from "@/components/user-context";
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

type GarageOption = { id: number; name: string; status: "PENDING" | "ACTIVE" | "REJECTED" };
type ClientItem = {
  id: number;
  firstName: string;
  lastName: string;
  garageId: number | null;
  garage?: { id: number; name: string } | null;
};

export default function ClientsPage() {
  const user = useUser();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [garages, setGarages] = useState<GarageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const toast = useToast();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    garageId: "",
  });
  const [editing, setEditing] = useState<ClientItem | null>(null);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<ClientItem[]>("/api/clients", { noStore: true });
      setClients(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  const loadGarages = async () => {
    if (user.role !== "ADMIN") return;
    try {
      const data = await fetcher<GarageOption[]>("/api/admin/garages", { noStore: true });
      setGarages(data ?? []);
    } catch {
      setGarages([]);
    }
  };

  useEffect(() => {
    loadClients();
    loadGarages();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const full = `${client.firstName} ${client.lastName}`.toLowerCase();
      const id = String(client.id);
      return full.includes(q) || id.includes(q);
    });
  }, [clients, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const visibleClients = filtered.slice(0, visibleCount);

  const startEdit = (client: ClientItem) => {
    setEditing(client);
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      garageId: client.garageId ? String(client.garageId) : "",
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ firstName: "", lastName: "", garageId: "" });
  };

  const submit = async () => {
    setError(null);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        garageId: form.garageId ? Number(form.garageId) : undefined,
      };

      await requestJson<ClientItem>(
        editing ? `/api/clients/${editing.id}` : "/api/clients",
        { method: editing ? "PUT" : "POST", body: payload }
      );
      toast.push({
        title: editing ? "Client mis a jour" : "Client cree",
        description: "Les informations sont enregistrees.",
        variant: "success",
      });
      resetForm();
      await loadClients();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const requestDelete = (clientId: number) => {
    setPendingDeleteId(clientId);
    setConfirmOpen(true);
  };

  const removeClient = async () => {
    if (!pendingDeleteId) return;
    try {
      await requestJson<boolean>(`/api/clients/${pendingDeleteId}`, { method: "DELETE" });
      toast.push({
        title: "Client supprime",
        description: "Le client a ete retire.",
        variant: "success",
      });
      await loadClients();
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
        title="Gestion des clients"
        description="Suivi des particuliers et professionnels rattachés à votre garage. Chaque client est associé à ses véhicules et interventions."
        level={1}
      />

      {/* Main content: Cards + Form */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Clients list as cards */}
        <div className="flex flex-col gap-5 relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par nom ou ID"
              className="w-full max-w-xs bg-[#15151f] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            <Tooltip content="Nombre de clients filtrés">
              <Badge variant="accent">{filtered.length} clients</Badge>
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
            <div className="text-center py-16 text-gray-500">
              <svg width="48" height="48" fill="none" className="mx-auto mb-4" viewBox="0 0 24 24"><path stroke="#A1A1AA" strokeWidth="1.5" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.582-5-8-5Z"/></svg>
              <p>Aucun client pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
              {visibleClients.map((client) => (
                <div
                  key={client.id}
                  className="bg-[#15151f] border border-[#242433] rounded-xl p-5 shadow-sm flex flex-col gap-2 hover:shadow-md transition animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">
                      {client.firstName} {client.lastName}
                    </h3>
                    <Tooltip content={`ID interne: ${client.id}`}>
                      <Badge variant="accent">ID #{client.id}</Badge>
                    </Tooltip>
                  </div>
                  {user.role === "ADMIN" && (
                    <p className="text-xs text-gray-400 mb-1">Garage : <span className="font-medium text-gray-300">{client.garage?.name ?? client.garageId ?? "-"}</span></p>
                  )}
                  <p className="text-xs text-gray-500">Ajouté <span title={client.id}>{getRelativeDate(client.id)}</span></p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(client)}>
                      Editer
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => requestDelete(client.id)}>
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
          <a href="#form" className="absolute bottom-6 right-6 bg-[var(--accent)] text-white rounded-full p-3 shadow-lg hover:scale-105 transition" title="Ajouter un client">
            <Plus size={20} />
          </a>
        </div>

        {/* Formulaire client */}
        <div className="bg-[#15151f] border border-[#242433] rounded-xl p-6 shadow-sm flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              {editing ? "Edition" : "Nouveau client"}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {editing ? "Modifier la fiche" : "Créer un client"}
            </h2>
          </div>
          <div className="grid gap-4">
            <Input
              label="Prénom"
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder="Jean"
              className="bg-[#23233a] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            <Input
              label="Nom"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              placeholder="Dupont"
              className="bg-[#23233a] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            {user.role === "ADMIN" ? (
              <Select
                label="Garage"
                value={form.garageId}
                onChange={(event) => setForm((prev) => ({ ...prev, garageId: event.target.value }))}
                className="bg-[#23233a] border border-[#242433] text-white rounded-lg px-4 py-2"
              >
                <option value="">Sélectionner un garage</option>
                {garages.map((garage) => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name} {garage.status === "ACTIVE" ? "" : "(en attente)"}
                  </option>
                ))}
              </Select>
            ) : null}
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
        title="Supprimer ce client"
        description="Cette action est définitive. Le client et ses données associées seront supprimés."
        confirmLabel="Supprimer"
        confirmVariant="destructive"
        onConfirm={removeClient}
      />
    </div>
  );
}
