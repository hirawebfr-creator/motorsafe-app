"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Car,
  Wrench,
  Plus,
  RefreshCw,
  User,
  Check,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

// ============================================================================
// NOUVELLE INTERVENTION - SafeMotor Design System
// Création d'une nouvelle intervention
// ============================================================================

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

// Helpers
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
  { value: "E85", label: "Conversion E85" },
  { value: "Reprog", label: "Reprogrammation moteur" },
  { value: "Diag", label: "Diagnostic" },
  { value: "Entretien", label: "Entretien" },
  { value: "Autre", label: "Autre" },
];

export default function NouvelleInterventionPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mode: "existing" ou "new"
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
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const [lookupSource, setLookupSource] = useState<"cache" | "api" | null>(null);

  // Vehicle form fields
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [fuel, setFuel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [_logoUrl, setLogoUrl] = useState<string | null>(null);

  // Existing vehicle with same plate?
  const [existingVehicle, setExistingVehicle] = useState<VehicleLite | null>(null);

  // === Intervention fields ===
  const [type, setType] = useState("E85");
  const [notes, setNotes] = useState("");
  const [mileage, setMileage] = useState("");

  const debounceRef = useRef<number | null>(null);
  const clientDebounceRef = useRef<number | null>(null);

  // Load existing vehicles
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

  // Load clients
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

  // Plate Lookup
  async function lookupPlate(forceRefresh = false) {
    if (!plate.trim()) {
      setLookupError("Entrez une plaque d'immatriculation.");
      return;
    }

    const normalizedPlate = normalizePlate(plate);

    try {
      setLookupLoading(true);
      setLookupError(null);
      setLookupSuccess(false);
      setLookupSource(null);
      setExistingVehicle(null);

      // Check if vehicle already exists
      const checkRes = await fetch(`/api/vehicules?q=${encodeURIComponent(normalizedPlate)}&pageSize=5`);
      const checkJson = await checkRes.json().catch(() => null);
      const existingVehicles = pickArray(checkJson) as VehicleLite[];
      const matchingVehicle = existingVehicles.find((v) => normalizePlate(v.plate) === normalizedPlate);

      if (matchingVehicle) {
        setExistingVehicle(matchingVehicle);
        setBrand(matchingVehicle.brand);
        setModel(matchingVehicle.model);
        setLookupSuccess(true);
        return;
      }

      // Call lookup API
      const res = await fetch("/api/vehicules/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ immatriculation: plate.trim(), forceRefresh }),
      });

      const json = await res.json().catch(() => null);
      if (json?.data?.source) setLookupSource(json.data.source as "cache" | "api");

      if (!res.ok || !json?.ok) {
        setLookupError(json?.error?.message || "Erreur lors de la recherche.");
        return;
      }

      const prefill = json.data?.data as VehiclePrefill | undefined;
      if (!prefill) {
        setLookupError("Aucune donnée trouvée. Saisissez manuellement.");
        return;
      }

      if (prefill.brand) setBrand(prefill.brand);
      if (prefill.model) setModel(prefill.model);
      if (prefill.vin) setVin(prefill.vin);
      if (prefill.fuel) setFuel(prefill.fuel);
      if (prefill.year) setYear(String(prefill.year));
      if (prefill.engine) setEngine(prefill.engine);
      if (prefill.logoUrl) setLogoUrl(prefill.logoUrl);

      setLookupSuccess(true);
    } catch {
      setLookupError("Erreur de connexion.");
    } finally {
      setLookupLoading(false);
    }
  }

  // Labels
  const selectedVehicleLabel = useMemo(() => {
    if (!selectedVehicle) return null;
    const v = selectedVehicle;
    const clientName = v.client ? `${v.client.firstName} ${v.client.lastName}`.trim() : "";
    return { plate: v.plate, info: `${v.brand} ${v.model}`, client: clientName };
  }, [selectedVehicle]);

  const selectedClientLabel = useMemo(() => {
    if (!selectedClient) return null;
    return `${selectedClient.firstName} ${selectedClient.lastName}`.trim();
  }, [selectedClient]);

  // Submit
  async function onSubmit() {
    try {
      setSaving(true);
      setError(null);

      let vehicleId: string;

      if (mode === "existing") {
        if (!selectedVehicle?.id) throw new Error("Sélectionnez un véhicule.");
        vehicleId = selectedVehicle.id;
      } else {
        if (!selectedClient?.id) throw new Error("Sélectionnez un client.");

        if (existingVehicle) {
          vehicleId = existingVehicle.id;
        } else {
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
          if (!vehicleRes.ok) throw new Error(vehicleJson?.error?.message || "Erreur création véhicule");

          const vehicleData = unwrapOk(vehicleJson);
          if (!isRecord(vehicleData) || typeof vehicleData.id !== "string") throw new Error("Réponse véhicule invalide");
          vehicleId = vehicleData.id;
        }
      }

      if (!type.trim()) throw new Error("Le type est obligatoire.");

      const interventionPayload: Record<string, unknown> = {
        vehicleId,
        type: type.trim(),
      };
      if (notes.trim()) interventionPayload.notes = notes.trim();
      if (mileage.trim()) interventionPayload.odometerKm = Number(mileage);

      const intRes = await fetch("/api/interventions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(interventionPayload),
      });

      const intJson = await intRes.json().catch(() => null);
      if (!intRes.ok) throw new Error(intJson?.error?.message || "Erreur création intervention");

      const intData = unwrapOk(intJson);
      const createdId = isRecord(intData) && typeof intData.id === "string" ? intData.id : undefined;
      router.push(createdId ? `/interventions/${createdId}` : "/interventions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  // Styles
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    padding: "24px",
    marginBottom: "20px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "36px",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link
          href="/interventions"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "16px" }}
        >
          <ArrowLeft size={16} />
          Retour aux interventions
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>Nouvelle intervention</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Créez un nouveau dossier d'intervention</p>
          </div>

          <button
            onClick={onSubmit}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Création...
              </>
            ) : (
              <>
                <Check size={16} />
                Créer l'intervention
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
            borderRadius: "12px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            marginBottom: "20px",
          }}
        >
          <AlertCircle size={20} color="#EF4444" />
          <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
        </div>
      )}

      {/* Mode Selection */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Type de véhicule</h3>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { value: "existing", label: "Véhicule existant", icon: Car },
            { value: "new", label: "Nouveau véhicule", icon: Plus },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMode(value as "existing" | "new")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "14px 20px",
                borderRadius: "12px",
                border: mode === value ? "2px solid #6366F1" : "1px solid #E5E7EB",
                background: mode === value ? "rgba(99, 102, 241, 0.05)" : "#fff",
                fontSize: "14px",
                fontWeight: "500",
                color: mode === value ? "#6366F1" : "#374151",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode: Existing Vehicle */}
      {mode === "existing" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Car size={22} color="#6366F1" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Sélectionner un véhicule</h3>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Recherchez parmi les véhicules existants</p>
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Search size={18} color="#9CA3AF" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              placeholder="Rechercher par plaque, marque, modèle..."
              style={{ ...inputStyle, paddingLeft: "42px" }}
            />
          </div>

          {selectedVehicleLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                marginBottom: "16px",
              }}
            >
              <Check size={18} color="#10B981" />
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>{selectedVehicleLabel.plate}</div>
                <div style={{ fontSize: "13px", color: "#6B7280" }}>
                  {selectedVehicleLabel.info} {selectedVehicleLabel.client && `• ${selectedVehicleLabel.client}`}
                </div>
              </div>
            </div>
          )}

          <div style={{ maxHeight: "240px", overflowY: "auto", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
            {vehicleLoading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>Chargement...</div>
            ) : vehicleOptions.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>Aucun véhicule trouvé</div>
            ) : (
              vehicleOptions.map((v) => {
                const clientName = v.client ? `${v.client.firstName} ${v.client.lastName}`.trim() : "";
                const isSelected = selectedVehicle?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "none",
                      borderBottom: "1px solid #F3F4F6",
                      background: isSelected ? "rgba(99, 102, 241, 0.05)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = "transparent")}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827", fontFamily: "monospace" }}>{v.plate}</div>
                      <div style={{ fontSize: "13px", color: "#6B7280" }}>
                        {v.brand} {v.model} {clientName && `• ${clientName}`}
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="#6366F1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Mode: New Vehicle */}
      {mode === "new" && (
        <>
          {/* Client Selection */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(245, 158, 11, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={22} color="#F59E0B" />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Sélectionner un client</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Propriétaire du véhicule</p>
              </div>
            </div>

            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search size={18} color="#9CA3AF" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Rechercher par nom, email..."
                style={{ ...inputStyle, paddingLeft: "42px" }}
              />
            </div>

            {selectedClientLabel && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  marginBottom: "16px",
                }}
              >
                <Check size={18} color="#10B981" />
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>{selectedClientLabel}</span>
              </div>
            )}

            <div style={{ maxHeight: "180px", overflowY: "auto", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
              {clientLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>Chargement...</div>
              ) : clientOptions.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>Aucun client trouvé</div>
              ) : (
                clientOptions.map((c) => {
                  const name = `${c.firstName} ${c.lastName}`.trim();
                  const isSelected = selectedClient?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "none",
                        borderBottom: "1px solid #F3F4F6",
                        background: isSelected ? "rgba(99, 102, 241, 0.05)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = "transparent")}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>{name || `Client #${c.id}`}</div>
                        {c.email && <div style={{ fontSize: "13px", color: "#6B7280" }}>{c.email}</div>}
                      </div>
                      {isSelected && <Check size={18} color="#6366F1" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Vehicle - Plate Lookup */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Car size={22} color="#6366F1" />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Informations véhicule</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Recherchez par plaque ou saisissez manuellement</p>
              </div>
            </div>

            {/* Plate lookup */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Plaque d'immatriculation *</label>
                <input
                  value={plate}
                  onChange={(e) => {
                    setPlate(e.target.value);
                    setLookupSuccess(false);
                    setLookupError(null);
                    setExistingVehicle(null);
                  }}
                  placeholder="Ex: AB-123-CD"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <button
                  onClick={() => lookupPlate(false)}
                  disabled={lookupLoading || !plate.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: lookupLoading || !plate.trim() ? "not-allowed" : "pointer",
                    opacity: lookupLoading || !plate.trim() ? 0.5 : 1,
                  }}
                >
                  {lookupLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={16} />}
                  Rechercher
                </button>
                {lookupSuccess && lookupSource === "cache" && (
                  <button
                    onClick={() => lookupPlate(true)}
                    disabled={lookupLoading}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                    title="Actualiser depuis l'API"
                  >
                    <RefreshCw size={16} color="#6B7280" />
                  </button>
                )}
              </div>
            </div>

            {/* Lookup messages */}
            {lookupError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.1)",
                  marginBottom: "16px",
                }}
              >
                <AlertCircle size={16} color="#EF4444" />
                <span style={{ fontSize: "13px", color: "#DC2626" }}>{lookupError}</span>
              </div>
            )}

            {existingVehicle && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "rgba(59, 130, 246, 0.1)",
                  marginBottom: "16px",
                }}
              >
                <Info size={16} color="#3B82F6" />
                <span style={{ fontSize: "13px", color: "#1D4ED8" }}>
                  Véhicule existant trouvé : <strong>{existingVehicle.plate}</strong> — {existingVehicle.brand} {existingVehicle.model}
                </span>
              </div>
            )}

            {lookupSuccess && !existingVehicle && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.1)",
                  marginBottom: "16px",
                }}
              >
                <Check size={16} color="#10B981" />
                <span style={{ fontSize: "13px", color: "#059669" }}>
                  Données récupérées {lookupSource && `(${lookupSource === "cache" ? "cache" : "API"})`}
                </span>
              </div>
            )}

            {/* Vehicle fields */}
            {!existingVehicle && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Marque *</label>
                  <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Renault" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Modèle *</label>
                  <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ex: Clio" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>VIN</label>
                  <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="17 caractères" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Carburant</label>
                  <input value={fuel} onChange={(e) => setFuel(e.target.value)} placeholder="Ex: Diesel" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Année</label>
                  <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex: 2020" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Moteur</label>
                  <input value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="Ex: 1.5 dCi" style={inputStyle} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Intervention Details */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wrench size={22} color="#10B981" />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Détails de l'intervention</h3>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Type et informations complémentaires</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Type d'intervention *</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Kilométrage</label>
            <input value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="Ex: 45000" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, travaux demandés..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
