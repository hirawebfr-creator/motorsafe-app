"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Car, Wrench, Plus, Loader2, RefreshCw } from "lucide-react";

// ============================
// Types
// ============================

type ClientLite = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
};

type VehicleLite = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { firstName: string; lastName: string };
};

type VehiclePrefill = {
  brand: string;
  model: string;
  variant?: string;
  version?: string;
  vin?: string;
  fuel?: string;
  year?: number;
  engine?: string;
  logoUrl?: string;
  photoUrl?: string;
};

type InterventionCreate = {
  vehicleId: string;
  type: string;
  notes?: string;
};

// ============================
// Helpers
// ============================

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

function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s\-\.]/g, "").trim();
}

const TYPE_OPTIONS = [
  { value: "E85", label: "E85" },
  { value: "Reprog", label: "Reprogrammation" },
  { value: "Diag", label: "Diagnostic" },
  { value: "Autre", label: "Autre" },
];

// ============================
// Component
// ============================

export default function NouvelleInterventionPage() {
  const router = useRouter();

  // Form state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mode: "existing" (select existing vehicle) or "new" (create new vehicle)
  const [mode, setMode] = useState<"existing" | "new">("existing");

  // === Existing vehicle mode ===
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleLite[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLite | null>(null);

  // === New vehicle mode ===
  const [clientQuery, setClientQuery] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientOptions, setClientOptions] = useState<ClientLite[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientLite | null>(null);

  // Plate lookup
  const [plate, setPlate] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupErrorCode, setLookupErrorCode] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const [lookupSource, setLookupSource] = useState<"cache" | "api" | null>(null);

  // Vehicle form fields (préremplis par lookup)
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [fuel, setFuel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Existing vehicle with same plate?
  const [existingVehicle, setExistingVehicle] = useState<VehicleLite | null>(null);

  // === Intervention fields ===
  const [type, setType] = useState("E85");
  const [notes, setNotes] = useState("");

  const debounceRef = useRef<number | null>(null);
  const clientDebounceRef = useRef<number | null>(null);

  // ============================
  // Load existing vehicles
  // ============================
  async function loadVehicles(q: string) {
    try {
      setVehicleLoading(true);
      const url = new URL("/api/vehicules", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "20");
      if (q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error("Erreur chargement véhicules");
      setVehicleOptions(pickArray(json) as VehicleLite[]);
    } catch {
      setVehicleOptions([]);
    } finally {
      setVehicleLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "existing") void loadVehicles("");
  }, [mode]);

  useEffect(() => {
    if (mode !== "existing") return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void loadVehicles(vehicleQuery);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [vehicleQuery, mode]);

  // ============================
  // Load clients (for new vehicle mode)
  // ============================
  async function loadClients(q: string) {
    try {
      setClientLoading(true);
      const url = new URL("/api/clients", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "20");
      if (q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error("Erreur chargement clients");
      setClientOptions(pickArray(json) as ClientLite[]);
    } catch {
      setClientOptions([]);
    } finally {
      setClientLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "new") void loadClients("");
  }, [mode]);

  useEffect(() => {
    if (mode !== "new") return;
    if (clientDebounceRef.current) window.clearTimeout(clientDebounceRef.current);
    clientDebounceRef.current = window.setTimeout(() => {
      void loadClients(clientQuery);
    }, 250);
    return () => {
      if (clientDebounceRef.current) window.clearTimeout(clientDebounceRef.current);
    };
  }, [clientQuery, mode]);

  // ============================
  // Plate Lookup
  // ============================
  async function lookupPlate(forceRefresh = false) {
    if (!plate.trim()) {
      setLookupError("Entrez une plaque d'immatriculation.");
      return;
    }

    const normalizedPlate = normalizePlate(plate);

    try {
      setLookupLoading(true);
      setLookupError(null);
      setLookupErrorCode(null);
      setLookupSuccess(false);
      setLookupSource(null);
      setExistingVehicle(null);

      // First check if vehicle already exists in garage
      const checkRes = await fetch(`/api/vehicules?q=${encodeURIComponent(normalizedPlate)}&pageSize=5`);
      const checkJson = await checkRes.json().catch(() => null);
      const existingVehicles = pickArray(checkJson) as VehicleLite[];
      const matchingVehicle = existingVehicles.find(
        (v) => normalizePlate(v.plate) === normalizedPlate
      );

      if (matchingVehicle) {
        setExistingVehicle(matchingVehicle);
        // Pre-fill from existing vehicle
        setBrand(matchingVehicle.brand);
        setModel(matchingVehicle.model);
        setLookupSuccess(true);
        setLookupSource(null); // Not from API
        return;
      }

      // Call lookup API
      const res = await fetch("/api/vehicules/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ immatriculation: plate.trim(), forceRefresh }),
      });

      const json = await res.json().catch(() => null);

      if (json?.data?.source) {
        setLookupSource(json.data.source as "cache" | "api");
      }

      if (!res.ok || !json?.ok) {
        const errorCode = json?.error?.code || "UNKNOWN";
        const errorMsg = json?.error?.message || "Erreur lors de la recherche.";
        setLookupError(errorMsg);
        setLookupErrorCode(errorCode);
        return;
      }

      const prefill = json.data?.data as VehiclePrefill | undefined;
      if (!prefill) {
        setLookupError("Aucune donnée trouvée. Saisissez manuellement.");
        setLookupErrorCode("NO_DATA");
        return;
      }

      // Auto-fill form fields
      if (prefill.brand) setBrand(prefill.brand);
      if (prefill.model) setModel(prefill.model);
      if (prefill.vin) setVin(prefill.vin);
      if (prefill.fuel) setFuel(prefill.fuel);
      if (prefill.year) setYear(String(prefill.year));
      if (prefill.engine) setEngine(prefill.engine);
      if (prefill.logoUrl) setLogoUrl(prefill.logoUrl);

      setLookupSuccess(true);
    } catch {
      setLookupError("Erreur de connexion. Saisissez manuellement.");
      setLookupErrorCode("CONNECTION_ERROR");
    } finally {
      setLookupLoading(false);
    }
  }

  // ============================
  // Labels
  // ============================
  const selectedVehicleLabel = useMemo(() => {
    if (!selectedVehicle) return "Aucun véhicule sélectionné";
    const v = selectedVehicle;
    const clientName = v.client ? `${v.client.firstName} ${v.client.lastName}`.trim() : "";
    return `${v.plate} — ${v.brand} ${v.model}${clientName ? ` (${clientName})` : ""}`;
  }, [selectedVehicle]);

  const selectedClientLabel = useMemo(() => {
    if (!selectedClient) return "Aucun client sélectionné";
    const name = `${selectedClient.firstName} ${selectedClient.lastName}`.trim();
    return [name, selectedClient.email].filter(Boolean).join(" • ");
  }, [selectedClient]);

  // ============================
  // Submit
  // ============================
  async function onSubmit() {
    try {
      setSaving(true);
      setError(null);

      let vehicleId: string;

      if (mode === "existing") {
        // Use existing vehicle
        if (!selectedVehicle?.id) {
          throw new Error("Sélectionnez un véhicule.");
        }
        vehicleId = selectedVehicle.id;
      } else {
        // New vehicle mode
        if (!selectedClient?.id) {
          throw new Error("Sélectionnez un client.");
        }

        // If existing vehicle found with same plate, use it
        if (existingVehicle) {
          vehicleId = existingVehicle.id;
        } else {
          // Create new vehicle
          if (!brand.trim()) throw new Error("La marque est obligatoire.");
          if (!model.trim()) throw new Error("Le modèle est obligatoire.");
          if (!plate.trim()) throw new Error("La plaque est obligatoire.");

          const vehiclePayload = {
            clientId: selectedClient.id,
            brand: brand.trim(),
            model: model.trim(),
            plate: plate.trim(),
            vin: vin.trim() || undefined,
            fuel: fuel.trim() || undefined,
            year: year.trim() ? Number(year) : undefined,
            engine: engine.trim() || undefined,
          };

          const vehicleRes = await fetch("/api/vehicules", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(vehiclePayload),
          });

          const vehicleJson = await vehicleRes.json().catch(() => null);
          if (!vehicleRes.ok) {
            const msg = vehicleJson?.error?.message || "Erreur création véhicule";
            throw new Error(msg);
          }

          const vehicleData = unwrapOk(vehicleJson);
          if (!isRecord(vehicleData) || typeof vehicleData.id !== "string") {
            throw new Error("Réponse véhicule invalide");
          }
          vehicleId = vehicleData.id;
        }
      }

      // Create intervention
      if (!type.trim()) throw new Error("Le type est obligatoire.");

      const interventionPayload: InterventionCreate = {
        vehicleId,
        type: type.trim(),
      };
      if (notes.trim()) interventionPayload.notes = notes.trim();

      const intRes = await fetch("/api/interventions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(interventionPayload),
      });

      const intJson = await intRes.json().catch(() => null);
      if (!intRes.ok) {
        const msg = intJson?.error?.message || "Erreur création intervention";
        throw new Error(msg);
      }

      const intData = unwrapOk(intJson);
      const createdId = isRecord(intData) && typeof intData.id === "string" ? intData.id : undefined;
      router.push(createdId ? `/interventions/${createdId}` : "/interventions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  // ============================
  // Render
  // ============================
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

      {/* Mode Selection */}
      <div className="ms-card p-4 mb-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === "existing"
                ? "bg-[var(--ms-primary)] text-white"
                : "bg-[var(--ms-bg-subtle)] text-[var(--ms-text-secondary)] hover:bg-[var(--ms-bg-hover)]"
            }`}
          >
            <Car size={18} className="inline mr-2" />
            Véhicule existant
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === "new"
                ? "bg-[var(--ms-primary)] text-white"
                : "bg-[var(--ms-bg-subtle)] text-[var(--ms-text-secondary)] hover:bg-[var(--ms-bg-hover)]"
            }`}
          >
            <Plus size={18} className="inline mr-2" />
            Nouveau véhicule
          </button>
        </div>
      </div>

      {/* ============================
          Mode: Existing Vehicle
          ============================ */}
      {mode === "existing" && (
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
      )}

      {/* ============================
          Mode: New Vehicle
          ============================ */}
      {mode === "new" && (
        <>
          {/* Client Selection */}
          <div className="ms-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]">
                <Search size={20} className="text-[var(--ms-warning)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Client</h3>
                <p className="text-xs text-muted2">Sélectionnez le propriétaire du véhicule</p>
              </div>
            </div>

            <div className="ms-search mb-3">
              <Search size={18} className="ms-search-icon" />
              <input
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Rechercher un client (nom, email…)"
                className="ms-search-input"
              />
            </div>

            <p className="text-sm text-muted2 mb-3">
              {clientLoading ? "Chargement…" : selectedClientLabel}
            </p>

            <div className="max-h-[160px] overflow-y-auto rounded-xl border border-[var(--ms-border)]">
              {clientOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted2">
                  {clientLoading ? "Chargement…" : "Aucun client trouvé."}
                </div>
              ) : (
                clientOptions.map((c) => {
                  const name = `${c.firstName} ${c.lastName}`.trim();
                  const active = selectedClient?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClient(c)}
                      className={`w-full px-4 py-3 text-left hover:bg-[var(--ms-bg-subtle)] border-b border-[var(--ms-border)] last:border-b-0 ${
                        active ? "bg-[var(--ms-primary-light)]" : ""
                      }`}
                    >
                      <div className="font-semibold">{name || `Client #${c.id}`}</div>
                      {c.email && <div className="text-sm text-muted2">{c.email}</div>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Vehicle - Plate Lookup */}
          <div className="ms-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
                <Car size={20} className="text-[var(--ms-primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Véhicule</h3>
                <p className="text-xs text-muted2">Recherchez par plaque ou saisissez manuellement</p>
              </div>
            </div>

            {/* Plate lookup row */}
            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Plaque d&apos;immatriculation</label>
                <input
                  value={plate}
                  onChange={(e) => {
                    setPlate(e.target.value);
                    setLookupSuccess(false);
                    setLookupError(null);
                    setExistingVehicle(null);
                  }}
                  placeholder="Ex: AB-123-CD"
                  className="ms-input w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => lookupPlate(false)}
                disabled={lookupLoading || !plate.trim()}
                className="ms-btn ms-btn-primary h-[42px]"
              >
                {lookupLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                <span className="ml-2">Rechercher</span>
              </button>
              {lookupSuccess && lookupSource === "cache" && (
                <button
                  type="button"
                  onClick={() => lookupPlate(true)}
                  disabled={lookupLoading}
                  className="ms-btn ms-btn-secondary h-[42px]"
                  title="Forcer une nouvelle recherche"
                >
                  <RefreshCw size={16} />
                </button>
              )}
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-[42px] w-auto object-contain"
                  onError={() => setLogoUrl(null)}
                />
              )}
            </div>

            {/* Lookup messages */}
            {lookupError && (
              <div className="ms-alert ms-alert-error mb-4">
                <span>{lookupError}</span>
                {(lookupErrorCode === "QUOTA_EXCEEDED" || lookupErrorCode === "PROVIDER_NO_CREDITS") && (
                  <p className="text-xs mt-1 opacity-80">
                    💡 Saisissez les informations manuellement ci-dessous.
                  </p>
                )}
              </div>
            )}

            {existingVehicle && (
              <div className="ms-alert ms-alert-info mb-4">
                <span>
                  ✓ Véhicule existant trouvé : <strong>{existingVehicle.plate}</strong> — {existingVehicle.brand} {existingVehicle.model}
                  <br />
                  <span className="text-xs opacity-80">
                    Ce véhicule sera utilisé pour l&apos;intervention.
                  </span>
                </span>
              </div>
            )}

            {lookupSuccess && !existingVehicle && (
              <div className="ms-alert ms-alert-success mb-4">
                <span>
                  ✓ Données récupérées
                  {lookupSource && (
                    <span className="ml-2 text-xs opacity-80">
                      ({lookupSource === "cache" ? "📦 cache" : "🌐 api"})
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Vehicle fields (editable) */}
            {!existingVehicle && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Marque *</label>
                  <input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Renault"
                    className="ms-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Modèle *</label>
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: Clio"
                    className="ms-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">VIN</label>
                  <input
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    placeholder="17 caractères"
                    className="ms-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Carburant</label>
                  <input
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    placeholder="Ex: Diesel"
                    className="ms-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Année</label>
                  <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ex: 2020"
                    inputMode="numeric"
                    className="ms-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Moteur</label>
                  <input
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="Ex: 1.5 dCi"
                    className="ms-input w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

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
