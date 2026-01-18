/**
 * LEGAL-RETENTION-01: GDPR Client Actions Component
 * 
 * Provides buttons for GDPR actions:
 * - Export client data as ZIP
 * - Anonymize client data
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { 
  UserX, 
  AlertTriangle, 
  Loader2,
  ShieldCheck,
  FileDown
} from "lucide-react";

interface GDPRActionsProps {
  clientId: number;
  clientName: string;
  isAnonymized?: boolean;
  anonymizedAt?: string | null;
  onAnonymized?: () => void;
  disabled?: boolean;
}

export function GDPRActions({ 
  clientId, 
  clientName,
  isAnonymized = false,
  anonymizedAt,
  onAnonymized,
  disabled = false 
}: GDPRActionsProps) {
  const [showAnonymizeDialog, setShowAnonymizeDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/export`, {
        method: "GET",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Erreur lors de l'export");
      }

      // Download the ZIP
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] 
        || `export_client_${clientId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setExporting(false);
    }
  };

  const handleAnonymize = async () => {
    if (reason.trim().length < 5) {
      setError("La raison doit contenir au moins 5 caractères");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/anonymize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          confirm: true, 
          reason: reason.trim() 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de l'anonymisation");
      }

      setShowAnonymizeDialog(false);
      setReason("");
      onAnonymized?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // If already anonymized, show status
  if (isAnonymized) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
        <ShieldCheck className="w-4 h-4" />
        <span>
          Données anonymisées
          {anonymizedAt && (
            <span className="ml-1 text-xs text-gray-500">
              le {new Date(anonymizedAt).toLocaleDateString("fr-FR")}
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        {/* Export button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={disabled || exporting}
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Export...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Export RGPD
            </>
          )}
        </Button>

        {/* Anonymize button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnonymizeDialog(true)}
          disabled={disabled}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <UserX className="w-4 h-4 mr-2" />
          Anonymiser
        </Button>
      </div>

      {error && !showAnonymizeDialog && (
        <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Anonymize Dialog */}
      {showAnonymizeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Anonymiser les données</h3>
                <p className="text-sm text-gray-500">{clientName}</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                <strong>Action irréversible !</strong> Les données personnelles seront remplacées 
                par &quot;Client anonymisé&quot;. Seuls les documents comptables seront conservés 
                (obligation légale 10 ans).
              </p>
            </div>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Vérifications automatiques :</strong>
              </p>
              <ul className="text-sm text-amber-700 mt-2 list-disc list-inside">
                <li>Aucune intervention en cours</li>
                <li>Aucun paiement en attente</li>
                <li>Snapshot créé dans la chaîne de preuves</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Raison de l&apos;anonymisation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Demande RGPD du client, fin de relation commerciale..."
                className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                  setShowAnonymizeDialog(false);
                  setReason("");
                  setError(null);
                }}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAnonymize}
                disabled={loading || reason.trim().length < 5}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Anonymisation...
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Anonymiser
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
