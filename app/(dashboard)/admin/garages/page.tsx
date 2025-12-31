"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
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
  if (!user) return null;
  const [garages, setGarages] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(user.role === "ADMIN");
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadGarages = async () => {
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
  };

  useEffect(() => {
    if (keyReady) {
      loadGarages();
    }
  }, [keyReady]);

  if (!keyReady && !isAdmin) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">
          Acces reserve a l'administration. Renseignez votre ADMIN_KEY pour continuer.
        </p>
        <div className="mt-4 grid gap-3">
          <input
            className="input"
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
            Deverrouiller
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <SectionHeader
        title="Tous les garages"
        description="Liste complète des garages inscrits sur la plateforme."
        action={
          <Link href="/admin" className="text-sm text-[var(--accent-2)] hover:underline">
            Retour validations
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card className="grid gap-6">
        <DataTable stickyHeader>
          <DataTableHead sticky>
            <tr>
              <th className="px-5 py-4">Garage</th>
              <th className="px-5 py-4">Statut</th>
              <th className="px-5 py-4">Responsable</th>
              <th className="px-5 py-4 text-right">Création</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-6" colSpan={4}>
                  <Loading />
                </td>
              </tr>
            ) : garages.length === 0 ? (
              <tr>
                <td className="px-5 py-6" colSpan={4}>
                  <EmptyState title="Aucun garage" description="Les garages apparaitront ici." />
                </td>
              </tr>
            ) : (
              garages.map((garage) => (
                <tr
                  key={garage.id}
                  className="border-t border-[rgba(31,41,55,0.7)] transition hover:bg-[rgba(139,92,246,0.06)]"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--text)]">{garage.name}</p>
                    <p className="text-xs text-[var(--muted)]">{garage.email}</p>
                  </td>
                  <td className="px-5 py-4">
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
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">
                    {garage.users[0]?.email ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-[var(--muted)]">
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
