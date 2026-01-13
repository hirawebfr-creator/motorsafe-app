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
import {
  Building2,
  Users,
  Car,
  Wrench,
  FileText,
  Receipt,
  Crown,
  Star,
  Shield,
} from "lucide-react";

type GarageItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  plan?: string | null;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  users: Array<{ id: string; email: string; role: string; createdAt: string }>;
  _count?: {
    clients: number;
    vehicles: number;
    interventions: number;
    quotes: number;
    invoices: number;
  };
};

const PLAN_COLORS: Record<string, { bg: string; text: string; icon: typeof Star }> = {
  FREE: { bg: "bg-gray-100", text: "text-gray-700", icon: Shield },
  STARTER: { bg: "bg-blue-100", text: "text-blue-700", icon: Star },
  PRO: { bg: "bg-purple-100", text: "text-purple-700", icon: Crown },
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
      const data = await fetcher<GarageItem[]>("/api/admin/garages?withStats=true", {
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
          <p className="mt-2 text-lg font-semibold text-text">Liste des garages ({garages.length})</p>
        </div>
        <DataTable stickyHeader variant="plain">
          <DataTableHead sticky>
            <tr>
              <th>Garage</th>
              <th>Plan</th>
              <th>Statut</th>
              <th className="text-center">Stats</th>
              <th>Responsable</th>
              <th className="text-right">Création</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <Loading />
                </td>
              </tr>
            ) : garages.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState title="Aucun garage" description="Les garages apparaitront ici." />
                </td>
              </tr>
            ) : (
              garages.map((garage) => {
                const planCfg = PLAN_COLORS[garage.plan || "FREE"] || PLAN_COLORS.FREE;
                const PlanIcon = planCfg.icon;
                return (
                  <tr key={garage.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-text">{garage.name}</p>
                          <p className="text-xs text-muted2">{garage.email}</p>
                          {garage.siret && <p className="text-xs text-muted2">SIRET: {garage.siret}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${planCfg.bg} ${planCfg.text}`}>
                        <PlanIcon className="h-3 w-3" />
                        {garage.plan || "FREE"}
                      </span>
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
                    <td>
                      {garage._count ? (
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <span className="flex items-center gap-1" title="Clients">
                            <Users className="h-3 w-3 text-orange-500" />
                            {garage._count.clients}
                          </span>
                          <span className="flex items-center gap-1" title="Véhicules">
                            <Car className="h-3 w-3 text-blue-500" />
                            {garage._count.vehicles}
                          </span>
                          <span className="flex items-center gap-1" title="Interventions">
                            <Wrench className="h-3 w-3 text-purple-500" />
                            {garage._count.interventions}
                          </span>
                          <span className="flex items-center gap-1" title="Devis">
                            <FileText className="h-3 w-3 text-cyan-500" />
                            {garage._count.quotes}
                          </span>
                          <span className="flex items-center gap-1" title="Factures">
                            <Receipt className="h-3 w-3 text-emerald-500" />
                            {garage._count.invoices}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted2">—</span>
                      )}
                    </td>
                    <td className="text-sm text-muted2">
                      {garage.users[0]?.email ?? "-"}
                    </td>
                    <td className="text-right text-sm text-muted2">
                      {new Date(garage.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DataTable>
      </Card>
    </div>
  );
}
