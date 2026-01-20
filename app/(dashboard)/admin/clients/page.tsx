"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Users,
  Building2,
  Car,
  Search,
  RefreshCw,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ClientItem = {
  id: number;
  garageId: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  vatProfile?: string | null;
  garage: {
    id: number;
    name: string;
  };
  _count: {
    vehicles: number;
  };
};

type ClientsResponse = {
  items: ClientItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function AdminClientsPage() {
  const user = useUser();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
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

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "30" });
      if (search) params.set("search", search);
      const data = await fetcher<ClientsResponse>(`/api/admin/clients?${params}`, {
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      setClients(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, isAdmin, page, search]);

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      setKeyReady(true);
      loadClients();
      return;
    }
    if (keyReady) loadClients();
  }, [isAdmin, keyReady, loadClients, user]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

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
        title="Tous les clients"
        description="Liste complète des clients de tous les garages."
        action={
          <div className="flex gap-2">
            <Link href="/admin/dashboard">
              <Button variant="secondary" size="sm">Dashboard Admin</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => void loadClients()}>
              <RefreshCw size={16} />
            </Button>
          </div>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted2" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <Button onClick={handleSearch}>Rechercher</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader flex items-center justify-between">
          <div>
            <p className="ms-kicker">Administration</p>
            <p className="mt-2 text-lg font-semibold text-text">Clients ({total})</p>
          </div>
        </div>
        <DataTable stickyHeader variant="plain">
          <DataTableHead sticky>
            <tr>
              <th>Client</th>
              <th>Contact</th>
              <th>Garage</th>
              <th className="text-center">Véhicules</th>
              <th className="text-right">Inscription</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <Loading />
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="Aucun client" description="Les clients apparaitront ici." />
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-text">
                          {client.firstName} {client.lastName}
                        </p>
                        {client.vatProfile && (
                          <span className="text-xs text-muted2">{client.vatProfile}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1 text-sm">
                      {client.email && (
                        <p className="flex items-center gap-1 text-muted2">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="flex items-center gap-1 text-muted2">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </p>
                      )}
                      {!client.email && !client.phone && (
                        <span className="text-muted2">—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm">{client.garage?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Car className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{client._count?.vehicles || 0}</span>
                    </div>
                  </td>
                  <td className="text-right text-sm text-muted2">
                    {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-sm text-muted2">
              Page {page} sur {totalPages} • {total} clients
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                Précédent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
