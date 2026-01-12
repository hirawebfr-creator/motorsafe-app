"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";

type GarageItem = {
  id: number;
  name: string;
  email: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: string;
  users: Array<{ id: string; email: string; role: string; createdAt: string }>;
};

export default function AdminGaragesPage() {
  const user = useUser();

  const [garages, setGarages] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadGarages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<GarageItem[]>("/api/admin/garages", {
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      setGarages(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, isAdmin]);

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      setKeyReady(true);
      loadGarages();
      return;
    }

    if (keyReady) loadGarages();
  }, [isAdmin, keyReady, loadGarages, user]);

  if (!user) return null;

  if (!keyReady && !isAdmin) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader">
          <p className="ms-kicker">Administration</p>
          <p className="mt-2 text-lg font-semibold text-text">Accès réservé</p>
          <p className="mt-2 text-sm text-muted2">
            Renseignez votre ADMIN_KEY pour continuer.
          </p>
        </div>
        <div className="ms-cardBody">
          <div className="grid max-w-md gap-3">
            <Input
              label="ADMIN_KEY"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="ADMIN_KEY"
            />
            <Button
              onClick={() => {
                if (!adminKey.trim()) return;
                window.localStorage.setItem("ms_admin_key", adminKey.trim());
                setKeyReady(true);
              }}
            >
              Déverrouiller
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-8">
      <SectionHeader
        title="Tous les garages"
        description="Liste complète des garages inscrits sur la plateforme."
        action={
          <Link href="/admin">
            <Button variant="secondary" size="sm">Retour validations</Button>
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader">
          <p className="ms-kicker">Administration</p>
          <p className="mt-2 text-lg font-semibold text-text">Liste des garages</p>
        </div>
        <DataTable stickyHeader variant="plain">
          <DataTableHead sticky>
            <tr>
              <th>Garage</th>
              <th>Statut</th>
              <th>Responsable</th>
              <th className="text-right">Création</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>
                  <Loading />
                </td>
              </tr>
            ) : garages.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState title="Aucun garage" description="Les garages apparaitront ici." />
                </td>
              </tr>
            ) : (
              garages.map((garage) => (
                <tr key={garage.id}>
                  <td>
                    <p className="font-semibold text-text">{garage.name}</p>
                    <p className="text-xs text-muted2">{garage.email}</p>
                  </td>
                  <td>
                    <Badge
                      variant={
                        garage.status === "ACTIVE"
                          ? "success"
                          : garage.status === "REJECTED"
                          ? "neutral"
                          : "warning"
                      }
                    >
                      {garage.status === "ACTIVE"
                        ? "Actif"
                        : garage.status === "REJECTED"
                        ? "Refusé"
                        : "En attente"}
                    </Badge>
                  </td>
                  <td className="text-sm text-muted2">
                    {garage.users[0]?.email ?? "-"}
                  </td>
                  <td className="text-right text-sm text-muted2">
                    {new Date(garage.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </Card>
    </div>
  );
}
