"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";
import { SectionHeader } from "@/components/ui/SectionHeader";

type VehicleDetails = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  client: { id: number; firstName: string; lastName: string };
  interventions: Array<{
    id: string;
    type: string;
    notes?: string | null;
    createdAt: string;
    performedAt?: string | null;
  }>;
};

const INTERVENTION_TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function VehiculeDetailPage() {
  const params = useParams();
  const vehicleId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "E85",
    notes: "",
    performedAt: "",
    odometerKm: "",
    ecuType: "",
    softwareVersion: "",
    checksum: "",
  });

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<VehicleDetails>(`/api/vehicules/${vehicleId}`, {
        noStore: true,
      });
      setVehicle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const createIntervention = async () => {
    if (!vehicleId) return;
    setError(null);
    try {
      const payload = {
        vehicleId,
        type: form.type,
        notes: form.notes || null,
        performedAt: form.performedAt || null,
        odometerKm: form.odometerKm || null,
        ecuType: form.ecuType || null,
        softwareVersion: form.softwareVersion || null,
        checksum: form.checksum || null,
      };
      await requestJson("/api/interventions", { method: "POST", body: payload });
      setForm({
        type: "E85",
        notes: "",
        performedAt: "",
        odometerKm: "",
        ecuType: "",
        softwareVersion: "",
        checksum: "",
      });
      await loadVehicle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    }
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={vehicle ? vehicle.plate : "Véhicule"}
        description="Dossier véhicule et historique des interventions."
        action={
          <Link
            href="/vehicules"
            className="text-sm font-semibold text-primary hover:text-primaryHover"
          >
            Retour véhicules
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Loading />
      ) : vehicle ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="ms-kicker">Véhicule</p>
                  <h2 className="mt-2 text-xl font-semibold text-text">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <p className="text-sm text-muted2">
                    Client: {vehicle.client.firstName} {vehicle.client.lastName}
                  </p>
                </div>
                <Badge variant="accent">{vehicle.plate}</Badge>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-muted2">
                <p>VIN: {vehicle.vin || "-"}</p>
                <p>Carburant: {vehicle.fuel || "-"}</p>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="ms-kicker">Interventions</p>
                  <h2 className="mt-2 text-xl font-semibold text-text">Historique</h2>
                </div>
                <Badge variant="accent">{vehicle.interventions.length}</Badge>
              </div>
              <div className="mt-6 grid gap-3">
                {vehicle.interventions.length === 0 ? (
                  <p className="text-sm text-muted2">Aucune intervention.</p>
                ) : (
                  vehicle.interventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r)] border border-border bg-surface2 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text">{intervention.type}</p>
                        <p className="text-xs text-muted2">
                          {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Link
                          href={`/interventions/${intervention.id}`}
                          className="font-semibold text-primary hover:text-primaryHover"
                        >
                          Détails
                        </Link>
                        <a
                          href={`/api/interventions/${intervention.id}/pdf`}
                          className="font-semibold text-primary hover:text-primaryHover"
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="grid gap-5">
            <div>
              <p className="ms-kicker">Nouvelle intervention</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Ajouter un dossier</h2>
            </div>
            <Select
              label="Type"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            >
              {INTERVENTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Input
              label="Date réalisée"
              type="datetime-local"
              value={form.performedAt}
              onChange={(event) => setForm((prev) => ({ ...prev, performedAt: event.target.value }))}
            />
            <Input
              label="Kilométrage"
              value={form.odometerKm}
              onChange={(event) => setForm((prev) => ({ ...prev, odometerKm: event.target.value }))}
              placeholder="120000"
            />
            <Input
              label="ECU"
              value={form.ecuType}
              onChange={(event) => setForm((prev) => ({ ...prev, ecuType: event.target.value }))}
              placeholder="Bosch EDC17"
            />
            <Input
              label="Version logicielle"
              value={form.softwareVersion}
              onChange={(event) => setForm((prev) => ({ ...prev, softwareVersion: event.target.value }))}
              placeholder="v3.2"
            />
            <Input
              label="Checksum"
              value={form.checksum}
              onChange={(event) => setForm((prev) => ({ ...prev, checksum: event.target.value }))}
              placeholder="SHA256"
            />
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Détails de l'intervention"
            />
            <LegalReferencesPanel type={form.type} />
            <Button onClick={createIntervention}>Créer l’intervention</Button>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-muted2">Véhicule introuvable.</p>
      )}
    </div>
  );
}
