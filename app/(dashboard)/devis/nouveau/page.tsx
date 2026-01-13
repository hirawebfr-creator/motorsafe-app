"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Loader2,
  User,
  Car,
  Plus,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ClientOption = {
  id: number;
  firstName: string;
  lastName: string;
};

type VehicleOption = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  clientId: number;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function unwrapOk(json: unknown): unknown {
  if (isRecord(json) && json.ok === true && "data" in json) return json.data;
  return json;
}

function pickArray(json: unknown): unknown[] {
  const data = unwrapOk(json);
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  if (isRecord(data) && Array.isArray(data.data)) return data.data;
  return [];
}

export default function NouveauDevisPage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients + vehicles
  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      const [clientsRes, vehiclesRes] = await Promise.all([
        fetch("/api/clients?pageSize=200", { cache: "no-store" }),
        fetch("/api/vehicules?pageSize=200", { cache: "no-store" }),
      ]);

      const clientsJson = await clientsRes.json().catch(() => null);
      const vehiclesJson = await vehiclesRes.json().catch(() => null);

      if (!clientsRes.ok) {
        throw new Error(clientsJson?.error?.message || "Erreur chargement clients");
      }
      if (!vehiclesRes.ok) {
        throw new Error(vehiclesJson?.error?.message || "Erreur chargement véhicules");
      }

      const clientsList = pickArray(clientsJson) as ClientOption[];
      const vehiclesList = pickArray(vehiclesJson) as VehicleOption[];

      setClients(clientsList);
      setVehicles(vehiclesList);

      // Pre-select first client if available
      if (clientsList.length > 0 && !selectedClientId) {
        setSelectedClientId(clientsList[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoadingData(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filter vehicles for selected client
  const filteredVehicles = vehicles.filter((v) => v.clientId === selectedClientId);

  // Create quote
  const handleCreate = async () => {
    if (!selectedClientId) {
      setError("Veuillez sélectionner un client");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const body: Record<string, unknown> = {
        clientId: selectedClientId,
        lines: [
          {
            description: "Prestation",
            qty: 1,
            unitPriceExcl: 0,
          },
        ],
      };

      if (selectedVehicleId) {
        body.vehicleId = selectedVehicleId;
      }

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error?.message || "Erreur création devis");
      }

      // Redirect to detail page
      const quoteId = json.data?.id;
      if (quoteId) {
        router.push(`/devis/${quoteId}`);
      } else {
        throw new Error("ID du devis non retourné");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setCreating(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/devis" className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-text">
        <ArrowLeft size={16} />
        Retour aux devis
      </Link>

      <SectionHeader
        title="Nouveau devis"
        description="Sélectionnez un client pour créer un brouillon"
      />

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </Card>
      )}

      {clients.length === 0 ? (
        <Card className="p-8 text-center">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="mb-4 text-muted2">Aucun client trouvé</p>
          <Link href="/clients">
            <Button variant="secondary">
              <Plus size={16} />
              Créer un client
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Client Selection */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <User size={18} className="text-indigo-500" />
              Client *
            </h3>
            <select
              value={selectedClientId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedClientId(id || null);
                setSelectedVehicleId("");
              }}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Sélectionner un client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </Card>

          {/* Vehicle Selection */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Car size={18} className="text-orange-500" />
              Véhicule (optionnel)
            </h3>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              disabled={!selectedClientId || filteredVehicles.length === 0}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">Aucun véhicule</option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} - {v.plate}
                </option>
              ))}
            </select>
            {selectedClientId && filteredVehicles.length === 0 && (
              <p className="mt-2 text-sm text-muted2">
                Aucun véhicule pour ce client
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Create Button */}
      {clients.length > 0 && (
        <div className="flex justify-end gap-3">
          <Link href="/devis">
            <Button variant="secondary" disabled={creating}>
              Annuler
            </Button>
          </Link>
          <Button onClick={handleCreate} disabled={creating || !selectedClientId}>
            {creating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Création...
              </>
            ) : (
              <>
                <FileText size={16} />
                Créer le brouillon
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
