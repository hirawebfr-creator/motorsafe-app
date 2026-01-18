/**
 * LEGAL-RETENTION-01: Dispute Badge Component
 * 
 * Displays a visual indicator when an intervention is under dispute.
 * Shows locked state with option to view dispute details.
 */

"use client";

import { AlertTriangle, Lock, CheckCircle2 } from "lucide-react";

export type DisputeStatus = "OPEN" | "CLOSED" | null | undefined;

interface DisputeBadgeProps {
  status: DisputeStatus;
  openedAt?: string | null;
  showDetails?: boolean;
}

export function DisputeBadge({ 
  status, 
  openedAt, 
  showDetails = false 
}: DisputeBadgeProps) {
  if (!status) return null;

  const isOpen = status === "OPEN";

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
      isOpen 
        ? "bg-red-50 border-red-200 text-red-700" 
        : "bg-green-50 border-green-200 text-green-700"
    }`}>
      {isOpen ? (
        <>
          <Lock className="w-4 h-4" />
          <span className="font-medium text-sm">Litige en cours</span>
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-medium text-sm">Litige résolu</span>
        </>
      )}
      
      {showDetails && (
        <div className="ml-2 text-xs opacity-80">
          {isOpen && openedAt && (
            <span>Ouvert le {new Date(openedAt).toLocaleDateString("fr-FR")}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface DisputeDetailsCardProps {
  status: DisputeStatus;
  openedAt?: string | null;
  closedAt?: string | null;
  reason?: string | null;
  resolution?: string | null;
  snapshotHash?: string | null;
}

export function DisputeDetailsCard({
  status,
  openedAt,
  closedAt,
  reason,
  resolution,
  snapshotHash,
}: DisputeDetailsCardProps) {
  if (!status) return null;

  const isOpen = status === "OPEN";

  return (
    <div className={`rounded-lg border p-4 ${
      isOpen 
        ? "bg-red-50 border-red-200" 
        : "bg-green-50 border-green-200"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {isOpen ? (
          <>
            <Lock className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Intervention verrouillée - Litige en cours</h3>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Litige résolu</h3>
          </>
        )}
      </div>

      <div className="space-y-2 text-sm">
        {openedAt && (
          <div>
            <span className="font-medium">Ouvert le :</span>{" "}
            {new Date(openedAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        {reason && (
          <div>
            <span className="font-medium">Raison :</span>{" "}
            <span className={isOpen ? "text-red-700" : "text-gray-600"}>{reason}</span>
          </div>
        )}

        {closedAt && (
          <div>
            <span className="font-medium">Résolu le :</span>{" "}
            {new Date(closedAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        {resolution && (
          <div>
            <span className="font-medium">Résolution :</span>{" "}
            <span className="text-green-700">{resolution}</span>
          </div>
        )}

        {snapshotHash && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="font-medium text-xs text-gray-500">Hash snapshot :</span>{" "}
            <code className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded">
              {snapshotHash.slice(0, 16)}...
            </code>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 p-3 bg-red-100 rounded border border-red-300">
          <p className="text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Cette intervention ne peut pas être modifiée ou supprimée tant que le litige est ouvert.
            Les données sont verrouillées de manière tamper-evident.
          </p>
        </div>
      )}
    </div>
  );
}
