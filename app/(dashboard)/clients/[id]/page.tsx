"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { fetcher } from "@/lib/fetcher";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";

type ClientDetails = {
  id: number;
  firstName: string;
  lastName: string;
  garageId: number | null;
  garage?: { id: number; name: string } | null;
  createdAt: string;
};

type VehicleItem = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  createdAt?: string;
  client: { id: number; firstName: string; lastName: string };
};

type InterventionItem = {
  id: string;
  type: string;
  createdAt: string;
  vehicle: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    client: { id: number; firstName: string; lastName: string };
  };
};

type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };

export default function ClientDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [clientData, vehiclesData, interventionsData] = await Promise.all([
          fetcher<ClientDetails>(`/api/clients/${id}`, { noStore: true }),
          fetcher<Paginated<VehicleItem>>("/api/vehicules?page=1&pageSize=100", { noStore: true }),
          fetcher<Paginated<InterventionItem>>("/api/interventions?page=1&pageSize=100", { noStore: true }),
        ]);

        setClient(clientData);
        const clientId = Number(clientData.id);
        setVehicles((vehiclesData?.items ?? []).filter((v) => v?.client?.id === clientId));
        setInterventions((interventionsData?.items ?? []).filter((i) => i?.vehicle?.client?.id === clientId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (!client) {
    return <EmptyState title="Client introuvable" description="Vérifiez l’identifiant du client." />;
  }

  const fullName = `${client.firstName} ${client.lastName}`;

  return (
    <div className="grid gap-8">
      <SectionHeader
        title={fullName}
        description={`Fiche client #${client.id}`}
        action={
          <Link href="/clients">
            <Button variant="secondary" size="sm">Retour</Button>
          </Link>
        }
        level={1}
      />

      <div className="-mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="accent">Client</Badge>
        {client.garage?.name ? <Badge variant="neutral">{client.garage.name}</Badge> : null}
        <Badge variant="neutral">{vehicles.length} véhicule(s)</Badge>
        <Badge variant="neutral">{interventions.length} intervention(s)</Badge>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader flex items-start justify-between gap-3">
          <div>
            <p className="ms-kicker">Informations</p>
            <p className="mt-2 text-lg font-semibold text-text">{fullName}</p>
            <p className="mt-1 text-sm text-muted2">Client #{client.id}</p>
          </div>
          <span className="hidden sm:block">
            <Badge variant="accent">Fiche</Badge>
          </span>
        </div>

        <div className="ms-cardBody grid gap-2 text-sm text-muted2">
          <p>
            Nom: <span className="text-text">{client.firstName} {client.lastName}</span>
          </p>
          <p>
            Garage: <span className="text-text">{client.garage?.name ?? (client.garageId ? `#${client.garageId}` : "-")}</span>
          </p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-center justify-between gap-4">
            <div>
              <p className="ms-kicker">Véhicules</p>
              <p className="mt-1 text-sm text-muted2">
                {vehicles.length} véhicule(s)
              </p>
            </div>
            <Link href="/vehicules">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="ms-cardBody">
              <EmptyState
                title="Aucun véhicule"
                description="Ce client n'a pas encore de véhicule."
                action={
                  <Link href="/vehicules">
                    <Button size="sm">Créer un véhicule</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <DataTable variant="plain">
              <DataTableHead>
                <tr>
                  <th>Plaque</th>
                  <th>Modèle</th>
                  <th>Dossier</th>
                </tr>
              </DataTableHead>
              <tbody>
                {vehicles.slice(0, 8).map((v) => (
                  <tr key={v.id}>
                    <td className="text-sm font-medium">{v.plate}</td>
                    <td className="text-sm text-muted2">
                      {v.brand} {v.model}
                    </td>
                    <td>
                      <Link href={`/vehicules?selected=${encodeURIComponent(v.id)}`} className="text-sm font-semibold text-primary hover:text-primaryHover">
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-center justify-between gap-4">
            <div>
              <p className="ms-kicker">Interventions</p>
              <p className="mt-1 text-sm text-muted2">
                {interventions.length} intervention(s)
              </p>
            </div>
            <Link href="/interventions">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>

          {interventions.length === 0 ? (
            <div className="ms-cardBody">
              <EmptyState
                title="Aucune intervention"
                description="Les interventions de ce client apparaîtront ici."
                action={
                  <Link href="/interventions">
                    <Button size="sm">Créer une intervention</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <DataTable variant="plain">
              <DataTableHead>
                <tr>
                  <th>Véhicule</th>
                  <th>Type</th>
                  <th>Créée</th>
                  <th>Dossier</th>
                </tr>
              </DataTableHead>
              <tbody>
                {interventions.slice(0, 8).map((i) => (
                  <tr key={i.id}>
                    <td className="text-sm font-medium">{i.vehicle.plate}</td>
                    <td className="text-sm text-muted2">{i.type}</td>
                    <td className="text-xs text-muted2">
                      {new Date(i.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <Link href={`/interventions?selected=${encodeURIComponent(i.id)}`} className="text-sm font-semibold text-primary hover:text-primaryHover">
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </div>
  );
}
