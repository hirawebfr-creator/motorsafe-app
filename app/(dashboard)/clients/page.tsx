"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react";

import { useUser } from "@/components/user-context";
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

type GarageOption = { id: number; name: string; status: "PENDING" | "ACTIVE" | "REJECTED" };
type ClientItem = {
  id: number;
  firstName: string;
  lastName: string;
  garageId: number | null;
  garage?: { id: number; name: string } | null;
  createdAt: string;
};

export default function ClientsPage() {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [garages, setGarages] = useState<GarageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selectedFromUrl = Number(searchParams.get("selected") || "");
  const [selectedId, setSelectedId] = useState<number | null>(Number.isFinite(selectedFromUrl) ? selectedFromUrl : null);

  const [detail, setDetail] = useState<ClientItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const toast = useToast();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    garageId: "",
  });

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

  useEffect(() => {
    // keep selectedId in sync if URL changes
    if (!Number.isFinite(selectedFromUrl)) return;
    setSelectedId(selectedFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFromUrl]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const client = await fetcher<ClientItem>(`/api/clients/${selectedId}`, { noStore: true });
        setDetail(client);
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
    if (!q) return clients;
    return clients.filter((client) => {
      const full = `${client.firstName} ${client.lastName}`.toLowerCase();
      const id = String(client.id);
      return full.includes(q) || id.includes(q);
    });
  }, [clients, query]);

  const openCreate = () => {
    setEditorMode("create");
    setForm({ firstName: "", lastName: "", garageId: "" });
    setEditorOpen(true);
  };

  const openEdit = (client: ClientItem) => {
    setEditorMode("edit");
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      garageId: client.garageId ? String(client.garageId) : "",
    });
    setEditorOpen(true);
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
        editorMode === "edit" && detail ? `/api/clients/${detail.id}` : "/api/clients",
        { method: editorMode === "edit" ? "PUT" : "POST", body: payload }
      );
      toast.push({
        title: editorMode === "edit" ? "Client mis à jour" : "Client créé",
        description: "Les informations sont enregistrees.",
        variant: "success",
      });
      setEditorOpen(false);
      await loadClients();
      if (editorMode === "edit" && detail) {
        setSelectedId(detail.id);
      }
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
      if (selectedId === pendingDeleteId) {
        setSelectedId(null);
        router.replace("/clients");
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
        title="Clients"
        description="Liste, recherche et gestion des fiches clients."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Left: list */}
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par nom ou ID"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[color:var(--textMuted)]">
                {loading ? "Chargement…" : `${filtered.length} client(s)`}
              </p>
              {selectedId ? <Badge variant="accent">Sélectionné</Badge> : null}
            </div>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-[color:var(--textMuted)]">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Aucun client"
                  description="Créez un client pour démarrer."
                  action={<Button onClick={openCreate}>Créer un client</Button>}
                />
              </div>
            ) : (
              <div className="p-2">
                {filtered.map((client) => {
                  const isActive = selectedId === client.id;
                  return (
                    <Link
                      key={client.id}
                      href={`/clients/${client.id}`}
                      onClick={(e) => {
                        if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                          e.preventDefault();
                          setSelectedId(client.id);
                          router.replace(`/clients?selected=${client.id}`);
                        }
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        isActive
                          ? "bg-[rgba(139,92,246,0.14)] text-white"
                          : "text-[color:var(--text)] hover:bg-white/5"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        {user.role === "ADMIN" ? (
                          <p className="truncate text-xs text-[color:var(--textMuted)]">
                            {client.garage?.name ?? (client.garageId ? `Garage #${client.garageId}` : "-")}
                          </p>
                        ) : (
                          <p className="text-xs text-[color:var(--textMuted)]">ID #{client.id}</p>
                        )}
                      </div>
                      <span className="text-xs text-[color:var(--textMuted)]">#{client.id}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right: detail */}
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4 flex items-start justify-between gap-3">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                {detail ? `Client #${detail.id}` : "Sélectionnez un client"}
              </p>
            </div>

            {detail ? (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-white/5"
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
                  <span className="inline-flex items-center gap-2 text-[color:var(--danger)]"><Trash2 size={16} /> Supprimer</span>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="p-4">
            {detailLoading ? (
              <div className="text-sm text-[color:var(--textMuted)]">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucun client sélectionné"
                description="Choisissez un client dans la liste pour afficher sa fiche."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-4">
                  <p className="text-sm font-semibold">
                    {detail.firstName} {detail.lastName}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--textMuted)]">ID #{detail.id}</p>
                  {user.role === "ADMIN" ? (
                    <p className="mt-2 text-xs text-[color:var(--textMuted)]">
                      Garage: {detail.garage?.name ?? (detail.garageId ? `#${detail.garageId}` : "-")}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-sm font-semibold">Véhicules</p>
                  <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                    Disponible dans le dossier client.
                  </p>
                  <div className="mt-3">
                    <Link href="/vehicules">
                      <Button variant="secondary" size="sm">Voir les véhicules</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Create/Edit dialog */}
      <Dialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editorMode === "edit" ? "Modifier le client" : "Créer un client"}
        description={editorMode === "edit" ? "Mettez à jour les informations du client." : "Renseignez les informations du client."}
        confirmLabel={editorMode === "edit" ? "Mettre à jour" : "Créer"}
        confirmVariant="primary"
        onConfirm={submit}
      >
        <div className="grid gap-4">
          <Input
            label="Prénom"
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
              <option value="">Sélectionner un garage</option>
              {garages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name} {garage.status === "ACTIVE" ? "" : "(en attente)"}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce client"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        confirmVariant="destructive"
        onConfirm={removeClient}
      />
    </div>
  );
}
