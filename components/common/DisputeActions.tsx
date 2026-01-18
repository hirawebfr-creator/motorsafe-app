/**
 * LEGAL-RETENTION-01: Dispute Actions Component
 * 
 * Provides buttons to open/close dispute on an intervention.
 * Includes confirmation dialogs with reason/resolution input.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { 
  AlertTriangle, 
  Lock, 
  Unlock, 
  CheckCircle2,
  Loader2
} from "lucide-react";

interface DisputeActionsProps {
  interventionId: string;
  disputeStatus: "OPEN" | "CLOSED" | null | undefined;
  onDisputeChange?: () => void;
  disabled?: boolean;
}

export function DisputeActions({ 
  interventionId, 
  disputeStatus, 
  onDisputeChange,
  disabled = false 
}: DisputeActionsProps) {
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = disputeStatus === "OPEN";

  const handleOpenDispute = async () => {
    if (reason.trim().length < 5) {
      setError("La raison doit contenir au moins 5 caractères");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/interventions/${interventionId}/dispute/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de l'ouverture du litige");
      }

      setShowOpenDialog(false);
      setReason("");
      onDisputeChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDispute = async () => {
    if (resolution.trim().length < 5) {
      setError("La résolution doit contenir au moins 5 caractères");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/interventions/${interventionId}/dispute/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: resolution.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de la résolution du litige");
      }

      setShowCloseDialog(false);
      setResolution("");
      onDisputeChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Already resolved dispute - no actions needed
  if (disputeStatus === "CLOSED") {
    return null;
  }

  return (
    <>
      {/* Main action button */}
      {!isOpen ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOpenDialog(true)}
          disabled={disabled}
          className="text-amber-600 border-amber-300 hover:bg-amber-50"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Ouvrir un litige
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCloseDialog(true)}
          disabled={disabled}
          className="text-green-600 border-green-300 hover:bg-green-50"
        >
          <Unlock className="w-4 h-4 mr-2" />
          Résoudre le litige
        </Button>
      )}

      {/* Open Dispute Dialog */}
      {showOpenDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ouvrir un litige</h3>
                <p className="text-sm text-gray-500">Cette action verrouillera l&apos;intervention</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                <strong>Attention :</strong> Un litige ouvert empêche toute modification ou suppression 
                de l&apos;intervention. Un snapshot tamper-evident sera créé.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Raison du litige <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Décrivez la raison du litige (contestation client, problème juridique, etc.)"
                className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">{reason.length}/1000</div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOpenDialog(false);
                  setReason("");
                  setError(null);
                }}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleOpenDispute}
                disabled={loading || reason.trim().length < 5}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verrouillage...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Ouvrir le litige
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Dispute Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Résoudre le litige</h3>
                <p className="text-sm text-gray-500">L&apos;intervention sera déverrouillée</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Une fois résolu, l&apos;intervention pourra à nouveau être modifiée.
                La résolution sera enregistrée dans la chaîne de preuves.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Résolution <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Décrivez comment le litige a été résolu (accord amiable, décision juridique, etc.)"
                className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                maxLength={2000}
              />
              <div className="text-xs text-gray-500 mt-1">{resolution.length}/2000</div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCloseDialog(false);
                  setResolution("");
                  setError(null);
                }}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCloseDispute}
                disabled={loading || resolution.trim().length < 5}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Résolution...
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Résoudre
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
