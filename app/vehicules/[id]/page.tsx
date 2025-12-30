"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AddInterventionForm from "../AddInterventionForm";

type Client = { id: number; firstName: string; lastName: string };

type Intervention = {
  id: string;
  type: string;
  notes?: string | null;
  createdAt: string;
  hash?: string | null;
  performedAt?: string | null;
  odometerKm?: number | null;
  ecuType?: string | null;
  softwareVersion?: string | null;
  checksum?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
};

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  vin?: string | null;
  fuel?: string | null;
  createdAt: string;
  client: Client;
  interventions: Intervention[];
};

export default function VehicleDetailsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    // Guard: avoid calling the API if id is not provided yet
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/vehicules/${id}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.ok === false)) {
        setErr(data?.error || "Véhicule introuvable");
        setVehicle(null);
        return;
      }

      // API returns standardized { ok: true, data } or legacy direct vehicle
      const vehiclePayload = data?.ok ? data.data : data;
      setVehicle(vehiclePayload ?? null);
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dossier véhicule</h1>
        <Link href="/vehicules">← Retour</Link>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>Chargement…</p>
      ) : err ? (
        <p style={{ marginTop: 16, color: "red" }}>{err}</p>
      ) : !vehicle ? (
        <p style={{ marginTop: 16 }}>Véhicule introuvable.</p>
      ) : (
        <>
          <section style={{ marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Nouvelle intervention</h3>
            <AddInterventionForm vehicleId={vehicle.id} onDone={() => load()} />
          </section>

          <div style={{ marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {vehicle.plate} — {vehicle.brand} {vehicle.model}
            </div>
            <div style={{ marginTop: 6, opacity: 0.85 }}>
              Client : {vehicle.client.firstName} {vehicle.client.lastName} (ID {vehicle.client.id})
            </div>
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
              VIN : {vehicle.vin || "-"} <br />
              Carburant : {vehicle.fuel || "-"} <br />
              Créé le : {new Date(vehicle.createdAt).toLocaleString()}
            </div>
          </div>

          <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 800 }}>Interventions</h2>

          {vehicle.interventions.length === 0 ? (
            <p style={{ marginTop: 10 }}>Aucune intervention pour le moment.</p>
          ) : (
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {vehicle.interventions.map((it) => (
                <div key={it.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                  <div style={{ fontWeight: 800 }}>
                    {it.type} — {new Date(it.createdAt).toLocaleString()}
                  </div>
                  {it.notes && <div style={{ marginTop: 6 }}>{it.notes}</div>}
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                      <strong>Hash:</strong> {it.hash ?? "-"}
                    </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
