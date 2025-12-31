"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
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
        <div className="text-center py-16 text-gray-500">Intervention introuvable.</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="flex flex-col gap-4 p-6 bg-[#15151f] border border-[#242433] rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h2 className="text-xl font-semibold text-white">{intervention.vehicle.plate} <span className="text-violet-400 font-normal">· {intervention.type}</span></h2>
                <p className="text-xs text-gray-400 mt-1">{intervention.vehicle.brand} {intervention.vehicle.model}</p>
                <p className="text-xs text-gray-400">Client : <span className="font-medium text-gray-300">{intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}</span></p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <a href={`/api/interventions/${intervention.id}/pdf`} className="text-violet-400 hover:underline text-sm font-medium">PDF</a>
                <span className="text-xs text-gray-500">Créée le {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}</span>
                {intervention.performedAt && <span className="text-xs text-gray-500">Réalisée le {new Date(intervention.performedAt).toLocaleDateString("fr-FR")}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-400 mb-1">Kilométrage</p>
                <p className="text-white font-medium">{intervention.odometerKm ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">ECU</p>
                <p className="text-white font-medium">{intervention.ecuType ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Version logicielle</p>
                <p className="text-white font-medium">{intervention.softwareVersion ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Checksum</p>
                <p className="text-white font-medium">{intervention.checksum ?? '-'}</p>
              </div>
            </div>
            {intervention.notes && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-white whitespace-pre-line">{intervention.notes}</p>
              </div>
            )}
          </Card>
          <div className="flex flex-col gap-6">
            <LegalReferencesPanel type={intervention.type} />
            {/* Historique des révisions, si présent */}
            {intervention.revisions && intervention.revisions.length > 0 && (
              <Card className="p-4 bg-[#15151f] border border-[#242433] rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-white">Historique des révisions</h3>
                <ul className="space-y-2">
                  {intervention.revisions.map((rev, idx) => (
                    <li key={rev.id || idx} className="text-xs text-gray-400">
                      <span className="font-medium text-white">Revision {idx + 1}</span> – {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("fr-FR") : ""}
                      {rev.hash && <span className="ml-2 text-gray-500">HASH: {rev.hash}</span>}
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
