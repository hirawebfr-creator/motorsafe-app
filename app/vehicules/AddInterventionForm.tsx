"use client";

import { FormEvent, useState } from "react";

type Props = { vehicleId: string; onDone?: () => void };

export default function AddInterventionForm({ vehicleId, onDone }: Props) {
  const [type, setType] = useState("E85");
  const [notes, setNotes] = useState("");
  const [performedAt, setPerformedAt] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [ecuType, setEcuType] = useState("");
  const [softwareVersion, setSoftwareVersion] = useState("");
  const [checksum, setChecksum] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

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

      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.ok === false)) {
        setErr(data?.error || "Erreur serveur");
        return;
      }

      setMsg("Intervention ajoutée");
      setNotes("");
      setPerformedAt("");
      setOdometerKm("");
      setEcuType("");
      setSoftwareVersion("");
      setChecksum("");

      if (onDone) onDone();
    } catch (e) {
      setErr("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="E85">E85</option>
          <option value="Reprog">Reprog</option>
          <option value="Diag">Diag</option>
          <option value="Autre">Autre</option>
        </select>
        <input value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} type="datetime-local" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} placeholder="Odomètre (km)" />
        <input value={ecuType} onChange={(e) => setEcuType(e.target.value)} placeholder="ECU type" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input value={softwareVersion} onChange={(e) => setSoftwareVersion(e.target.value)} placeholder="Software version" />
        <input value={checksum} onChange={(e) => setChecksum(e.target.value)} placeholder="Checksum" />
      </div>

      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notes (détails)" />

      <div>
        <button disabled={loading} style={{ padding: 8 }}>{loading ? "Enregistrement..." : "Ajouter l'intervention"}</button>
        {msg && <span style={{ marginLeft: 8, color: "green" }}>{msg}</span>}
        {err && <span style={{ marginLeft: 8, color: "red" }}>{err}</span>}
      </div>
    </form>
  );
}
