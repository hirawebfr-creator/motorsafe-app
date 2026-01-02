"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { fetcher } from "@/lib/fetcher";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { EmptyState } from "@/components/common/EmptyState";

type ClientDetails = {
  id: number;
  firstName: string;
  lastName: string;
  garageId: number | null;
  garage?: { id: number; name: string } | null;
  createdAt: string;
};

export default function ClientDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetcher<ClientDetails>(`/api/clients/${id}`, { noStore: true });
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="text-sm text-[color:var(--textMuted)]">Chargement…</div>;
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (!client) {
    return <EmptyState title="Client introuvable" description="Vérifiez l’identifiant du client." />;
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={`${client.firstName} ${client.lastName}`}
        description={`Fiche client #${client.id}`}
        action={
          <Link href="/clients">
            <Button variant="secondary">Retour</Button>
          </Link>
        }
        level={1}
      />

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Informations</p>
            <p className="mt-1 text-sm text-[color:var(--textMuted)]">Client #{client.id}</p>
          </div>
          <Badge variant="accent">Client</Badge>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-[color:var(--textMuted)]">
          <p>
            Nom: <span className="text-[color:var(--text)]">{client.firstName} {client.lastName}</span>
          </p>
          <p>
            Garage: <span className="text-[color:var(--text)]">{client.garage?.name ?? (client.garageId ? `#${client.garageId}` : "-")}</span>
          </p>
        </div>
      </Card>

      <EmptyState
        title="Véhicules & interventions"
        description="Affichage détaillé à venir dans cette fiche."
        action={
          <Link href="/vehicules">
            <Button>Voir les véhicules</Button>
          </Link>
        }
      />
    </div>
  );
}
