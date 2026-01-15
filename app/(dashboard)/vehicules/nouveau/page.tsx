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
  brand: string;
  model: string;
  variant?: string;
  vin?: string;
  fuel?: string;
  year?: number;
  engine?: string;
  powerFiscal?: number;
  powerKw?: number;
  ccm?: number;
  cylinders?: number;
  gearbox?: string;
  color?: string;
  weightKg?: number;
  co2?: number;
  firstRegistrationDate?: string;
  logoUrl?: string;
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
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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

  async function lookupPlate() {
    if (!plate.trim()) {
      setLookupError("Entrez une plaque d'immatriculation.");
      return;
    }
    
    try {
      setLookupLoading(true);
      setLookupError(null);
      setLookupSuccess(false);
      setLogoUrl(null);
      
      const res = await fetch("/api/vehicules/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ immatriculation: plate.trim() }),
      });
      
      const json = await res.json().catch(() => null);
      
      if (!res.ok || !json?.ok) {
        const errorMsg = json?.error?.message || "Erreur lors de la recherche.";
        setLookupError(errorMsg);
        return;
      }
      
      const prefill = json.data?.data as VehiclePrefill | undefined;
      if (!prefill) {
        setLookupError("Aucune donnée trouvée.");
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
      setLookupError("Erreur de connexion.");
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
            onClick={lookupPlate}
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
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo marque"
              className="h-[40px] w-auto object-contain"
              onError={() => setLogoUrl(null)}
            />
          )}
        </div>
        
        {lookupError && (
          <div className="mb-4 rounded-[10px] border border-[rgba(209,26,42,0.25)] bg-[rgba(209,26,42,0.06)] px-4 py-2 text-[12px]" style={{ color: "#D11A2A" }}>
            {lookupError}
          </div>
        )}
        
        {lookupSuccess && (
          <div className="mb-4 rounded-[10px] border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.06)] px-4 py-2 text-[12px]" style={{ color: "#16a34a" }}>
            ✓ Véhicule trouvé — champs pré-remplis
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
