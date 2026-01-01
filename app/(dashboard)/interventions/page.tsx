"use client";

import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";
import { useToast } from "@/components/ui/Toast";

type VehicleOption = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { firstName: string; lastName: string };
};

type InterventionItem = {
  id: string;
  type: string;
  createdAt: string;
  performedAt?: string | null;
  vehicle: VehicleOption;
};

const INTERVENTION_TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const toast = useToast();

  const [form, setForm] = useState({
    vehicleId: "",
    type: "E85",
    notes: "",
    performedAt: "",
    odometerKm: "",
    ecuType: "",
    softwareVersion: "",
    checksum: "",
  });

  // Fetch interventions from API
  const loadInterventions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interventions");
      if (!res.ok) throw new Error("Erreur lors du chargement des interventions.");
      const data = await res.json();
      setInterventions(data?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles from API
  const loadVehicles = async () => {
    try {
      const res = await fetch("/api/vehicules");
      if (!res.ok) throw new Error("Erreur lors du chargement des véhicules.");
      const data = await res.json();
      setVehicles(data?.data ?? []);
    } catch (err) {
      setVehicles([]);
    }
  };

  useEffect(() => {
    loadInterventions();
    loadVehicles();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return interventions;
    return interventions.filter((item) => {
      const data = `${item.vehicle.plate} ${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.client.firstName} ${item.vehicle.client.lastName} ${item.type}`.toLowerCase();
      return data.includes(q);
    });
  }, [interventions, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const visibleInterventions = filtered.slice(0, visibleCount);

  // ...existing code...

  // Helper for relative date
  const getRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Header section premium */}
      <SectionHeader
        title="Suivi des interventions"
        description="Chaque intervention est horodatée, tracée et reliée à un dossier PDF conforme."
        level={1}
      />

      {/* Main content: Timeline/cards + Form */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Timeline / Cards interventions */}
        <div className="flex flex-col gap-5 relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, client, type"
              className="w-full max-w-xs bg-[#15151f] border border-[#242433] text-white placeholder-gray-500 rounded-lg px-4 py-2"
            />
            <Tooltip content="Nombre d'interventions filtrées">
              <Badge variant="accent">{filtered.length} dossiers</Badge>
            </Tooltip>
          </div>
          {error ? <ErrorBanner message={error} /> : null}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Aucune intervention" description="Aucune intervention n'a été ajoutée pour l'instant." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
              {visibleInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="card p-5 flex flex-col gap-2 hover:shadow-card transition group animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-[var(--text)] group-hover:text-[var(--accent)] transition">
                      {intervention.vehicle.plate}
                    </h3>
                    <Tooltip content={intervention.type}>
                      <Badge variant="accent">{intervention.type}</Badge>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-1">Client : <span className="font-medium text-[var(--text)]">{intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}</span></p>
                  <p className="text-xs text-[var(--muted)]">Date : <span className="text-[var(--muted)]" title={new Date(intervention.createdAt).toLocaleString("fr-FR")}>{getRelativeDate(intervention.createdAt)}</span></p>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/interventions/${intervention.id}`} className="btn bg-transparent text-[var(--accent)] hover:bg-[var(--accent)]/10 font-medium px-3 py-1 min-h-0 h-9 text-sm">
                      Voir détail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Floating add button */}
          <a href="/interventions" className="absolute bottom-6 right-6 bg-[var(--accent)] text-white rounded-full p-3 shadow-lg hover:scale-105 transition" title="Ajouter une intervention">
            <Plus size={20} />
          </a>
        </div>
        {/* ...fin du bloc interventions... */}
      </div>
    </div>
  );
}

