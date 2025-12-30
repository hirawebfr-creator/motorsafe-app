"use client";

import { FormEvent, useEffect, useState } from "react";
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

  async function loadAll() {
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      // /api/clients -> selon ton projet, ça peut renvoyer tableau direct OU {ok, clients}
      const cRes = await fetch("/api/clients", { cache: "no-store" });
      const cJson = await cRes.json().catch(() => null);
      const cList: Client[] =
        cJson && cJson.ok && Array.isArray(cJson.data)
          ? (cJson.data as Client[])
          : Array.isArray(cJson)
          ? (cJson as Client[])
          : [];
      setClients(cList);

      // /api/vehicules -> ON A FIX: ça renvoie un tableau direct
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

  // Log any vehicles missing `id` for debugging (avoid logging during render)
  useEffect(() => {
    vehicles.forEach((v) => {
      // If a vehicle is missing an id, keep silent in production; this
      // should not happen because the API normalizes ids.
      if (!v.id) console.debug("Vehicule without id in list:", v);
    });
  }, [vehicles]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch("/api/vehicules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          brand,
          model,
          plate,
          vin: vin || null,
          fuel: fuel || null,
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

      setMsg("Véhicule enregistré ✅");
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
            onChange={(e) =>
              setClientId(e.target.value ? Number(e.target.value) : "")
            }
            required
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Choisir un client --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} (ID {c.id})
              </option>
            ))}
          </select>
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
              onChange={(e) => setBrand(e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div>
            <label>Modèle</label>
            <br />
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Immat</label>
            <br />
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div>
            <label>VIN</label>
            <br />
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        </div>

        <div>
          <label>Carburant</label>
          <br />
          <input
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            placeholder="Essence / Diesel / FlexFuel ..."
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button disabled={saving || clientId === ""} style={{ padding: 10 }}>
          {saving ? "Enregistrement..." : "Enregistrer le véhicule"}
        </button>

        {msg && <p style={{ color: "green" }}>{msg}</p>}
        {err && <p style={{ color: "red" }}>{err}</p>}
      </form>

      <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>
        Liste des véhicules
      </h2>

      {loading ? (
        <p>Chargement…</p>
      ) : vehicles.length === 0 ? (
        <p>Aucun véhicule pour le moment.</p>
      ) : (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {vehicles.map((v) => (
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
      )}
    </main>
  );
}
