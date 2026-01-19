"use client";

import { useState, useEffect } from "react";
import { Building2, X, ChevronDown } from "lucide-react";

interface Garage {
  id: number;
  name: string;
  email: string;
}

/**
 * Admin-only component to emulate viewing as a specific garage.
 * Stores selection in localStorage and adds header to all fetch requests.
 */
export function GarageEmulator() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load garages list
  useEffect(() => {
    const loadGarages = async () => {
      try {
        const res = await fetch("/api/admin/garages?limit=100");
        if (res.ok) {
          const data = await res.json();
          setGarages(data.data?.garages || []);
        }
      } catch (err) {
        console.error("Failed to load garages:", err);
      } finally {
        setLoading(false);
      }
    };
    loadGarages();
  }, []);

  // Load saved selection from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin_emulate_garage");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedGarage(parsed);
      } catch {
        localStorage.removeItem("admin_emulate_garage");
      }
    }
  }, []);

  // Save selection and patch fetch
  useEffect(() => {
    if (selectedGarage) {
      localStorage.setItem("admin_emulate_garage", JSON.stringify(selectedGarage));
    } else {
      localStorage.removeItem("admin_emulate_garage");
    }
  }, [selectedGarage]);

  const handleSelect = (garage: Garage) => {
    setSelectedGarage(garage);
    setIsOpen(false);
    // Reload page to apply new context
    window.location.reload();
  };

  const handleClear = () => {
    setSelectedGarage(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--ms-text-muted)]">
        <Building2 size={16} />
        <span>Chargement...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {selectedGarage ? (
        <div className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm">
          <Building2 size={16} className="text-amber-600" />
          <span className="font-medium text-amber-800">
            Vue: {selectedGarage.name}
          </span>
          <button
            onClick={handleClear}
            className="ml-1 rounded p-0.5 hover:bg-amber-200"
            title="Quitter l'émulation"
          >
            <X size={14} className="text-amber-700" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border border-[var(--ms-border)] px-3 py-2 text-sm hover:bg-[var(--ms-bg-hover)]"
        >
          <Building2 size={16} className="text-[var(--ms-text-muted)]" />
          <span className="text-[var(--ms-text-muted)]">Émuler un garage</span>
          <ChevronDown size={14} className="text-[var(--ms-text-muted)]" />
        </button>
      )}

      {isOpen && !selectedGarage && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-[var(--ms-border)] bg-white shadow-lg">
          <div className="max-h-64 overflow-y-auto p-2">
            {garages.length === 0 ? (
              <p className="p-2 text-center text-sm text-[var(--ms-text-muted)]">
                Aucun garage trouvé
              </p>
            ) : (
              garages.map((garage) => (
                <button
                  key={garage.id}
                  onClick={() => handleSelect(garage)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--ms-bg-hover)]"
                >
                  <div className="font-medium text-[var(--ms-text)]">
                    {garage.name}
                  </div>
                  <div className="text-xs text-[var(--ms-text-muted)]">
                    {garage.email}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Hook to get the currently emulated garage ID (for use in fetch calls)
 */
export function useEmulatedGarageId(): number | null {
  const [garageId, setGarageId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin_emulate_garage");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGarageId(parsed.id);
      } catch {
        setGarageId(null);
      }
    }
  }, []);

  return garageId;
}

/**
 * Get emulated garage ID synchronously (for server components or initial load)
 */
export function getEmulatedGarageId(): number | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("admin_emulate_garage");
  if (!saved) return null;
  try {
    return JSON.parse(saved).id;
  } catch {
    return null;
  }
}
