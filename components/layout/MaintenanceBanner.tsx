"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, X, Calendar } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

// ============================================
// Types
// ============================================

interface MaintenanceWindow {
  id: string;
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
  severity: "INFO" | "WARNING";
}

interface MaintenanceResponse {
  current: MaintenanceWindow | null;
  upcoming: MaintenanceWindow[];
  hasActive: boolean;
  hasUpcoming: boolean;
}

// ============================================
// Component
// ============================================

export function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState<MaintenanceResponse | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadMaintenance = async () => {
      try {
        const res = await fetcher<MaintenanceResponse>("/api/maintenance/active");
        setMaintenance(res);
      } catch {
        // Silently fail - don't show banner if API fails
      }
    };

    void loadMaintenance();

    // Refresh every 5 minutes
    const interval = setInterval(() => void loadMaintenance(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Show current maintenance (can't dismiss)
  if (maintenance?.current) {
    const m = maintenance.current;
    return (
      <div className={`w-full px-4 py-2 ${
        m.severity === "WARNING" 
          ? "bg-orange-500 text-white" 
          : "bg-blue-500 text-white"
      }`}>
        <div className="mx-auto max-w-6xl flex items-center justify-center gap-2 text-sm">
          <Wrench size={16} />
          <span className="font-medium">Maintenance en cours :</span>
          <span>{m.title}</span>
          <span className="opacity-75">—</span>
          <span className="opacity-90">Fin prévue : {formatTime(m.endsAt)}</span>
          <Link href="/nouveautes" className="ml-2 underline hover:no-underline">
            En savoir plus
          </Link>
        </div>
      </div>
    );
  }

  // Show upcoming maintenance (within 24h, dismissable)
  if (maintenance?.upcoming && maintenance.upcoming.length > 0) {
    const m = maintenance.upcoming[0];
    
    // Skip if dismissed
    if (dismissed.has(m.id)) return null;

    return (
      <div className="w-full bg-yellow-100 px-4 py-2 text-yellow-800">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span className="font-medium">Maintenance planifiée :</span>
            <span>{m.title}</span>
            <span className="opacity-75">—</span>
            <span>Début : {formatTime(m.startsAt)}</span>
            <Link href="/nouveautes" className="ml-2 underline hover:no-underline">
              Détails
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setDismissed((prev) => new Set(prev).add(m.id))}
            className="p-1 hover:bg-yellow-200 rounded"
            title="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
