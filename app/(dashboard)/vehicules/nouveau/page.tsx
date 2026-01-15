"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

type ClientLite = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

type VehicleCreate = {
  clientId: number;
  brand: string;
  model: string;
  plate: string;
  vin?: string;
  fuel?: string;
  year?: number;
  engine?: string;
};

type VehiclePrefill = {
  // Identification
  brand: string;
  model: string;
  variant?: string;
  version?: string;
  vin?: string;
  typeMine?: string;
  cnit?: string;
  
  // Dates
  firstRegistrationDate?: string;
  year?: number;
  
  // Motorisation
  fuel?: string;
  engine?: string;
  engineCode?: string;
  ccm?: number;
  cylinders?: number;
  powerFiscal?: number;
  powerCh?: number;
  powerKw?: number;
  gearbox?: string;
  
  // Carrosserie
  bodyType?: string;
  color?: string;
  doors?: number;
  seats?: number;
  
  // Poids
  weightKg?: number;
  ptacKg?: number;
  
  // Environnement
  co2?: number;
  
  // Assurance
  sraId?: string;
  sraGroup?: string;
  sraCommercial?: string;
  
  // Medias
  logoUrl?: string;
  photoUrl?: string;
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

export default function NouveauVehiculePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupErrorCode, setLookupErrorCode] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<VehiclePrefill | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{ current: number; limit: number; remaining: number } | null>(null);
  const [lookupSource, setLookupSource] = useState<"cache" | "api" | null>(null);

  const debounceRef = useRef<number | null>(null);

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
    void loadClients("");
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void loadClients(clientQuery);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [clientQuery]);

  async function lookupPlate(forceRefresh = false) {
    if (!plate.trim()) {
      setLookupError("Entrez une plaque d'immatriculation.");
      setLookupErrorCode(null);
      return;
    }
    
    try {
      setLookupLoading(true);
      setLookupError(null);
      setLookupErrorCode(null);
      setLookupSuccess(false);
      setLogoUrl(null);
      setPhotoUrl(null);
      setVehicleDetails(null);
      setQuotaInfo(null);
      setLookupSource(null);
      
      const res = await fetch("/api/vehicules/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ immatriculation: plate.trim(), forceRefresh }),
      });
      
      const json = await res.json().catch(() => null);
      
      // Store quota info if present
      if (json?.quota) {
        setQuotaInfo(json.quota);
      }
      
      // Store source info
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
        setLookupError("Aucune donnée trouvée.");
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
      if (prefill.photoUrl) setPhotoUrl(prefill.photoUrl);
      
      // Store full details for display
      setVehicleDetails(prefill);
      
      setLookupSuccess(true);
    } catch {
      setLookupError("Erreur de connexion. Vous pouvez saisir les informations manuellement.");
      setLookupErrorCode("CONNECTION_ERROR");
    } finally {
      setLookupLoading(false);
    }
  }

  const selectedClientLabel = useMemo(() => {
    if (!selectedClient) return "Aucun client sélectionné";
    const name = `${selectedClient.firstName} ${selectedClient.lastName}`.trim();
    return [name, selectedClient.email].filter(Boolean).join(" • ");
  }, [selectedClient]);

  async function onSubmit() {
    try {
      setSaving(true);
      setError(null);

      if (!selectedClient?.id) throw new Error("Sélectionnez un client.");
      if (!brand.trim()) throw new Error("La marque est obligatoire.");
      if (!model.trim()) throw new Error("Le modèle est obligatoire.");
      if (!plate.trim()) throw new Error("L'immatriculation est obligatoire.");

      const payload: VehicleCreate = {
        clientId: selectedClient.id,
        brand: brand.trim(),
        model: model.trim(),
        plate: plate.trim(),
      };

      // API accepts vin/fuel/engine as "" or omitted; year optional number
      if (vin !== "") payload.vin = vin;
      if (fuel !== "") payload.fuel = fuel;
      if (engine !== "") payload.engine = engine;
      if (year.trim()) payload.year = Number(year);

      const res = await fetch("/api/vehicules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message || json?.error || `POST /api/vehicules ${res.status}`;
        throw new Error(message);
      }

      const data = unwrapOk(json);
      const createdId = isRecord(data) && typeof data.id === "string" ? data.id : undefined;
      router.push(createdId ? `/vehicules/${createdId}` : "/vehicules");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative h-[1016px] w-[1162px] overflow-hidden bg-[#F7F7F8]">
      <div className="absolute left-0 top-[5px] text-[24px] font-bold text-black">Nouveau véhicule</div>

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
          onClick={onSubmit}
          disabled={saving}
          className="grid place-items-center rounded-[10px] px-5 text-[14px] font-semibold text-white disabled:opacity-60"
          style={{ height: 40, background: "#605BFF" }}
        >
          {saving ? "Saving…" : "Create"}
        </button>
      </div>

      <div className="absolute left-0 top-[70px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-5">
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

        <div className="mt-3 max-h-[180px] overflow-y-auto rounded-[10px] border border-[rgba(3,2,41,0.08)]">
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

      <div className="absolute left-0 top-[360px] w-[1162px] rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-6 py-5">
        {/* Lookup section */}
        <div className="mb-6 flex items-end gap-3">
          <label className="grid flex-1 gap-2">
            <span className="text-[12px] font-semibold" style={{ color: "#030229", opacity: 0.7 }}>
              Immatriculation
            </span>
            <input
              value={plate}
              onChange={(e) => {
                setPlate(e.target.value);
                setLookupSuccess(false);
                setLookupError(null);
              }}
              className="h-[40px] rounded-[10px] border border-[rgba(3,2,41,0.08)] px-3 text-[12px] outline-none"
              style={{ color: "#030229" }}
              placeholder="Ex: AB-123-CD"
            />
          </label>
          <button
            type="button"
            onClick={() => lookupPlate(false)}
            disabled={lookupLoading || !plate.trim()}
            className="flex h-[40px] items-center gap-2 rounded-[10px] px-4 text-[12px] font-semibold text-white disabled:opacity-50"
            style={{ background: "#605BFF" }}
          >
            {lookupLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            Rechercher
          </button>
          {/* Force refresh button - shown only after successful lookup from cache */}
          {lookupSuccess && lookupSource === "cache" && (
            <button
              type="button"
              onClick={() => lookupPlate(true)}
              disabled={lookupLoading}
              className="flex h-[40px] items-center gap-2 rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-white px-3 text-[11px] font-medium disabled:opacity-50"
              style={{ color: "#030229" }}
              title="Forcer une nouvelle recherche (ignore le cache)"
            >
              ↻ Actualiser
            </button>
          )}
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo marque"
              className="h-[40px] w-auto object-contain"
              onError={() => setLogoUrl(null)}
            />
          )}
          {/* Show quota info */}
          {quotaInfo && (
            <div className="text-[11px]" style={{ color: "#030229", opacity: 0.5 }}>
              {quotaInfo.remaining}/{quotaInfo.limit} recherches restantes
            </div>
          )}
        </div>
        
        {/* Error messages with contextual UI */}
        {lookupError && (
          <div className="mb-4 rounded-[10px] border border-[rgba(209,26,42,0.25)] bg-[rgba(209,26,42,0.06)] px-4 py-3" style={{ color: "#D11A2A" }}>
            <div className="text-[12px] font-medium">{lookupError}</div>
            {/* Quota exceeded: show manual entry hint */}
            {lookupErrorCode === "QUOTA_EXCEEDED" && (
              <div className="mt-2 text-[11px]" style={{ color: "#030229", opacity: 0.7 }}>
                💡 Vous pouvez toujours créer le véhicule en saisissant les informations manuellement ci-dessous.
              </div>
            )}
            {/* API errors: encourage manual entry */}
            {(lookupErrorCode === "API_ERROR" || lookupErrorCode === "TIMEOUT" || lookupErrorCode === "CONNECTION_ERROR" || lookupErrorCode === "TOKEN_MISSING") && (
              <div className="mt-2 text-[11px]" style={{ color: "#030229", opacity: 0.7 }}>
                💡 Service temporairement indisponible. Saisissez les informations manuellement ci-dessous.
              </div>
            )}
            {/* Provider no credits */}
            {lookupErrorCode === "PROVIDER_NO_CREDITS" && (
              <div className="mt-2 text-[11px]" style={{ color: "#030229", opacity: 0.7 }}>
                💡 Crédits du service de recherche épuisés. Saisissez les informations manuellement ci-dessous.
              </div>
            )}
          </div>
        )}
        
        {lookupSuccess && (
          <div className="mb-4 rounded-[10px] border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.06)] px-4 py-2 text-[12px]" style={{ color: "#16a34a" }}>
            ✓ Véhicule trouvé — champs pré-remplis
            {lookupSource && (
              <span className="ml-2 rounded bg-white/50 px-1.5 py-0.5 text-[10px] font-medium" style={{ color: lookupSource === "cache" ? "#0284c7" : "#16a34a" }}>
                {lookupSource === "cache" ? "📦 cache" : "🌐 api"}
              </span>
            )}
            {quotaInfo && (
              <span className="ml-2" style={{ opacity: 0.7 }}>
                ({quotaInfo.remaining} recherches restantes ce mois)
              </span>
            )}
          </div>
        )}

        {/* Vehicle details card */}
        {vehicleDetails && lookupSuccess && (
          <div className="mb-6 rounded-[10px] border border-[rgba(3,2,41,0.08)] bg-[#FAFAFB] p-4">
            <div className="flex gap-4">
              {/* Photo du véhicule */}
              {photoUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={photoUrl}
                    alt={`${vehicleDetails.brand} ${vehicleDetails.model}`}
                    className="h-[100px] w-auto rounded-[8px] object-contain bg-white"
                    onError={() => setPhotoUrl(null)}
                  />
                </div>
              )}
              
              {/* Infos principales */}
              <div className="flex-1 min-w-0">
                <div className="mb-3 flex items-center gap-2">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="h-[20px] w-auto object-contain" />
                  )}
                  <span className="text-[16px] font-semibold" style={{ color: "#030229" }}>
                    {vehicleDetails.brand} {vehicleDetails.model}
                  </span>
                  {vehicleDetails.version && (
                    <span className="text-[12px]" style={{ color: "#030229", opacity: 0.6 }}>
                      {vehicleDetails.version}
                    </span>
                  )}
                </div>
                
                {/* Grid de specs */}
                <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                  {vehicleDetails.year && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Année</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.year}</div>
                    </div>
                  )}
                  {vehicleDetails.fuel && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Énergie</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.fuel}</div>
                    </div>
                  )}
                  {(vehicleDetails.powerCh || vehicleDetails.powerKw) && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Puissance</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>
                        {vehicleDetails.powerCh ? `${vehicleDetails.powerCh} ch` : ""}
                        {vehicleDetails.powerCh && vehicleDetails.powerKw ? " / " : ""}
                        {vehicleDetails.powerKw ? `${vehicleDetails.powerKw} kW` : ""}
                      </div>
                    </div>
                  )}
                  {vehicleDetails.powerFiscal && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Puissance fiscale</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.powerFiscal} CV</div>
                    </div>
                  )}
                  {vehicleDetails.ccm && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Cylindrée</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.ccm} cm³</div>
                    </div>
                  )}
                  {vehicleDetails.cylinders && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Cylindres</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.cylinders}</div>
                    </div>
                  )}
                  {vehicleDetails.gearbox && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Boîte</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.gearbox}</div>
                    </div>
                  )}
                  {vehicleDetails.bodyType && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Carrosserie</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.bodyType}</div>
                    </div>
                  )}
                  {vehicleDetails.doors && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Portes</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.doors}</div>
                    </div>
                  )}
                  {vehicleDetails.seats && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Places</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.seats}</div>
                    </div>
                  )}
                  {vehicleDetails.color && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Couleur</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.color}</div>
                    </div>
                  )}
                  {vehicleDetails.co2 && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>CO₂</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.co2} g/km</div>
                    </div>
                  )}
                  {vehicleDetails.weightKg && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>Poids</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.weightKg} kg</div>
                    </div>
                  )}
                  {vehicleDetails.ptacKg && (
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "#030229", opacity: 0.5 }}>PTAC</div>
                      <div className="text-[13px] font-medium" style={{ color: "#030229" }}>{vehicleDetails.ptacKg} kg</div>
                    </div>
                  )}
                </div>
                
                {/* Ligne technique: VIN, Type Mine, CNIT */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[rgba(3,2,41,0.06)] pt-3">
                  {vehicleDetails.vin && (
                    <div className="text-[11px]" style={{ color: "#030229", opacity: 0.7 }}>
                      <span style={{ opacity: 0.6 }}>VIN:</span> <span className="font-mono">{vehicleDetails.vin}</span>
                    </div>
                  )}
                  {vehicleDetails.typeMine && (
                    <div className="text-[11px]" style={{ color: "#030229", opacity: 0.7 }}>
                      <span style={{ opacity: 0.6 }}>Type mine:</span> {vehicleDetails.typeMine}
                    </div>
                  )}
                  {vehicleDetails.cnit && (
                    <div className="text-[11px]" style={{ color: "#030229", opacity: 0.7 }}>
                      <span style={{ opacity: 0.6 }}>CNIT:</span> {vehicleDetails.cnit}
                    </div>
                  )}
                  {vehicleDetails.engineCode && (
                    <div className="text-[11px]" style={{ color: "#030229", opacity: 0.7 }}>
                      <span style={{ opacity: 0.6 }}>Code moteur:</span> {vehicleDetails.engineCode}
                    </div>
                  )}
                </div>
                
                {/* SRA (assurance) */}
                {vehicleDetails.sraCommercial && (
                  <div className="mt-2 text-[11px]" style={{ color: "#605BFF" }}>
                    SRA: {vehicleDetails.sraCommercial}
                    {vehicleDetails.sraGroup && ` (Groupe ${vehicleDetails.sraGroup})`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
              placeholder="Ex: Renault"
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
              placeholder="Ex: Clio"
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
              placeholder="17 caractères"
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
              placeholder="Ex: Diesel"
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
              placeholder="Ex: 2020"
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
              placeholder="Ex: 1.5 dCi"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-[10px] border border-[rgba(209,26,42,0.25)] bg-[rgba(209,26,42,0.06)] px-4 py-3 text-sm" style={{ color: "#D11A2A" }}>
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
