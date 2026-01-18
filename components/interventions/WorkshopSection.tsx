/**
 * WORKSHOP-OPS-01: Workshop Operations Section
 * 
 * Displays OR (Repair Order), Return Report, and Loan Vehicle controls
 * within the intervention detail page.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Car,
  Plus,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react";

// === Types ===

type RepairOrderStatus = "DRAFT" | "SENT" | "SIGNED" | "CANCELLED";
type ReturnReportStatus = "DRAFT" | "SENT" | "SIGNED";

type RepairOrder = {
  id: string;
  status: RepairOrderStatus;
  issuedAt: string | null;
  signedAt: string | null;
  pdfKey: string | null;
  signatureRequestId: string | null;
};

type ReturnReport = {
  id: string;
  status: ReturnReportStatus;
  issuedAt: string | null;
  signedAt: string | null;
  checklistJson: string | null;
  photosKeys: string[];
};

// === Helpers ===

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="neutral" className="gap-1"><Clock size={12} /> Brouillon</Badge>;
    case "SENT":
      return <Badge variant="accent" className="gap-1"><Send size={12} /> Envoyé</Badge>;
    case "SIGNED":
      return <Badge variant="success" className="gap-1"><CheckCircle2 size={12} /> Signé</Badge>;
    case "CANCELLED":
      return <Badge variant="warning" className="gap-1"><XCircle size={12} /> Annulé</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

// === Main Component ===

interface WorkshopSectionProps {
  interventionId: string;
  isClosed: boolean;
  hasRepairOrderFeature: boolean;
  hasReturnReportFeature: boolean;
  hasLoanVehicleFeature: boolean;
}

export function WorkshopSection({
  interventionId,
  isClosed,
  hasRepairOrderFeature,
  hasReturnReportFeature,
  hasLoanVehicleFeature,
}: WorkshopSectionProps) {
  const [repairOrder, setRepairOrder] = useState<RepairOrder | null>(null);
  const [returnReport, setReturnReport] = useState<ReturnReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing OR and Return Report
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orRes, rrRes] = await Promise.all([
        fetch(`/api/interventions/${interventionId}/repair-order`),
        fetch(`/api/interventions/${interventionId}/return-report`),
      ]);

      if (orRes.ok) {
        const orData = await orRes.json();
        if (orData.ok && orData.data?.exists) {
          setRepairOrder(orData.data.repairOrder);
        }
      }

      if (rrRes.ok) {
        const rrData = await rrRes.json();
        if (rrData.ok && rrData.data?.exists) {
          setReturnReport(rrData.data.returnReport);
        }
      }
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [interventionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Repair Order
  const handleCreateOR = async () => {
    setActionLoading("createOR");
    setError(null);
    try {
      const res = await fetch(`/api/interventions/${interventionId}/repair-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || "Erreur lors de la création");
      }
      setRepairOrder(data.data.repairOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  // Issue Repair Order (send for signature)
  const handleIssueOR = async () => {
    if (!repairOrder) return;
    setActionLoading("issueOR");
    setError(null);
    try {
      const res = await fetch(`/api/repair-order/${repairOrder.id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || "Erreur lors de l'envoi");
      }
      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  // Create Return Report
  const handleCreateRR = async () => {
    setActionLoading("createRR");
    setError(null);
    try {
      const res = await fetch(`/api/interventions/${interventionId}/return-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || "Erreur lors de la création");
      }
      setReturnReport(data.data.returnReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]">
            <ClipboardCheck size={20} className="text-[var(--ms-warning)]" />
          </div>
          <div>
            <h3 className="font-semibold">Atelier</h3>
            <p className="text-sm text-muted2">Chargement...</p>
          </div>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-muted2" size={24} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]">
          <ClipboardCheck size={20} className="text-[var(--ms-warning)]" />
        </div>
        <div>
          <h3 className="font-semibold">Atelier</h3>
          <p className="text-sm text-muted2">Documents légaux et véhicule de prêt</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--ms-error-light)] text-[var(--ms-error)] text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Ordre de Réparation */}
        {hasRepairOrderFeature && (
          <div className="p-4 rounded-lg border border-[var(--ms-border-light)] bg-[var(--ms-bg-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-[var(--ms-primary)]" />
              <span className="font-medium">Ordre de Réparation</span>
            </div>

            {repairOrder ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusBadge(repairOrder.status)}
                </div>
                {repairOrder.issuedAt && (
                  <p className="text-xs text-muted2">Émis le {formatDate(repairOrder.issuedAt)}</p>
                )}
                {repairOrder.signedAt && (
                  <p className="text-xs text-[var(--ms-success)]">Signé le {formatDate(repairOrder.signedAt)}</p>
                )}

                {repairOrder.status === "DRAFT" && (
                  <Button
                    size="sm"
                    onClick={handleIssueOR}
                    disabled={actionLoading === "issueOR"}
                    className="w-full gap-1"
                  >
                    {actionLoading === "issueOR" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Envoyer à signer
                  </Button>
                )}

                {repairOrder.pdfKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1"
                    onClick={() => window.open(`/api/uploads/file/${repairOrder.pdfKey}`, "_blank")}
                  >
                    <ExternalLink size={14} />
                    Voir le PDF
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted2">Aucun ordre de réparation</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCreateOR}
                  disabled={actionLoading === "createOR"}
                  className="w-full gap-1"
                >
                  {actionLoading === "createOR" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Créer l'OR
                </Button>
              </div>
            )}
          </div>
        )}

        {/* PV de Restitution */}
        {hasReturnReportFeature && (
          <div className="p-4 rounded-lg border border-[var(--ms-border-light)] bg-[var(--ms-bg-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck size={18} className="text-[var(--ms-success)]" />
              <span className="font-medium">PV Restitution</span>
            </div>

            {returnReport ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusBadge(returnReport.status)}
                </div>
                {returnReport.signedAt && (
                  <p className="text-xs text-[var(--ms-success)]">Signé le {formatDate(returnReport.signedAt)}</p>
                )}
                {returnReport.photosKeys.length > 0 && (
                  <p className="text-xs text-muted2">{returnReport.photosKeys.length} photo(s)</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted2">
                  {isClosed ? "Créer le PV de restitution" : "Disponible après clôture"}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCreateRR}
                  disabled={!isClosed || actionLoading === "createRR"}
                  className="w-full gap-1"
                >
                  {actionLoading === "createRR" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Créer le PV
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Véhicule de Prêt */}
        {hasLoanVehicleFeature && (
          <div className="p-4 rounded-lg border border-[var(--ms-border-light)] bg-[var(--ms-bg-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <Car size={18} className="text-[var(--ms-info)]" />
              <span className="font-medium">Véhicule de prêt</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted2">Gérez les véhicules de courtoisie</p>
              <a
                href="/vehicules-pret"
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[var(--ms-text-secondary)] transition-colors hover:bg-[var(--ms-bg-subtle)]"
              >
                <ExternalLink size={14} />
                Voir la flotte
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Feature gate message */}
      {!hasRepairOrderFeature && !hasReturnReportFeature && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--ms-bg-subtle)] text-sm text-muted2 text-center">
          Les fonctionnalités Atelier sont disponibles avec le plan Essentiel ou Pro.
        </div>
      )}
    </Card>
  );
}
