"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/Input";

type GarageItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: string;
  users: Array<{ id: string; email: string; role: string; createdAt: string }>;
};

export default function AdminPendingPage() {
  const user = useUser();
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

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<GarageItem[]>("/api/admin/garages?status=pending", {
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

  const approve = async (id: number) => {
    setError(null);
    try {
      await requestJson(`/api/admin/garages/${id}/approve`, {
        method: "POST",
        body: {},
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      await loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    }
  };

  useEffect(() => {
    if (keyReady) {
      loadPending();
    }
  }, [keyReady]);

  if (!keyReady && !isAdmin) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">
          Acces reserve a l'administration. Renseignez votre ADMIN_KEY pour continuer.
        </p>
        <div className="mt-4 grid gap-3">
          <Input
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
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Administration</p>
          <h1 className="mt-3 text-3xl font-semibold">Demandes en attente</h1>
        </div>
        <Link href="/admin/garages" className="text-sm text-[var(--accent-2)]">
          Voir tous les garages
        </Link>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Loading />
      ) : garages.length === 0 ? (
        <EmptyState title="Aucune demande" description="Les demandes en attente apparaitront ici." />
      ) : (
        <div className="grid gap-4">
          {garages.map((garage) => (
            <Card key={garage.id} className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{garage.name}</p>
                  <p className="text-xs text-[var(--muted)]">{garage.email}</p>
                </div>
                <Badge variant="warning">En attente</Badge>
              </div>
              <div className="grid gap-2 text-sm text-[var(--muted)]">
                <p>Telephone: {garage.phone || "-"}</p>
                <p>Adresse: {garage.address || "-"}</p>
                <p>SIRET: {garage.siret || "-"}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[var(--muted)]">
                  Responsable: {garage.users[0]?.email ?? "-"}
                </div>
                <Button onClick={() => approve(garage.id)}>Approuver</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
