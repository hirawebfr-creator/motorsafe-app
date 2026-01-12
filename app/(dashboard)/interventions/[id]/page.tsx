"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";

import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { firstName: string; lastName: string };
};

type Intervention = {
  id: string;
  type: string;
  createdAt: string;
  performedAt?: string | null;
  notes?: string | null;
  odometerKm?: string | null;
  ecuType?: string | null;
  softwareVersion?: string | null;
  checksum?: string | null;
  vehicle: Vehicle;
  revisions?: Array<{ id?: string; createdAt?: string; hash?: string | null }>;
};

export default function InterventionDetailPage() {
  const { id } = useParams();
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntervention = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/interventions/${id}`);
        if (!res.ok) throw new Error("Erreur lors du chargement de l'intervention.");
        const data = await res.json();
        setIntervention(data?.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchIntervention();
  }, [id]);

  return (
    <div className="grid gap-8">
      <SectionHeader
        title={intervention ? `Dossier ${intervention.vehicle.plate}` : "Dossier intervention"}
        description="Détail complet de l'intervention, traçabilité et conformité."
        level={1}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link href="/interventions" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Retour
              </Button>
            </Link>
            {intervention ? (
              <a
                href={`/api/interventions/${intervention.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="sm" className="w-full sm:w-auto">Télécharger PDF</Button>
              </a>
            ) : null}
          </div>
        }
      />

      {intervention ? (
        <div className="-mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{intervention.type}</Badge>
          <Badge variant="neutral">{intervention.vehicle.brand} {intervention.vehicle.model}</Badge>
          <Badge variant="neutral">Client: {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}</Badge>
          {intervention.revisions?.length ? (
            <Badge variant="neutral">{intervention.revisions.length} révision(s)</Badge>
          ) : (
            <Badge variant="neutral">Aucune révision</Badge>
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12"><Loading /></div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !intervention ? (
        <EmptyState title="Intervention introuvable" description="Ce dossier n'existe pas ou n'est plus accessible." />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="p-0 overflow-hidden">
            <div className="ms-cardHeader flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="ms-kicker">Véhicule</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  {intervention.vehicle.plate}{" "}
                  <span className="font-normal text-muted2">· {intervention.type}</span>
                </h2>
                <p className="mt-1 text-xs text-muted2">
                  {intervention.vehicle.brand} {intervention.vehicle.model}
                </p>
                <p className="text-xs text-muted2">
                  Client :{" "}
                  <span className="font-medium text-text">
                    {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-muted2">
                  Créée le {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}
                </span>
                {intervention.performedAt ? (
                  <span className="text-xs text-muted2">
                    Réalisée le {new Date(intervention.performedAt).toLocaleDateString("fr-FR")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="ms-cardBody grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-muted2">Kilométrage</p>
                  <p className="font-medium text-text">{intervention.odometerKm ?? "-"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted2">ECU</p>
                  <p className="font-medium text-text">{intervention.ecuType ?? "-"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted2">Version logicielle</p>
                  <p className="font-medium text-text">{intervention.softwareVersion ?? "-"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted2">Checksum</p>
                  <p className="font-medium text-text">{intervention.checksum ?? "-"}</p>
                </div>
              </div>

              {intervention.notes ? (
                <div>
                  <p className="mb-1 text-xs text-muted2">Notes</p>
                  <p className="whitespace-pre-line text-text">{intervention.notes}</p>
                </div>
              ) : null}
            </div>
          </Card>
          <div className="flex flex-col gap-6">
            <LegalReferencesPanel type={intervention.type} />
            {/* Historique des révisions, si présent */}
            {intervention.revisions && intervention.revisions.length > 0 && (
              <Card className="p-5 sm:p-6">
                <h3 className="mb-3 text-lg font-semibold">Historique des révisions</h3>
                <ul className="space-y-2">
                  {intervention.revisions.map((rev, idx) => (
                    <li key={rev.id || idx} className="text-xs text-muted2">
                      <span className="font-medium text-text">Révision {idx + 1}</span> – {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("fr-FR") : ""}
                      {rev.hash && <span className="ml-2 text-muted2">HASH: {rev.hash}</span>}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
