"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Client = { id: number; firstName: string; lastName: string };
type Vehicle = { id: string; plate: string; brand: string; model: string; client: Client };

type Revision = {
  id: string;
  createdAt: string;
  hash: string;
  payload: string;
};

type Intervention = {
  id: string;
  vehicleId: string;
  type: string;
  notes?: string | null;
  createdAt: string;

  performedAt?: string | null;
  odometerKm?: number | null;
  ecuType?: string | null;
  softwareVersion?: string | null;
  checksum?: string | null;

  hash?: string | null;
  payload?: string | null;

  vehicle: Vehicle;
  revisions: Revision[];
};

type FieldErrors = {
  performedAt?: string;
  odometerKm?: string;
};

export default function InterventionDetailPage({ params }: any) {
  const routeParams = useParams();
  const router = useRouter();
  const idValue = params?.id ?? routeParams?.id;
  const id = Array.isArray(idValue) ? idValue[0] : idValue;

  const [it, setIt] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState("E85");
  const [notes, setNotes] = useState("");
  const [performedAt, setPerformedAt] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [ecuType, setEcuType] = useState("");
  const [softwareVersion, setSoftwareVersion] = useState("");
  const [checksum, setChecksum] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function load() {
    setLoading(true);
    setErr(null);
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/interventions/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Erreur serveur.");
        setIt(null);
        return;
      }
      const data: Intervention = json.intervention ?? json?.data ?? json;
      setIt(data);

      setType(data.type || "E85");
      setNotes(data.notes || "");
      setPerformedAt(data.performedAt ? data.performedAt.replace(" ", "T").slice(0, 16) : "");
      setOdometerKm(data.odometerKm ? String(data.odometerKm) : "");
      setEcuType(data.ecuType || "");
      setSoftwareVersion(data.softwareVersion || "");
      setChecksum(data.checksum || "");
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  function downloadPdf() {
    if (!id) return;
    window.location.href = `/api/interventions/${id}/pdf`;
  }

  async function deleteIntervention() {
    if (!id) return;
    if (!confirm("Supprimer cette intervention ? Les révisions seront aussi supprimées.")) return;
    setDeleting(true);
    setErr(null);

    try {
      const res = await fetch(`/api/interventions/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || (json && json.ok === false)) {
        setErr(json?.error || "Erreur serveur.");
        return;
      }
      router.push("/interventions");
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setDeleting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);

    const errors: FieldErrors = {};
    const cleanPerformedAt = performedAt.trim();
    const kmRaw = odometerKm.trim();

    if (cleanPerformedAt && Number.isNaN(Date.parse(cleanPerformedAt))) {
      errors.performedAt = "Date invalide.";
    }
    if (kmRaw) {
      const kmValue = Number(kmRaw);
      if (!Number.isFinite(kmValue) || kmValue < 0) {
        errors.odometerKm = "Kilométrage invalide.";
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErr("Merci de corriger les champs signalés.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/interventions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          notes: notes.trim() || null,
          performedAt: cleanPerformedAt || null,
          odometerKm: kmRaw ? Number(kmRaw) : null,
          ecuType: ecuType.trim() || null,
          softwareVersion: softwareVersion.trim() || null,
          checksum: checksum.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Erreur serveur.");
        return;
      }

      setMsg("Intervention mise à jour (révision ajoutée).");
      await load();
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;
  if (err) return <main style={{ padding: 24, color: "red" }}>{err}</main>;
  if (!it) return <main style={{ padding: 24 }}>Introuvable.</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Dossier intervention</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={downloadPdf} style={{ padding: "8px 10px" }}>
            Télécharger le PDF
          </button>
          <button
            onClick={deleteIntervention}
            disabled={deleting}
            style={{ padding: "8px 10px" }}
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
          <Link href="/interventions">← Retour</Link>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
        <div>
          <b>Client :</b> {it.vehicle.client.firstName} {it.vehicle.client.lastName} (ID{" "}
          {it.vehicle.client.id})
        </div>
        <div>
          <b>Véhicule :</b> {it.vehicle.plate} — {it.vehicle.brand} {it.vehicle.model}
        </div>
        <div>
          <b>Créé le :</b> {new Date(it.createdAt).toLocaleString()}
        </div>
        {it.hash && (
          <div style={{ marginTop: 8 }}>
            <b>HASH (preuve) :</b> {it.hash}
          </div>
        )}
      </div>

      <h2 style={{ marginTop: 18, fontSize: 16, fontWeight: 800 }}>
        Modifier l'intervention
      </h2>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 10,
          display: "grid",
          gap: 10,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
        }}
      >
        <div>
          <label>Type</label>
          <br />
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="E85">E85</option>
            <option value="Reprog">Reprog</option>
            <option value="Diag">Diag</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div>
          <label>Notes</label>
          <br />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: 8 }} />
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Date (optionnel)</label>
            <br />
            <input
              value={performedAt}
              onChange={(e) => {
                setPerformedAt(e.target.value);
                setFieldErrors((prev) => ({ ...prev, performedAt: undefined }));
              }}
              type="datetime-local"
              aria-invalid={Boolean(fieldErrors.performedAt)}
              style={{ width: "100%", padding: 8 }}
            />
            {fieldErrors.performedAt && (
              <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
                {fieldErrors.performedAt}
              </div>
            )}
          </div>
          <div>
            <label>Kilométrage (optionnel)</label>
            <br />
            <input
              value={odometerKm}
              onChange={(e) => {
                setOdometerKm(e.target.value);
                setFieldErrors((prev) => ({ ...prev, odometerKm: undefined }));
              }}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              aria-invalid={Boolean(fieldErrors.odometerKm)}
              placeholder="123456"
              style={{ width: "100%", padding: 8 }}
            />
            {fieldErrors.odometerKm && (
              <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
                {fieldErrors.odometerKm}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
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

        <button disabled={saving} style={{ padding: 10 }}>
          {saving ? "Mise à jour..." : "Enregistrer (crée une révision)"}
        </button>

        {msg && <p style={{ color: "green" }}>{msg}</p>}
        {err && <p style={{ color: "red" }}>{err}</p>}
      </form>

      <h2 style={{ marginTop: 18, fontSize: 16, fontWeight: 800 }}>
        Historique des révisions
      </h2>

      {it.revisions.length === 0 ? (
        <p>Aucune révision.</p>
      ) : (
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {it.revisions.map((r, idx) => (
            <div key={r.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
              <div style={{ fontWeight: 800 }}>
                Révision {idx + 1} — {new Date(r.createdAt).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, marginTop: 6 }}>
                <b>HASH :</b> {r.hash}
              </div>
              <details style={{ marginTop: 8 }}>
                <summary>Voir payload</summary>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{r.payload}</pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}