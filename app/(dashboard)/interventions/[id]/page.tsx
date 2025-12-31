"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetcher } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";

type InterventionDetail = {
  id: string;
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
  clientIp?: string | null;
  userAgent?: string | null;
  createdBy?: string | null;
  vehicle: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    client: { firstName: string; lastName: string };
  };
  revisions: Array<{
    id: string;
    createdAt: string;
    hash: string;
    payload: string;
  }>;
};

export default function InterventionDetailPage() {
  const params = useParams();
  const interventionId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIntervention = async () => {
    if (!interventionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<InterventionDetail>(`/api/interventions/${interventionId}`, {
        noStore: true,
      });
      setIntervention(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntervention();
  }, [interventionId]);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Intervention</p>
          <h1 className="mt-3 text-3xl font-semibold">
            {intervention ? `Dossier ${intervention.vehicle.plate}` : "Dossier intervention"}
          </h1>
        </div>
        <Link href="/interventions" className="text-sm text-[var(--accent-2)]">
          Retour interventions
        </Link>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Loading />
      ) : intervention ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <Card className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Vehicule</p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {intervention.vehicle.brand} {intervention.vehicle.model}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                  </p>
                </div>
                <Badge variant="accent">{intervention.type}</Badge>
              </div>
              <div className="grid gap-2 text-sm text-[var(--muted)]">
                <p>Date creation: {new Date(intervention.createdAt).toLocaleString("fr-FR")}</p>
                <p>
                  Date realisee:{" "}
                  {intervention.performedAt
                    ? new Date(intervention.performedAt).toLocaleString("fr-FR")
                    : "-"}
                </p>
                <p>Kilometrage: {intervention.odometerKm ?? "-"}</p>
                <p>ECU: {intervention.ecuType || "-"}</p>
                <p>Version logicielle: {intervention.softwareVersion || "-"}</p>
                <p>Checksum: {intervention.checksum || "-"}</p>
              </div>
              <div>
                <Button onClick={() => window.open(`/api/interventions/${intervention.id}/pdf`)}>
                  Telecharger PDF dossier
                </Button>
              </div>
            </Card>

            <Card className="grid gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Conformite</p>
                <h2 className="mt-2 text-xl font-semibold">Traceabilite et preuves</h2>
              </div>
              <div className="grid gap-2 text-sm text-[var(--muted)]">
                <p>Hash de preuve: {intervention.hash || "-"}</p>
                <p>Payload snapshot: {intervention.payload ? "Disponible" : "Non fourni"}</p>
                <p>IP client: {intervention.clientIp || "-"}</p>
                <p>User-Agent: {intervention.userAgent || "-"}</p>
                <p>Cree par: {intervention.createdBy || "-"}</p>
              </div>
            </Card>

            <LegalReferencesPanel type={intervention.type} />
          </div>

          <Card className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Historique</p>
                <h2 className="mt-2 text-xl font-semibold">Revisions</h2>
              </div>
              <Badge variant="accent">{intervention.revisions.length}</Badge>
            </div>
            {intervention.revisions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Aucune revision enregistree.</p>
            ) : (
              <div className="grid gap-3">
                {intervention.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]"
                  >
                    <p className="font-semibold text-[var(--text)]">
                      {new Date(rev.createdAt).toLocaleString("fr-FR")}
                    </p>
                    <p className="break-all text-xs">HASH: {rev.hash}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">Intervention introuvable.</p>
      )}
    </div>
  );
}
