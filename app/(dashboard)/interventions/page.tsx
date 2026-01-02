"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import { fetcher, requestJson } from "@/lib/fetcher";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { EmptyState } from "@/components/common/EmptyState";
import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";
import { useToast } from "@/components/ui/Toast";
import { Dialog } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";

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

type InterventionDetails = InterventionItem & {
  notes?: string | null;
  odometerKm?: string | null;
  ecuType?: string | null;
  softwareVersion?: string | null;
  checksum?: string | null;
  revisions?: Array<{ id: string; createdAt: string; hash?: string | null }>;
};

const INTERVENTION_TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function InterventionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const toast = useToast();

  const selectedFromUrl = searchParams.get("selected") || "";
  const [selectedId, setSelectedId] = useState<string | null>(selectedFromUrl || null);
  const [detail, setDetail] = useState<InterventionDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

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

  // Fetch interventions from API
  const loadInterventions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interventions");
      if (!res.ok) throw new Error("Erreur lors du chargement des interventions.");
      const data = await res.json();
      setInterventions(data?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles from API
  const loadVehicles = async () => {
    try {
      const res = await fetch("/api/vehicules");
      if (!res.ok) throw new Error("Erreur lors du chargement des véhicules.");
      const data = await res.json();
      setVehicles(data?.data ?? []);
    } catch (err) {
      setVehicles([]);
    }
  };

  useEffect(() => {
    loadInterventions();
    loadVehicles();
  }, []);

  useEffect(() => {
    setSelectedId(selectedFromUrl || null);
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
        const data = await fetcher<InterventionDetails>(`/api/interventions/${selectedId}`, {
          noStore: true,
        });
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
    if (!q) return interventions;
    return interventions.filter((item) => {
      const data = `${item.vehicle.plate} ${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.client.firstName} ${item.vehicle.client.lastName} ${item.type}`.toLowerCase();
      return data.includes(q);
    });
  }, [interventions, query]);

  const resetForm = () => {
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
  };

  const createIntervention = async () => {
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

      const created = await requestJson<InterventionItem>("/api/interventions", {
        method: "POST",
        body: payload,
        noStore: true,
      });

      toast.push({
        title: "Intervention créée",
        description: "Le dossier a été ajouté.",
        variant: "success",
      });

      setCreateOpen(false);
      resetForm();
      await loadInterventions();

      if (created?.id) {
        setSelectedId(created.id);
        router.replace(`/interventions?selected=${created.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Interventions"
        description="Suivi, dossiers et génération PDF."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, client, type"
            />
            <p className="mt-3 text-xs text-[color:var(--textMuted)]">
              {loading ? "Chargement…" : `${filtered.length} intervention(s)`}
            </p>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-[color:var(--textMuted)]">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Aucune intervention"
                  description="Créez une intervention pour démarrer."
                  action={<Button onClick={() => setCreateOpen(true)}>Créer une intervention</Button>}
                />
              </div>
            ) : (
              <div className="p-2">
                {filtered.map((item) => {
                  const isActive = selectedId === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={`/interventions/${item.id}`}
                      onClick={(e) => {
                        if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                          e.preventDefault();
                          setSelectedId(item.id);
                          router.replace(`/interventions?selected=${item.id}`);
                        }
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        isActive
                          ? "bg-[color:var(--surface2)] text-white border border-[color:var(--accent)]"
                          : "text-[color:var(--text)] hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.vehicle.plate} <span className="text-[color:var(--textMuted)]">· {item.type}</span>
                        </p>
                        <p className="truncate text-xs text-[color:var(--textMuted)]">
                          {item.vehicle.client.firstName} {item.vehicle.client.lastName} · {new Date(item.createdAt).toLocaleDateString("fr-FR")}
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
          <div className="border-b border-[color:var(--border)] p-4 flex items-start justify-between gap-3">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                {detail ? `${detail.vehicle.plate} · ${detail.type}` : "Sélectionnez une intervention"}
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
                <DropdownItem>
                  <a className="block" href={`/api/interventions/${detail.id}/pdf`} target="_blank" rel="noreferrer">
                    Télécharger PDF
                  </a>
                </DropdownItem>
                <DropdownItem>
                  <Link href={`/interventions/${detail.id}`}>Ouvrir le dossier complet</Link>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="p-4">
            {detailLoading ? (
              <div className="text-sm text-[color:var(--textMuted)]">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucune intervention sélectionnée"
                description="Choisissez une intervention dans la liste pour afficher son dossier."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{detail.vehicle.plate}</p>
                      <p className="mt-1 text-xs text-[color:var(--textMuted)]">
                        {detail.vehicle.brand} {detail.vehicle.model} · {detail.vehicle.client.firstName} {detail.vehicle.client.lastName}
                      </p>
                    </div>
                    <Badge variant="accent">{detail.type}</Badge>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-[color:var(--textMuted)]">
                    <p>Créée le {new Date(detail.createdAt).toLocaleString("fr-FR")}</p>
                    {detail.performedAt ? (
                      <p>Réalisée le {new Date(detail.performedAt).toLocaleString("fr-FR")}</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-sm font-semibold">Conformité</p>
                  <div className="mt-3">
                    <LegalReferencesPanel type={detail.type} />
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-sm font-semibold">Révisions</p>
                  <p className="mt-2 text-sm text-[color:var(--textMuted)]">
                    {detail.revisions && detail.revisions.length > 0
                      ? `${detail.revisions.length} révision(s) enregistrée(s).`
                      : "Aucune révision."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Créer une intervention"
        description="Ajoutez un dossier intervention rattaché à un véhicule."
        confirmLabel="Créer"
        confirmVariant="primary"
        onConfirm={createIntervention}
      >
        <div className="grid gap-4">
          <Select
            label="Véhicule"
            value={form.vehicleId}
            onChange={(event) => setForm((prev) => ({ ...prev, vehicleId: event.target.value }))}
          >
            <option value="">Sélectionner un véhicule</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.client.firstName} {v.client.lastName}
              </option>
            ))}
          </Select>

          <Select
            label="Type"
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
          >
            {INTERVENTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <Input
            label="Date réalisée"
            type="datetime-local"
            value={form.performedAt}
            onChange={(event) => setForm((prev) => ({ ...prev, performedAt: event.target.value }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kilométrage"
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Détails de l'intervention"
          />

          <LegalReferencesPanel type={form.type} />
        </div>
      </Dialog>
    </div>
  );
}

