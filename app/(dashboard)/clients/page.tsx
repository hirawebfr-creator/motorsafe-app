"use client";

import { useEffect, useMemo, useState } from "react";
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

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Clients</p>
        <h1 className="mt-3 text-3xl font-semibold">Gestion des clients</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Suivi des particuliers et professionnels rattaches a votre garage. Chaque client est
          associe a ses vehicules et interventions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par nom ou ID"
            />
            <Badge variant="accent">{filtered.length} clients</Badge>
          </div>

          {error ? <ErrorBanner message={error} /> : null}

          <DataTable stickyHeader>
            <DataTableHead sticky>
              <tr>
                <th className="px-5 py-4">Client</th>
                {user.role === "ADMIN" ? <th className="px-5 py-4">Garage</th> : null}
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </DataTableHead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-6" colSpan={user.role === "ADMIN" ? 3 : 2}>
                    <Loading />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6" colSpan={user.role === "ADMIN" ? 3 : 2}>
                    <EmptyState title="Aucun client" description="Ajoutez votre premier client." />
                  </td>
                </tr>
              ) : (
                visibleClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-t border-[rgba(31,41,55,0.7)] transition hover:bg-[rgba(139,92,246,0.06)]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-[var(--muted)]">ID #{client.id}</p>
                    </td>
                    {user.role === "ADMIN" ? (
                      <td className="px-5 py-4 text-sm text-[var(--muted)]">
                        {client.garage?.name ?? client.garageId ?? "-"}
                      </td>
                    ) : null}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(client)}>
                          Editer
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => requestDelete(client.id)}>
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
              {editing ? "Edition" : "Nouveau client"}
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {editing ? "Modifier la fiche" : "Creer un client"}
            </h2>
          </div>

          <div className="grid gap-4">
            <Input
              label="Prenom"
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder="Jean"
            />
            <Input
              label="Nom"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              placeholder="Dupont"
            />
            {user.role === "ADMIN" ? (
              <Select
                label="Garage"
                value={form.garageId}
                onChange={(event) => setForm((prev) => ({ ...prev, garageId: event.target.value }))}
              >
                <option value="">Selectionner un garage</option>
                {garages.map((garage) => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name} {garage.status === "ACTIVE" ? "" : "(en attente)"}
                  </option>
                ))}
              </Select>
            ) : null}
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
        title="Supprimer ce client"
        description="Cette action est definitive. Le client et ses donnees associees seront supprimes."
        confirmLabel="Supprimer"
        confirmVariant="destructive"
        onConfirm={removeClient}
      />
    </div>
  );
}
