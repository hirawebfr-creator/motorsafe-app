"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";

type ClientLite = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  year?: number | null;
  engine?: string | null;
  createdAt?: string;
  updatedAt?: string;
  clientId: number;
  client?: ClientLite | null;
};

type VehicleUpdate = {
  clientId: number;
  brand: string;
  model: string;
  plate: string;
  vin?: string;
  fuel?: string;
  engine?: string;
  year?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapOk(json: unknown): unknown {
  if (isRecord(json) && json.ok === true && "data" in json) return json.data;
  return json;
}

function pickArray(json: unknown): unknown[] {
  const data = unwrapOk(json);
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  if (isRecord(data) && Array.isArray(data.data)) return data.data;
  return [];
}

export default function EditVehiculePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const [clientQuery, setClientQuery] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientOptions, setClientOptions] = useState<ClientLite[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientLite | null>(null);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [fuel, setFuel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");

  const debounceRef = useRef<number | null>(null);

  async function loadVehicle() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/vehicules/${id}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message || json?.error || `GET /api/vehicules/${id} ${res.status}`;
        throw new Error(message);
      }
      const data = unwrapOk(json) as Vehicle;
      setVehicle(data);

      setBrand(data?.brand ?? "");
      setModel(data?.model ?? "");
      setPlate(data?.plate ?? "");
      setVin(data?.vin ?? "");
      setFuel(data?.fuel ?? "");
      setYear(data?.year != null ? String(data.year) : "");
      setEngine(data?.engine ?? "");
      setSelectedClient(data?.client ?? null);
    } catch (e) {
      setVehicle(null);
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function loadClients(q: string) {
    try {
      setClientLoading(true);
      const url = new URL("/api/clients", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "20");
      if (q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message || json?.error || `GET /api/clients ${res.status}`;
        throw new Error(message);
      }
      setClientOptions(pickArray(json) as ClientLite[]);
    } catch {
      setClientOptions([]);
    } finally {
      setClientLoading(false);
    }
  }

  useEffect(() => {
    void loadVehicle();
    void loadClients("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void loadClients(clientQuery);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [clientQuery]);

  const selectedClientLabel = useMemo(() => {
    if (!selectedClient) return "Aucun client sélectionné";
    const name = `${selectedClient.firstName} ${selectedClient.lastName}`.trim();
    return [name, selectedClient.email].filter(Boolean).join(" • ");
  }, [selectedClient]);

  const canSave = useMemo(() => {
    return Boolean(selectedClient?.id) && brand.trim() && model.trim() && plate.trim();
  }, [selectedClient?.id, brand, model, plate]);

  async function onSave() {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);

      if (!selectedClient?.id) throw new Error("Sélectionnez un client.");
      if (!brand.trim()) throw new Error("La marque est obligatoire.");
      if (!model.trim()) throw new Error("Le modèle est obligatoire.");
      if (!plate.trim()) throw new Error("L'immatriculation est obligatoire.");

      const payload: VehicleUpdate = {
        clientId: selectedClient.id,
        brand: brand.trim(),
        model: model.trim(),
        plate: plate.trim(),
        vin,
        fuel,
        engine,
        year: year.trim() ? Number(year) : undefined,
      };

      const res = await fetch(`/api/vehicules/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message || json?.error || `PUT /api/vehicules/${id} ${res.status}`;
        throw new Error(message);
      }

      await loadVehicle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!id) return;
    const ok = window.confirm("Supprimer ce véhicule ? Cette action est irréversible.");
    if (!ok) return;
    try {
      setDeleting(true);
      setError(null);
      const res = await fetch(`/api/vehicules/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message || json?.error || `DELETE /api/vehicules/${id} ${res.status}`;
        throw new Error(message);
      }
      router.push("/vehicules");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative h-[1016px] w-[1162px] overflow-hidden bg-[#F7F7F8]">
      <div className="absolute left-0 top-[5px] text-[24px] font-bold text-black">Modifier véhicule</div>

      <div className="absolute right-0 top-0 flex items-center gap-3">
        <Link
          href="/vehicules"
          className="grid place-items-center rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-4 text-[14px] font-semibold"
          style={{ height: 40, color: "#030229" }}
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || saving}
          className="grid place-items-center rounded-[10px] px-5 text-[14px] font-semibold text-white disabled:opacity-60"
          style={{ height: 40, background: "#605BFF" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {loading ? (
        <div className="absolute left-0 top-[70px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-6 text-sm text-[#030229]/70">
          Chargement…
        </div>
      ) : !vehicle ? (
        <div className="absolute left-0 top-[70px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-6 text-sm text-[#030229]/70">
          Véhicule introuvable.
        </div>
      ) : (
        <>
          <div className="absolute left-0 top-[70px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                  Véhicule
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: "#030229" }}>
                  {vehicle.plate} • {vehicle.brand} {vehicle.model}
                </div>
              </div>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-4 text-[14px] font-semibold disabled:opacity-60"
                style={{ height: 40, color: "#D11A2A" }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          <div className="absolute left-0 top-[170px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-5">
            <div className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
              Client
            </div>

            <div
              className="mt-2 relative rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white"
              style={{ height: 40 }}
            >
              <div className="absolute left-[16px] top-[11px] opacity-50">
                <Search size={16} />
              </div>
              <input
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Rechercher un client (nom, email…)"
                className="absolute left-[38px] top-0 h-[40px] w-[calc(100%-48px)] bg-transparent text-[12px] outline-none"
                style={{ color: "#030229" }}
              />
            </div>

            <div className="mt-2 text-[12px]" style={{ color: "#030229", opacity: 0.6 }}>
              {clientLoading ? "Chargement…" : selectedClientLabel}
            </div>

            <div className="mt-3 max-h-[140px] overflow-y-auto rounded-[10px] border border-[rgba(3,2,41,0.08)]">
              {clientOptions.length === 0 ? (
                <div className="px-4 py-3 text-[12px]" style={{ color: "#030229", opacity: 0.6 }}>
                  Aucun résultat.
                </div>
              ) : (
                clientOptions.map((c) => {
                  const name = `${c.firstName} ${c.lastName}`.trim();
                  const secondary = [c.email, c.phone].filter(Boolean).join(" • ");
                  const active = selectedClient?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClient(c)}
                      className="w-full px-4 py-3 text-left hover:bg-[#F7F7F8]"
                      style={{ background: active ? "#F7F7F8" : "transparent" }}
                    >
                      <div className="text-[14px] font-semibold" style={{ color: "#030229" }}>
                        {name || `Client #${c.id}`}
                      </div>
                      <div className="text-[12px]" style={{ color: "#030229", opacity: 0.6 }}>
                        {secondary}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="absolute left-0 top-[395px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-5">
            <div className="grid grid-cols-2 gap-6">
              <label className="grid gap-2">
                <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                  Marque
                </span>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                  style={{ color: "#030229" }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                  Modèle
                </span>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                  style={{ color: "#030229" }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                  Immatriculation
                </span>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                  style={{ color: "#030229" }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                  VIN (optionnel)
                </span>
                <input
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                  style={{ color: "#030229" }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                  Carburant (optionnel)
                </span>
                <input
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                  className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                  style={{ color: "#030229" }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                  Année (optionnel)
                </span>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  inputMode="numeric"
                  className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                  style={{ color: "#030229" }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                  Moteur (optionnel)
                </span>
                <input
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                  style={{ color: "#030229" }}
                />
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-[10px] border border-[rgba(209,26,42,0.25)] bg-[rgba(209,26,42,0.06)] px-4 py-3 text-sm" style={{ color: "#D11A2A" }}>
                {error}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

/*
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";
import { SectionHeader } from "@/components/ui/SectionHeader";

type VehicleDetails = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  client: { id: number; firstName: string; lastName: string };
  interventions: Array<{
    id: string;
    type: string;
    notes?: string | null;
    createdAt: string;
    performedAt?: string | null;
  }>;
};

const INTERVENTION_TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function VehiculeDetailPage() {
  const params = useParams();
  const vehicleId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "E85",
    notes: "",
    performedAt: "",
    odometerKm: "",
    ecuType: "",
    softwareVersion: "",
    checksum: "",
  });

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<VehicleDetails>(`/api/vehicules/${vehicleId}`, {
        noStore: true,
      });
      setVehicle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const createIntervention = async () => {
    if (!vehicleId) return;
    setError(null);
    try {
      const payload = {
        vehicleId,
        type: form.type,
        notes: form.notes || null,
        performedAt: form.performedAt || null,
        odometerKm: form.odometerKm || null,
        ecuType: form.ecuType || null,
        softwareVersion: form.softwareVersion || null,
        checksum: form.checksum || null,
      };
      await requestJson("/api/interventions", { method: "POST", body: payload });
      setForm({
        type: "E85",
        notes: "",
        performedAt: "",
        odometerKm: "",
        ecuType: "",
        softwareVersion: "",
        checksum: "",
      });
      await loadVehicle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    }
  };

  return (
    <div className="grid gap-8">
      <SectionHeader
        title={vehicle ? vehicle.plate : "Véhicule"}
        description="Dossier véhicule et historique des interventions."
        action={
          <Link href="/vehicules">
            <Button variant="secondary" size="sm">Retour</Button>
          </Link>
        }
        level={1}
      />

      {vehicle ? (
        <div className="-mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{vehicle.brand} {vehicle.model}</Badge>
          <Badge variant="neutral">Client: {vehicle.client.firstName} {vehicle.client.lastName}</Badge>
          <Badge variant="neutral">{vehicle.interventions.length} intervention(s)</Badge>
          <Badge variant="neutral">Carburant: {vehicle.fuel || "-"}</Badge>
        </div>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Loading />
      ) : vehicle ? (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-8">
            <Card className="p-0 overflow-hidden">
              <div className="ms-cardHeader flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="ms-kicker">Véhicule</p>
                  <h2 className="mt-2 text-xl font-semibold text-text">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <p className="text-sm text-muted2">
                    Client: {vehicle.client.firstName} {vehicle.client.lastName}
                  </p>
                </div>
                <Badge variant="accent">{vehicle.plate}</Badge>
              </div>
              <div className="ms-cardBody grid gap-3 text-sm text-muted2">
                <p>VIN: {vehicle.vin || "-"}</p>
                <p>Carburant: {vehicle.fuel || "-"}</p>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="ms-cardHeader flex items-center justify-between">
                <div>
                  <p className="ms-kicker">Interventions</p>
                  <h2 className="mt-2 text-xl font-semibold text-text">Historique</h2>
                </div>
                <Badge variant="accent">{vehicle.interventions.length}</Badge>
              </div>
              <div className="ms-cardBody grid gap-4">
                {vehicle.interventions.length === 0 ? (
                  <p className="text-sm text-muted2">Aucune intervention.</p>
                ) : (
                  vehicle.interventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface2 px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text">{intervention.type}</p>
                        <p className="text-xs text-muted2">
                          {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Link
                          href={`/interventions/${intervention.id}`}
                          className="font-semibold text-primary hover:text-primaryHover"
                        >
                          Détails
                        </Link>
                        <a
                          href={`/api/interventions/${intervention.id}/pdf`}
                          className="font-semibold text-primary hover:text-primaryHover"
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="grid gap-5">
            <div>
              <p className="ms-kicker">Nouvelle intervention</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Ajouter un dossier</h2>
            </div>
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
            "use client";

            import Link from "next/link";
            import { useEffect, useMemo, useRef, useState } from "react";
            import { useParams, useRouter } from "next/navigation";
            import { Search, Trash2 } from "lucide-react";

            type ClientLite = {
              id: number;
              firstName: string;
              lastName: string;
              email?: string | null;
              phone?: string | null;
            };

            type Vehicle = {
              id: string;
              brand: string;
              model: string;
              plate: string;
              vin?: string | null;
              fuel?: string | null;
              year?: number | null;
              engine?: string | null;
              createdAt?: string;
              updatedAt?: string;
              clientId: number;
              client?: ClientLite | null;
            };

            function unwrapOk(json: any) {
              if (json && typeof json === "object" && json.ok === true && "data" in json) return json.data;
              return json;
            }

            function pickArray(json: any): any[] {
              const data = unwrapOk(json);
              if (Array.isArray(data)) return data;
              if (Array.isArray(data?.items)) return data.items;
              if (Array.isArray(data?.data)) return data.data;
              return [];
            }

            export default function EditVehiculePage() {
              const params = useParams<{ id: string }>();
              const router = useRouter();
              const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

              const [loading, setLoading] = useState(true);
              const [saving, setSaving] = useState(false);
              const [deleting, setDeleting] = useState(false);
              const [error, setError] = useState<string | null>(null);

              const [vehicle, setVehicle] = useState<Vehicle | null>(null);

              const [clientQuery, setClientQuery] = useState("");
              const [clientLoading, setClientLoading] = useState(false);
              const [clientOptions, setClientOptions] = useState<ClientLite[]>([]);
              const [selectedClient, setSelectedClient] = useState<ClientLite | null>(null);

              const [brand, setBrand] = useState("");
              const [model, setModel] = useState("");
              const [plate, setPlate] = useState("");
              const [vin, setVin] = useState("");
              const [fuel, setFuel] = useState("");
              const [year, setYear] = useState("");
              const [engine, setEngine] = useState("");

              const debounceRef = useRef<number | null>(null);

              async function loadVehicle() {
                if (!id) return;
                try {
                  setLoading(true);
                  setError(null);
                  const res = await fetch(`/api/vehicules/${id}`, { cache: "no-store" });
                  const json = await res.json().catch(() => null);
                  if (!res.ok) {
                    const message = json?.error?.message || json?.error || `GET /api/vehicules/${id} ${res.status}`;
                    throw new Error(message);
                  }
                  const data = unwrapOk(json) as Vehicle;
                  setVehicle(data);

                  setBrand(data?.brand ?? "");
                  setModel(data?.model ?? "");
                  setPlate(data?.plate ?? "");
                  setVin(data?.vin ?? "");
                  setFuel(data?.fuel ?? "");
                  setYear(data?.year != null ? String(data.year) : "");
                  setEngine(data?.engine ?? "");
                  setSelectedClient(data?.client ?? null);
                } catch (e) {
                  setVehicle(null);
                  setError(e instanceof Error ? e.message : "Erreur inconnue");
                } finally {
                  setLoading(false);
                }
              }

              async function loadClients(q: string) {
                try {
                  setClientLoading(true);
                  const url = new URL("/api/clients", window.location.origin);
                  url.searchParams.set("page", "1");
                  url.searchParams.set("pageSize", "20");
                  if (q.trim()) url.searchParams.set("q", q.trim());

                  const res = await fetch(url.toString(), { cache: "no-store" });
                  const json = await res.json().catch(() => null);
                  if (!res.ok) {
                    const message = json?.error?.message || json?.error || `GET /api/clients ${res.status}`;
                    throw new Error(message);
                  }
                  setClientOptions(pickArray(json) as ClientLite[]);
                } catch {
                  setClientOptions([]);
                } finally {
                  setClientLoading(false);
                }
              }

              useEffect(() => {
                void loadVehicle();
                void loadClients("");
                // eslint-disable-next-line react-hooks/exhaustive-deps
              }, [id]);

              useEffect(() => {
                if (debounceRef.current) window.clearTimeout(debounceRef.current);
                debounceRef.current = window.setTimeout(() => {
                  void loadClients(clientQuery);
                }, 250);

                return () => {
                  if (debounceRef.current) window.clearTimeout(debounceRef.current);
                };
              }, [clientQuery]);

              const selectedClientLabel = useMemo(() => {
                if (!selectedClient) return "Aucun client sélectionné";
                const name = `${selectedClient.firstName} ${selectedClient.lastName}`.trim();
                return [name, selectedClient.email].filter(Boolean).join(" • ");
              }, [selectedClient]);

              const canSave = useMemo(() => {
                return Boolean(selectedClient?.id) && brand.trim() && model.trim() && plate.trim();
              }, [selectedClient?.id, brand, model, plate]);

              async function onSave() {
                if (!id) return;
                try {
                  setSaving(true);
                  setError(null);

                  if (!selectedClient?.id) throw new Error("Sélectionnez un client.");
                  if (!brand.trim()) throw new Error("La marque est obligatoire.");
                  if (!model.trim()) throw new Error("Le modèle est obligatoire.");
                  if (!plate.trim()) throw new Error("L'immatriculation est obligatoire.");

                  const payload: any = {
                    clientId: selectedClient.id,
                    brand: brand.trim(),
                    model: model.trim(),
                    plate: plate.trim(),
                    vin,
                    fuel,
                    engine,
                    year: year.trim() ? Number(year) : undefined,
                  };

                  const res = await fetch(`/api/vehicules/${id}`, {
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const json = await res.json().catch(() => null);
                  if (!res.ok) {
                    const message = json?.error?.message || json?.error || `PUT /api/vehicules/${id} ${res.status}`;
                    throw new Error(message);
                  }

                  await loadVehicle();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Erreur inconnue");
                } finally {
                  setSaving(false);
                }
              }

              async function onDelete() {
                if (!id) return;
                const ok = window.confirm("Supprimer ce véhicule ? Cette action est irréversible.");
                if (!ok) return;
                try {
                  setDeleting(true);
                  setError(null);
                  const res = await fetch(`/api/vehicules/${id}`, { method: "DELETE" });
                  const json = await res.json().catch(() => null);
                  if (!res.ok) {
                    const message = json?.error?.message || json?.error || `DELETE /api/vehicules/${id} ${res.status}`;
                    throw new Error(message);
                  }
                  router.push("/vehicules");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Erreur inconnue");
                } finally {
                  setDeleting(false);
                }
              }

              return (
                <div className="relative h-[1016px] w-[1162px] overflow-hidden bg-[#F7F7F8]">
                  <div className="absolute left-0 top-[5px] text-[24px] font-bold text-black">Modifier véhicule</div>

                  <div className="absolute right-0 top-0 flex items-center gap-3">
                    <Link
                      href="/vehicules"
                      className="grid place-items-center rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-4 text-[14px] font-semibold"
                      style={{ height: 40, color: "#030229" }}
                    >
                      Cancel
                    </Link>
                    <button
                      type="button"
                      onClick={onSave}
                      disabled={!canSave || saving}
                      className="grid place-items-center rounded-[10px] px-5 text-[14px] font-semibold text-white disabled:opacity-60"
                      style={{ height: 40, background: "#605BFF" }}
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>

                  {loading ? (
                    <div className="absolute left-0 top-[70px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-6 text-sm text-[#030229]/70">
                      Chargement…
                    </div>
                  ) : !vehicle ? (
                    <div className="absolute left-0 top-[70px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-6 text-sm text-[#030229]/70">
                      Véhicule introuvable.
                    </div>
                  ) : (
                    <>
                      <div className="absolute left-0 top-[70px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-5">
                        <div className="flex items-start justify-between gap-6">
                          <div>
                            <div className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                              Véhicule
                            </div>
                            <div className="mt-1 text-[14px] font-semibold" style={{ color: "#030229" }}>
                              {vehicle.plate} • {vehicle.brand} {vehicle.model}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={onDelete}
                            disabled={deleting}
                            className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-4 text-[14px] font-semibold disabled:opacity-60"
                            style={{ height: 40, color: "#D11A2A" }}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="absolute left-0 top-[170px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-5">
                        <div className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                          Client
                        </div>

                        <div
                          className="mt-2 relative rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white"
                          style={{ height: 40 }}
                        >
                          <div className="absolute left-[16px] top-[11px] opacity-50">
                            <Search size={16} />
                          </div>
                          <input
                            value={clientQuery}
                            onChange={(e) => setClientQuery(e.target.value)}
                            placeholder="Rechercher un client (nom, email…)"
                            className="absolute left-[38px] top-0 h-[40px] w-[calc(100%-48px)] bg-transparent text-[12px] outline-none"
                            style={{ color: "#030229" }}
                          />
                        </div>

                        <div className="mt-2 text-[12px]" style={{ color: "#030229", opacity: 0.6 }}>
                          {clientLoading ? "Chargement…" : selectedClientLabel}
                        </div>

                        <div className="mt-3 max-h-[140px] overflow-y-auto rounded-[10px] border border-[rgba(3,2,41,0.08)]">
                          {clientOptions.length === 0 ? (
                            <div className="px-4 py-3 text-[12px]" style={{ color: "#030229", opacity: 0.6 }}>
                              Aucun résultat.
                            </div>
                          ) : (
                            clientOptions.map((c) => {
                              const name = `${c.firstName} ${c.lastName}`.trim();
                              const secondary = [c.email, c.phone].filter(Boolean).join(" • ");
                              const active = selectedClient?.id === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setSelectedClient(c)}
                                  className="w-full px-4 py-3 text-left hover:bg-[#F7F7F8]"
                                  style={{ background: active ? "#F7F7F8" : "transparent" }}
                                >
                                  <div className="text-[14px] font-semibold" style={{ color: "#030229" }}>
                                    {name || `Client #${c.id}`}
                                  </div>
                                  <div className="text-[12px]" style={{ color: "#030229", opacity: 0.6 }}>
                                    {secondary}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="absolute left-0 top-[395px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-5">
                        <div className="grid grid-cols-2 gap-6">
                          <label className="grid gap-2">
                            <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                              Marque
                            </span>
                            <input
                              value={brand}
                              onChange={(e) => setBrand(e.target.value)}
                              className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                              style={{ color: "#030229" }}
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                              Modèle
                            </span>
                            <input
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                              style={{ color: "#030229" }}
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                              Immatriculation
                            </span>
                            <input
                              value={plate}
                              onChange={(e) => setPlate(e.target.value)}
                              className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                              style={{ color: "#030229" }}
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                              VIN (optionnel)
                            </span>
                            <input
                              value={vin}
                              onChange={(e) => setVin(e.target.value)}
                              className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                              style={{ color: "#030229" }}
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                              Carburant (optionnel)
                            </span>
                            <input
                              value={fuel}
                              onChange={(e) => setFuel(e.target.value)}
                              className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                              style={{ color: "#030229" }}
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                              Année (optionnel)
                            </span>
                            <input
                              value={year}
                              onChange={(e) => setYear(e.target.value)}
                              inputMode="numeric"
                              className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                              style={{ color: "#030229" }}
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
                              Moteur (optionnel)
                            </span>
                            <input
                              value={engine}
                              onChange={(e) => setEngine(e.target.value)}
                              className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
                              style={{ color: "#030229" }}
                            />
                          </label>
                        </div>

                        {error ? (
                          <div className="mt-4 rounded-[10px] border border-[rgba(209,26,42,0.25)] bg-[rgba(209,26,42,0.06)] px-4 py-3 text-sm" style={{ color: "#D11A2A" }}>
                            {error}
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              );
            }

*/
