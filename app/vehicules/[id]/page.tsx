"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

type FieldErrors = {
  brand?: string;
  model?: string;
  plate?: string;
  vin?: string;
};

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [fuel, setFuel] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function load() {
    setLoading(true);
    setErr(null);
    setMsg(null);

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

      setBrand(vehiclePayload?.brand ?? "");
      setModel(vehiclePayload?.model ?? "");
      setPlate(vehiclePayload?.plate ?? "");
      setVin(vehiclePayload?.vin ?? "");
      setFuel(vehiclePayload?.fuel ?? "");
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

  async function saveVehicle() {
    if (!id) return;
    setMsg(null);
    setErr(null);

    const cleanBrand = brand.trim();
    const cleanModel = model.trim();
    const cleanPlate = plate.trim().toUpperCase();
    const cleanVin = vin.trim().toUpperCase();
    const cleanFuel = fuel.trim();

    const errors: FieldErrors = {};
    if (!cleanBrand) errors.brand = "La marque est obligatoire.";
    if (!cleanModel) errors.model = "Le modèle est obligatoire.";
    if (!cleanPlate) errors.plate = "L'immatriculation est obligatoire.";
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
      const res = await fetch(`/api/vehicules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

      const updated = data?.ok ? data.data : data;
      setVehicle(updated ?? null);
      setMsg("Véhicule mis à jour.");
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVehicle() {
    if (!id) return;
    if (!confirm("Supprimer ce véhicule ? Toutes les interventions seront aussi supprimées.")) return;
    setDeleting(true);
    setErr(null);

    try {
      const res = await fetch(`/api/vehicules/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.ok === false)) {
        setErr(data?.error || "Erreur serveur.");
        return;
      }
      router.push("/vehicules");
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dossier véhicule</h1>
        <Link href="/vehicules">← Retour</Link>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>Chargement...</p>
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

          <section style={{ marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Modifier le véhicule</h3>
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
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
                    aria-invalid={Boolean(fieldErrors.vin)}
                    placeholder="17 caractères"
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

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={saveVehicle} disabled={saving} style={{ padding: 8 }}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button onClick={deleteVehicle} disabled={deleting} style={{ padding: 8 }}>
                  {deleting ? "Suppression..." : "Supprimer le véhicule"}
                </button>
              </div>

              {msg && <p style={{ color: "green" }}>{msg}</p>}
              {err && <p style={{ color: "red" }}>{err}</p>}
            </div>
          </section>

          <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 800 }}>Interventions</h2>

          {vehicle.interventions.length === 0 ? (
            <p style={{ marginTop: 10 }}>Aucune intervention pour le moment.</p>
          ) : (
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {vehicle.interventions.map((it) => (
                <div key={it.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 800 }}>
                      {it.type} — {new Date(it.createdAt).toLocaleString()}
                    </div>
                    <Link href={`/interventions/${it.id}`}>Ouvrir</Link>
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