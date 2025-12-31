// app/interventions/page.tsx
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type FieldErrors = {
  vehicleId?: string;
  performedAt?: string;
  odometerKm?: string;
};

const PAGE_SIZE = 10;

type SortKey = "recent" | "vehicle" | "type";

export default function InterventionsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("E85");
  const [notes, setNotes] = useState("");

  // champs optionnels
  const [performedAt, setPerformedAt] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [ecuType, setEcuType] = useState("");
  const [softwareVersion, setSoftwareVersion] = useState("");
  const [checksum, setChecksum] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);

  async function loadAll() {
    setErr(null);

    try {
      const v = await fetch("/api/vehicules", { cache: "no-store" });
      const vjson = await v.json().catch(() => null);
      const vlist = Array.isArray(vjson)
        ? vjson
        : Array.isArray(vjson?.data)
        ? vjson.data
        : Array.isArray(vjson?.vehicles)
        ? vjson.vehicles
        : [];
      setVehicles(vlist);

      const i = await fetch("/api/interventions", { cache: "no-store" });
      const ij = await i.json().catch(() => null);

      // selon ton helper success(), cela peut etre {ok:true, data:...}
      const list = Array.isArray(ij?.interventions)
        ? ij.interventions
        : Array.isArray(ij?.data)
        ? ij.data
        : ij?.data?.interventions ?? [];

      setInterventions(list);
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, vehicleFilter, typeFilter, sort]);

  const filteredInterventions = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...interventions];

    if (vehicleFilter) {
      list = list.filter((it) => it.vehicleId === vehicleFilter);
    }

    if (typeFilter) {
      list = list.filter((it) => it.type === typeFilter);
    }

    if (query) {
      list = list.filter((it) => {
        const haystack = [
          it.type,
          it.notes ?? "",
          it.vehicle?.plate ?? "",
          it.vehicle?.brand ?? "",
          it.vehicle?.model ?? "",
          it.vehicle?.client?.firstName ?? "",
          it.vehicle?.client?.lastName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    list.sort((a, b) => {
      if (sort === "vehicle") {
        return a.vehicle.plate.localeCompare(b.vehicle.plate);
      }
      if (sort === "type") {
        return a.type.localeCompare(b.type);
      }

      const aDate = Date.parse(a.createdAt);
      const bDate = Date.parse(b.createdAt);
      if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) return bDate - aDate;
      return b.id.localeCompare(a.id);
    });

    return list;
  }, [interventions, search, vehicleFilter, typeFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredInterventions.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedInterventions = filteredInterventions.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    const errors: FieldErrors = {};
    const cleanPerformedAt = performedAt.trim();
    const kmRaw = odometerKm.trim();

    if (!vehicleId) errors.vehicleId = "Sélectionne un véhicule.";
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
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          type,
          notes: notes.trim() || null,
          performedAt: cleanPerformedAt || null,
          odometerKm: kmRaw ? Number(kmRaw) : null,
          ecuType: ecuType.trim() || null,
          softwareVersion: softwareVersion.trim() || null,
          checksum: checksum.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error || "Erreur serveur.");
        return;
      }

      setMsg("Intervention enregistrée.");
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

  async function removeIntervention(id: string) {
    if (!confirm("Supprimer cette intervention ?")) return;
    setDeletingId(id);
    setErr(null);

    try {
      const res = await fetch(`/api/interventions/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || (json && json.ok === false)) {
        setErr(json?.error || "Erreur serveur.");
        return;
      }
      await loadAll();
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Interventions</h1>

      <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/">← Retour</Link>
        <Link href="/clients">→ Clients</Link>
        <Link href="/vehicules">→ Véhicules</Link>
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
          <label>Véhicule</label>
          <br />
          <select
            value={vehicleId}
            onChange={(e) => {
              setVehicleId(e.target.value);
              setFieldErrors((prev) => ({ ...prev, vehicleId: undefined }));
            }}
            required
            aria-invalid={Boolean(fieldErrors.vehicleId)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Choisir un véhicule --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.brand} {v.model} — {v.client.firstName} {v.client.lastName}
              </option>
            ))}
          </select>
          {fieldErrors.vehicleId && (
            <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
              {fieldErrors.vehicleId}
            </div>
          )}
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

        <button disabled={loading || !vehicleId} style={{ padding: 10 }}>
          {loading ? "Enregistrement..." : "Enregistrer l'intervention"}
        </button>

        {msg && <p style={{ color: "green" }}>{msg}</p>}
        {err && <p style={{ color: "red" }}>{err}</p>}
      </form>

      <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>Historique</h2>

      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Recherche (client, immat, note...)"
          style={{ minWidth: 240, padding: 8 }}
        />
        <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} style={{ padding: 8 }}>
          <option value="">Tous les véhicules</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate} — {v.brand} {v.model}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: 8 }}>
          <option value="">Tous les types</option>
          <option value="E85">E85</option>
          <option value="Reprog">Reprog</option>
          <option value="Diag">Diag</option>
          <option value="Autre">Autre</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ padding: 8 }}>
          <option value="recent">Tri : plus récents</option>
          <option value="vehicle">Tri : véhicule</option>
          <option value="type">Tri : type</option>
        </select>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {filteredInterventions.length} résultat{filteredInterventions.length > 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {pagedInterventions.map((it) => (
          <div
            key={it.id}
            style={{ padding: 12, border: "1px solid #eee", borderRadius: 10 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>
                {it.type} — {it.vehicle.plate} — {it.vehicle.client.firstName} {it.vehicle.client.lastName}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Link href={`/interventions/${it.id}`}>Ouvrir</Link>
                <button
                  onClick={() => removeIntervention(it.id)}
                  disabled={deletingId === it.id}
                >
                  {deletingId === it.id ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {new Date(it.createdAt).toLocaleString()}
            </div>

            {it.notes && <div style={{ marginTop: 6 }}>{it.notes}</div>}

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              IP: {it.clientIp || "?"} — UA:{" "}
              {it.userAgent ? it.userAgent.slice(0, 60) + "..." : "?"}
            </div>

            {it.hash && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                <b>HASH</b> : {it.hash.slice(0, 24)}...
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredInterventions.length === 0 && (
        <p style={{ marginTop: 12 }}>Aucune intervention pour le moment.</p>
      )}

      {filteredInterventions.length > 0 && (
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
      )}
    </main>
  );
}