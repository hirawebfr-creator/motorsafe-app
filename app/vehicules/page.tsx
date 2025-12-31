"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Client = { id: number; firstName: string; lastName: string };

type Vehicle = {
  id: string;
  clientId: number;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  createdAt: string;
  client: Client;
};

type FieldErrors = {
  clientId?: string;
  brand?: string;
  model?: string;
  plate?: string;
  vin?: string;
};

const PAGE_SIZE = 10;

type SortKey = "recent" | "plate" | "client";

export default function VehiculesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [clientId, setClientId] = useState<number | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [fuel, setFuel] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<number | "">("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);

  async function loadAll() {
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      // /api/clients -> selon ton projet, cela peut renvoyer tableau direct ou { ok, data }
      const cRes = await fetch("/api/clients", { cache: "no-store" });
      const cJson = await cRes.json().catch(() => null);
      const cList: Client[] =
        cJson && cJson.ok && Array.isArray(cJson.data)
          ? (cJson.data as Client[])
          : Array.isArray(cJson)
          ? (cJson as Client[])
          : [];
      setClients(cList);

      // /api/vehicules -> retourne un tableau direct
      const vRes = await fetch("/api/vehicules", { cache: "no-store" });
      const vJson = await vRes.json().catch(() => null);
      const vList: Vehicle[] =
        vJson && vJson.ok && Array.isArray(vJson.data)
          ? (vJson.data as Vehicle[])
          : Array.isArray(vJson)
          ? (vJson as Vehicle[])
          : [];
      setVehicles(vList);
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, clientFilter, sort]);

  // Log any vehicles missing `id` for debugging (avoid logging during render)
  useEffect(() => {
    vehicles.forEach((v) => {
      // If a vehicle is missing an id, keep silent in production; this
      // should not happen because the API normalizes ids.
      if (!v.id) console.debug("Vehicule without id in list:", v);
    });
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...vehicles];

    if (clientFilter) {
      list = list.filter((v) => Number(v.clientId) === Number(clientFilter));
    }

    if (query) {
      list = list.filter((v) => {
        const haystack = [
          v.plate,
          v.brand,
          v.model,
          v.vin ?? "",
          v.fuel ?? "",
          v.client?.firstName ?? "",
          v.client?.lastName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    list.sort((a, b) => {
      if (sort === "plate") return a.plate.localeCompare(b.plate);
      if (sort === "client") {
        const aName = `${a.client?.lastName ?? ""} ${a.client?.firstName ?? ""}`.trim();
        const bName = `${b.client?.lastName ?? ""} ${b.client?.firstName ?? ""}`.trim();
        return aName.localeCompare(bName);
      }

      const aDate = Date.parse(a.createdAt);
      const bDate = Date.parse(b.createdAt);
      if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) return bDate - aDate;
      return b.plate.localeCompare(a.plate);
    });

    return list;
  }, [vehicles, search, clientFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedVehicles = filteredVehicles.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    const cleanBrand = brand.trim();
    const cleanModel = model.trim();
    const cleanPlate = plate.trim().toUpperCase();
    const cleanVin = vin.trim().toUpperCase();
    const cleanFuel = fuel.trim();

    const errors: FieldErrors = {};
    if (!clientId) errors.clientId = "Sélectionne un client.";
    if (!cleanBrand) errors.brand = "La marque est obligatoire.";
    if (!cleanModel) errors.model = "Le modèle est obligatoire.";
    if (!cleanPlate) errors.plate = "L'immatriculation est obligatoire.";
    if (cleanPlate && cleanPlate.length < 2) errors.plate = "Immatriculation trop courte.";
    if (cleanVin && !/^[A-Z0-9]{17}$/.test(cleanVin)) {
      errors.vin = "VIN invalide (17 caractères alphanumériques).";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErr("Merci de corriger les champs signalés.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/vehicules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          brand: cleanBrand,
          model: cleanModel,
          plate: cleanPlate,
          vin: cleanVin || null,
          fuel: cleanFuel || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.ok === false)) {
        setErr(data?.error || "Erreur serveur.");
        return;
      }

      const created: Vehicle = data?.ok ? data.data : data;

      // Show newly created vehicle immediately
      if (created) setVehicles((prev) => [created as Vehicle, ...prev]);

      // Also refresh clients/vehicles to keep form state accurate
      await loadAll();

      setMsg("Véhicule enregistré.");
      setClientId("");
      setBrand("");
      setModel("");
      setPlate("");
      setVin("");
      setFuel("");
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Véhicules</h1>

      <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/">← Retour</Link>
        <Link href="/clients">→ Clients</Link>
        <Link href="/interventions">→ Interventions</Link>
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 16,
          display: "grid",
          gap: 12,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
        }}
      >
        <div>
          <label>Client</label>
          <br />
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value ? Number(e.target.value) : "");
              setFieldErrors((prev) => ({ ...prev, clientId: undefined }));
            }}
            required
            aria-invalid={Boolean(fieldErrors.clientId)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Choisir un client --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} (ID {c.id})
              </option>
            ))}
          </select>
          {fieldErrors.clientId && (
            <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
              {fieldErrors.clientId}
            </div>
          )}
          {clients.length === 0 && (
            <p style={{ marginTop: 8, color: "#a00" }}>
              Aucun client trouvé — créez d'abord un client sur la page Clients.
            </p>
          )}
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Marque</label>
            <br />
            <input
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setFieldErrors((prev) => ({ ...prev, brand: undefined }));
              }}
              required
              aria-invalid={Boolean(fieldErrors.brand)}
              style={{ width: "100%", padding: 8 }}
            />
            {fieldErrors.brand && (
              <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
                {fieldErrors.brand}
              </div>
            )}
          </div>
          <div>
            <label>Modèle</label>
            <br />
            <input
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setFieldErrors((prev) => ({ ...prev, model: undefined }));
              }}
              required
              aria-invalid={Boolean(fieldErrors.model)}
              style={{ width: "100%", padding: 8 }}
            />
            {fieldErrors.model && (
              <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
                {fieldErrors.model}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Immatriculation</label>
            <br />
            <input
              value={plate}
              onChange={(e) => {
                setPlate(e.target.value.toUpperCase());
                setFieldErrors((prev) => ({ ...prev, plate: undefined }));
              }}
              required
              maxLength={12}
              placeholder="AA-123-BB"
              aria-invalid={Boolean(fieldErrors.plate)}
              style={{ width: "100%", padding: 8 }}
            />
            {fieldErrors.plate && (
              <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
                {fieldErrors.plate}
              </div>
            )}
          </div>
          <div>
            <label>VIN</label>
            <br />
            <input
              value={vin}
              onChange={(e) => {
                setVin(e.target.value.toUpperCase());
                setFieldErrors((prev) => ({ ...prev, vin: undefined }));
              }}
              maxLength={17}
              placeholder="17 caractères"
              aria-invalid={Boolean(fieldErrors.vin)}
              style={{ width: "100%", padding: 8 }}
            />
            {fieldErrors.vin && (
              <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
                {fieldErrors.vin}
              </div>
            )}
          </div>
        </div>

        <div>
          <label>Carburant</label>
          <br />
          <input
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            placeholder="Essence / Diesel / FlexFuel"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button
          disabled={saving || clientId === "" || clients.length === 0}
          style={{ padding: 10 }}
        >
          {saving ? "Enregistrement..." : "Enregistrer le véhicule"}
        </button>

        {msg && <p style={{ color: "green" }}>{msg}</p>}
        {err && <p style={{ color: "red" }}>{err}</p>}
      </form>

      <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>
        Liste des véhicules
      </h2>

      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Recherche (immat, marque, client...)"
          style={{ minWidth: 240, padding: 8 }}
        />
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value ? Number(e.target.value) : "")}
          style={{ padding: 8 }}
        >
          <option value="">Tous les clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ padding: 8 }}>
          <option value="recent">Tri : plus récents</option>
          <option value="plate">Tri : immatriculation</option>
          <option value="client">Tri : client</option>
        </select>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {filteredVehicles.length} résultat{filteredVehicles.length > 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : filteredVehicles.length === 0 ? (
        <p>Aucun véhicule pour le moment.</p>
      ) : (
        <>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {pagedVehicles.map((v) => (
              <div
                key={v.id ?? v.plate}
                style={{ padding: 12, border: "1px solid #eee", borderRadius: 10 }}
              >
                <div style={{ fontWeight: 700 }}>
                  {v.plate} — {v.brand} {v.model}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Client : {v.client?.firstName} {v.client?.lastName}
                </div>

                <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                  {v.id ? (
                    <Link href={`/vehicules/${v.id}`}>Ouvrir le dossier</Link>
                  ) : (
                    <span style={{ color: "#999" }}>Identifiant manquant</span>
                  )}
                  {/* no-op: logging handled in useEffect */}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Précédent
            </button>
            <span style={{ fontSize: 12 }}>
              Page {page} / {pageCount}
            </span>
            <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
              Suivant
            </button>
          </div>
        </>
      )}
    </main>
  );
}