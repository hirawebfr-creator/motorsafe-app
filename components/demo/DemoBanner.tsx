"use client";

/**
 * DEMO-SCENARIO-01: Demo Banner Component
 * 
 * Displays a prominent banner when demo mode is active.
 * Provides quick access to demo panel and reset.
 */

import { useState } from "react";
import { Play, X } from "lucide-react";
import DemoPanel from "./DemoPanel";

interface DemoBannerProps {
  garageId: number;
  garageName: string;
  onDisable: () => void;
}

export default function DemoBanner({ garageId, garageName, onDisable }: DemoBannerProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      {/* Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <Play className="h-4 w-4" />
            <span className="font-bold text-sm">MODE DÉMO</span>
          </div>
          <span className="text-sm opacity-90">
            Garage : <strong>{garageName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPanelOpen(true)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-sm font-medium transition-colors"
          >
            <Play className="h-4 w-4" />
            Ouvrir le guide
          </button>
          <button
            onClick={onDisable}
            className="flex items-center gap-1 hover:bg-white/20 rounded px-2 py-1 text-sm transition-colors"
            title="Désactiver le mode démo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Panel */}
      <DemoPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        garageId={garageId}
      />
    </>
  );
}
