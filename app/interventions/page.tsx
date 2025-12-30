// app/interventions/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Client = { id: number; firstName: string; lastName: string };
type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: Client;
};

type Intervention = {
  id: string;
  vehicleId: string;
  type: string;
  notes?: string | null;
  createdAt: string;
  clientIp?: string | null;
  userAgent?: string | null;

  hash?: string | null;
  payload?: string | null;

  performedAt?: string | null;
  odometerKm?: number | null;
  ecuType?: string | null;
  softwareVersion?: string | null;
  checksum?: string | null;

  vehicle: Vehicle;
};

export default function InterventionsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("E85");
  const [notes, setNotes] = useState("");

  // champs “pro”
  const [performedAt, setPerformedAt] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [ecuType, setEcuType] = useState("");
  const [softwareVersion, setSoftwareVersion] = useState("");
  const [checksum, setChecksum] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function loadAll() {
    setErr(null);

    const v = await fetch("/api/vehicules", { cache: "no-store" });
    const vjson = await v.json();
    const vlist = Array.isArray(vjson)
      ? vjson
      : Array.isArray(vjson?.data)
      ? vjson.data
      : Array.isArray(vjson?.vehicles)
      ? vjson.vehicles
      : [];
    setVehicles(vlist);

    const i = await fetch("/api/interventions", { cache: "no-store" });
    const ij = await i.json();

    // selon ton helper success(), ça peut être {ok:true, data:...}
    const list = Array.isArray(ij?.interventions)
      ? ij.interventions
      : Array.isArray(ij?.data)
      ? ij.data
      : ij?.data?.interventions ?? [];

    setInterventions(list);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          type,
          notes: notes || null,
          performedAt: performedAt || null,
          odometerKm: odometerKm ? Number(odometerKm) : null,
          ecuType: ecuType || null,
          softwareVersion: softwareVersion || null,
          checksum: checksum || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Erreur serveur.");
        return;
      }

      setMsg("Intervention enregistrée ✅");
      setNotes("");
      setPerformedAt("");
      setOdometerKm("");
      setEcuType("");
      setSoftwareVersion("");
      setChecksum("");
      await loadAll();
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Interventions</h1>

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
          <label>Véhicule</label>
          <br />
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Choisir un véhicule --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.brand} {v.model} — {v.client.firstName} {v.client.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Type</label>
          <br />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="E85">E85</option>
            <option value="Reprog">Reprog</option>
            <option value="Diag">Diag</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div>
          <label>Notes</label>
          <br />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: 8 }}
            placeholder="Détails, précautions, infos client..."
          />
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Date intervention (optionnel)</label>
            <br />
            <input
              value={performedAt}
              onChange={(e) => setPerformedAt(e.target.value)}
              placeholder="2025-12-30 14:30"
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div>
            <label>Kilométrage (optionnel)</label>
            <br />
            <input
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              placeholder="123456"
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>ECU (optionnel)</label>
            <br />
            <input
              value={ecuType}
              onChange={(e) => setEcuType(e.target.value)}
              placeholder="EDC17 / MED17..."
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div>
            <label>Version soft (optionnel)</label>
            <br />
            <input
              value={softwareVersion}
              onChange={(e) => setSoftwareVersion(e.target.value)}
              placeholder="SW1234..."
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        </div>

        <div>
          <label>Checksum (optionnel)</label>
          <br />
          <input
            value={checksum}
            onChange={(e) => setChecksum(e.target.value)}
            placeholder="ABCDEF..."
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button disabled={loading} style={{ padding: 10 }}>
          {loading ? "Enregistrement..." : "Enregistrer l’intervention"}
        </button>

        {msg && <p style={{ color: "green" }}>{msg}</p>}
        {err && <p style={{ color: "red" }}>{err}</p>}
      </form>

      <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>Historique</h2>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {interventions.map((it) => (
          <div
            key={it.id}
            style={{ padding: 12, border: "1px solid #eee", borderRadius: 10 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>
                {it.type} — {it.vehicle.plate} — {it.vehicle.client.firstName}{" "}
                {it.vehicle.client.lastName}
              </div>
              <Link href={`/interventions/${it.id}`}>Ouvrir</Link>
            </div>

            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {new Date(it.createdAt).toLocaleString()}
            </div>

            {it.notes && <div style={{ marginTop: 6 }}>{it.notes}</div>}

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              IP: {it.clientIp || "?"} — UA:{" "}
              {it.userAgent ? it.userAgent.slice(0, 60) + "…" : "?"}
            </div>

            {it.hash && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                <b>HASH</b> : {it.hash.slice(0, 24)}…
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
