"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Car, Wrench } from "lucide-react";

type VehicleLite = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { firstName: string; lastName: string };
};

type InterventionCreate = {
  vehicleId: string;
  type: string;
  notes?: string;
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

const TYPE_OPTIONS = [
  { value: "E85", label: "E85" },
  { value: "Reprog", label: "Reprogrammation" },
  { value: "Diag", label: "Diagnostic" },
  { value: "Autre", label: "Autre" },
];

export default function NouvelleInterventionPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleLite[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLite | null>(null);

  const [type, setType] = useState("E85");
  const [notes, setNotes] = useState("");

  const debounceRef = useRef<number | null>(null);

  async function loadVehicles(q: string) {
    try {
      setVehicleLoading(true);
      const url = new URL("/api/vehicules", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "20");
      if (q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message || json?.error || `GET /api/vehicules ${res.status}`;
        throw new Error(message);
      }
      setVehicleOptions(pickArray(json) as VehicleLite[]);
    } catch {
      setVehicleOptions([]);
    } finally {
      setVehicleLoading(false);
    }
  }

  useEffect(() => {
    void loadVehicles("");
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void loadVehicles(vehicleQuery);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [vehicleQuery]);

  const selectedVehicleLabel = useMemo(() => {
    if (!selectedVehicle) return "Aucun véhicule sélectionné";
    const v = selectedVehicle;
    const clientName = v.client ? `${v.client.firstName} ${v.client.lastName}`.trim() : "";
    return `${v.plate} — ${v.brand} ${v.model}${clientName ? ` (${clientName})` : ""}`;
  }, [selectedVehicle]);

  async function onSubmit() {
    try {
      setSaving(true);
      setError(null);

      if (!selectedVehicle?.id) throw new Error("Sélectionnez un véhicule.");
      if (!type.trim()) throw new Error("Le type est obligatoire.");

      const payload: InterventionCreate = {
        vehicleId: selectedVehicle.id,
        type: type.trim(),
      };

      if (notes.trim()) payload.notes = notes.trim();

      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message || json?.error || `POST /api/interventions ${res.status}`;
        throw new Error(message);
      }

      const data = unwrapOk(json);
      const createdId = isRecord(data) && typeof data.id === "string" ? data.id : undefined;
      router.push(createdId ? `/interventions/${createdId}` : "/interventions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Nouvelle intervention</h1>
          <p className="ms-page-subtitle">Créer un nouveau dossier d&apos;intervention</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/interventions" className="ms-btn ms-btn-secondary">
            Annuler
          </Link>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="ms-btn ms-btn-primary"
          >
            {saving ? "Création…" : "Créer"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="ms-alert ms-alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Vehicle Selection */}
      <div className="ms-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
            <Car size={20} className="text-[var(--ms-primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Véhicule</h3>
            <p className="text-xs text-muted2">Sélectionnez le véhicule concerné</p>
          </div>
        </div>

        <div className="ms-search mb-3">
          <Search size={18} className="ms-search-icon" />
          <input
            value={vehicleQuery}
            onChange={(e) => setVehicleQuery(e.target.value)}
            placeholder="Rechercher un véhicule (plaque, marque…)"
            className="ms-search-input"
          />
        </div>

        <p className="text-sm text-muted2 mb-3">
          {vehicleLoading ? "Chargement…" : selectedVehicleLabel}
        </p>

        <div className="max-h-[200px] overflow-y-auto rounded-xl border border-[var(--ms-border)]">
          {vehicleOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted2">
              {vehicleLoading ? "Chargement…" : "Aucun véhicule trouvé."}
            </div>
          ) : (
            vehicleOptions.map((v) => {
              const clientName = v.client ? `${v.client.firstName} ${v.client.lastName}`.trim() : "";
              const active = selectedVehicle?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicle(v)}
                  className={`w-full px-4 py-3 text-left hover:bg-[var(--ms-bg-subtle)] border-b border-[var(--ms-border)] last:border-b-0 ${
                    active ? "bg-[var(--ms-primary-light)]" : ""
                  }`}
                >
                  <div className="font-semibold">{v.plate}</div>
                  <div className="text-sm text-muted2">
                    {v.brand} {v.model} {clientName && `• ${clientName}`}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Intervention Details */}
      <div className="ms-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
            <Wrench size={20} className="text-[var(--ms-success)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Détails</h3>
            <p className="text-xs text-muted2">Type d&apos;intervention et notes</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Type d&apos;intervention</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="ms-input w-full"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="ms-input w-full min-h-[80px]"
              placeholder="Notes sur l'intervention…"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
