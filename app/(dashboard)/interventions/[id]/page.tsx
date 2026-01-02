"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";

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
  revisions?: Array<any>;
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
    <div className="flex flex-col gap-10">
      <SectionHeader
        title={intervention ? `Dossier ${intervention.vehicle.plate}` : "Dossier intervention"}
        description="Détail complet de l'intervention, traçabilité et conformité."
        level={1}
      />
      {loading ? (
        <div className="flex justify-center py-12"><Loading /></div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !intervention ? (
        <div className="text-center py-16 text-muted">Intervention introuvable.</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h2 className="text-xl font-semibold text-text">{intervention.vehicle.plate} <span className="text-primary font-normal">· {intervention.type}</span></h2>
                <p className="text-xs text-muted mt-1">{intervention.vehicle.brand} {intervention.vehicle.model}</p>
                <p className="text-xs text-muted">Client : <span className="font-medium text-text">{intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}</span></p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <a href={`/api/interventions/${intervention.id}/pdf`} className="text-primary hover:underline text-sm font-medium">PDF</a>
                <span className="text-xs text-[color:var(--textMuted)]">Créée le {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}</span>
                {intervention.performedAt && <span className="text-xs text-[color:var(--textMuted)]">Réalisée le {new Date(intervention.performedAt).toLocaleDateString("fr-FR")}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-muted mb-1">Kilométrage</p>
                <p className="text-text font-medium">{intervention.odometerKm ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">ECU</p>
                <p className="text-text font-medium">{intervention.ecuType ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Version logicielle</p>
                <p className="text-text font-medium">{intervention.softwareVersion ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Checksum</p>
                <p className="text-text font-medium">{intervention.checksum ?? "-"}</p>
              </div>
            </div>
            {intervention.notes && (
              <div className="mt-4">
                <p className="text-xs text-muted mb-1">Notes</p>
                <p className="text-text whitespace-pre-line">{intervention.notes}</p>
              </div>
            )}
          </Card>
          <div className="flex flex-col gap-6">
            <LegalReferencesPanel type={intervention.type} />
            {/* Historique des révisions, si présent */}
            {intervention.revisions && intervention.revisions.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-text">Historique des révisions</h3>
                <ul className="space-y-2">
                  {intervention.revisions.map((rev, idx) => (
                    <li key={rev.id || idx} className="text-xs text-muted">
                      <span className="font-medium text-text">Revision {idx + 1}</span> – {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("fr-FR") : ""}
                      {rev.hash && <span className="ml-2 text-[color:var(--textMuted)]">HASH: {rev.hash}</span>}
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
