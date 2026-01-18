/**
 * INSURANCE-INCIDENT-01: Incident Case Section
 * 
 * Displays incident declaration, attachments, timeline, and export controls
 * within the intervention detail page.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  AlertTriangle,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  Download,
  Shield,
  Lock,
} from "lucide-react";

// === Types ===

type IncidentCaseStatus = "DRAFT" | "OPEN" | "CLOSED";
type IncidentType = 
  | "ENGINE" 
  | "GEARBOX" 
  | "ELECTRICAL" 
  | "TUNING_ISSUE" 
  | "ACCIDENT" 
  | "WARRANTY" 
  | "CUSTOMER_COMPLAINT" 
  | "OTHER";

interface IncidentCase {
  id: string;
  status: IncidentCaseStatus;
  incidentType: IncidentType | null;
  description: string | null;
  circumstances: string | null;
  damagesObserved: string | null;
  customerStatement: string | null;
  garageStatement: string | null;
  attachmentKeys: string[];
  customerSignatureId: string | null;
  garageSignatureId: string | null;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

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

const incidentTypeLabels: Record<IncidentType, string> = {
  ENGINE: "Moteur",
  GEARBOX: "Boîte de vitesses",
  ELECTRICAL: "Électrique",
  TUNING_ISSUE: "Problème lié à la modification",
  ACCIDENT: "Accident",
  WARRANTY: "Garantie",
  CUSTOMER_COMPLAINT: "Réclamation client",
  OTHER: "Autre",
};

function getStatusBadge(status: IncidentCaseStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="neutral" className="gap-1"><Clock size={12} /> Brouillon</Badge>;
    case "OPEN":
      return <Badge variant="accent" className="gap-1"><AlertTriangle size={12} /> Ouvert</Badge>;
    case "CLOSED":
      return <Badge variant="success" className="gap-1"><CheckCircle2 size={12} /> Clôturé</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

// === Main Component ===

interface IncidentSectionProps {
  interventionId: string;
  isClosed: boolean;
  isDisputeOpen: boolean;
  hasIncidentFeature: boolean; // INSURANCE_DOC (ESSENTIAL+)
  hasExportFeature: boolean;   // INCIDENT_REPORT (PRO only)
}

export function IncidentSection({
  interventionId,
  isClosed: _isClosed,
  isDisputeOpen,
  hasIncidentFeature,
  hasExportFeature,
}: IncidentSectionProps) {
  const [incidentCase, setIncidentCase] = useState<IncidentCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    incidentType: "" as IncidentType | "",
    description: "",
    circumstances: "",
    damagesObserved: "",
    customerStatement: "",
    garageStatement: "",
  });

  // Fetch incident case
  const fetchIncidentCase = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/interventions/${interventionId}/incident`);
      const data = await res.json();
      if (data.ok && data.data?.incidentCase) {
        setIncidentCase(data.data.incidentCase);
        // Populate form if exists
        const ic = data.data.incidentCase;
        setFormData({
          incidentType: ic.incidentType || "",
          description: ic.description || "",
          circumstances: ic.circumstances || "",
          damagesObserved: ic.damagesObserved || "",
          customerStatement: ic.customerStatement || "",
          garageStatement: ic.garageStatement || "",
        });
      } else {
        setIncidentCase(null);
      }
    } catch (err) {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [interventionId]);

  useEffect(() => {
    if (hasIncidentFeature) {
      fetchIncidentCase();
    } else {
      setLoading(false);
    }
  }, [hasIncidentFeature, fetchIncidentCase]);

  // Create incident case
  const createIncidentCase = async () => {
    setActionLoading("create");
    setError(null);
    try {
      const res = await fetch(`/api/interventions/${interventionId}/incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData.incidentType ? formData : {}),
      });
      const data = await res.json();
      if (data.ok) {
        setIncidentCase(data.data.incidentCase);
        setShowForm(true);
      } else {
        setError(data.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  // Update incident case
  const updateIncidentCase = async () => {
    if (!incidentCase) return;
    setActionLoading("update");
    setError(null);
    try {
      const res = await fetch(`/api/interventions/${interventionId}/incident`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) {
        setIncidentCase(data.data.incidentCase);
        setError(null);
      } else {
        setError(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  // Open incident case
  const openIncidentCase = async () => {
    setActionLoading("open");
    setError(null);
    try {
      const res = await fetch(`/api/interventions/${interventionId}/incident/open`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setIncidentCase(data.data.incidentCase);
      } else {
        setError(data.error || "Erreur lors de l'ouverture");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  // Close incident case
  const closeIncidentCase = async () => {
    setActionLoading("close");
    setError(null);
    try {
      const res = await fetch(`/api/interventions/${interventionId}/incident/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setIncidentCase(data.data.incidentCase);
      } else {
        setError(data.error || "Erreur lors de la clôture");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  // No feature access
  if (!hasIncidentFeature) {
    return (
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield size={16} />
          <span className="text-sm">Dossier incident disponible avec un abonnement ESSENTIAL+</span>
        </div>
      </Card>
    );
  }

  // Loading
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          <span>Chargement...</span>
        </div>
      </Card>
    );
  }

  // No incident case yet - show creation button
  if (!incidentCase) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <AlertTriangle className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Dossier Incident / Assurance</h3>
              <p className="text-sm text-muted-foreground">
                Créez un dossier pour documenter un incident lié à cette intervention
              </p>
            </div>
          </div>
          <Button
            onClick={createIncidentCase}
            disabled={actionLoading === "create"}
            variant="outline"
          >
            {actionLoading === "create" ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Plus className="mr-2" size={16} />
            )}
            Créer un dossier
          </Button>
        </div>
      </Card>
    );
  }

  // Incident case exists
  const isDraft = incidentCase.status === "DRAFT";
  const isOpen = incidentCase.status === "OPEN";
  const isCaseClosed = incidentCase.status === "CLOSED";
  const canEdit = isDraft && !isDisputeOpen;
  const canOpen = isDraft && formData.incidentType && formData.description.length >= 10;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
            <AlertTriangle className="text-orange-600 dark:text-orange-400" size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Dossier Incident / Assurance</h3>
            <p className="text-sm text-muted-foreground">
              Réf: {incidentCase.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(incidentCase.status)}
          {isDisputeOpen && (
            <Badge variant="warning" className="gap-1">
              <Lock size={12} /> Litige ouvert
            </Badge>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Form (editable only in DRAFT) */}
      {(showForm || incidentCase) && (
        <div className="space-y-4 mb-6">
          {/* Incident Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type d'incident *</label>
            <select
              value={formData.incidentType}
              onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as IncidentType })}
              disabled={!canEdit}
              className="w-full px-3 py-2 border rounded-lg bg-background disabled:bg-muted disabled:cursor-not-allowed"
            >
              <option value="">Sélectionner...</option>
              {Object.entries(incidentTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description de l'incident * (min 10 caractères)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!canEdit}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-background disabled:bg-muted disabled:cursor-not-allowed resize-y"
              placeholder="Décrivez ce qui s'est passé..."
            />
          </div>

          {/* Circumstances */}
          <div>
            <label className="block text-sm font-medium mb-1">Circonstances</label>
            <textarea
              value={formData.circumstances}
              onChange={(e) => setFormData({ ...formData, circumstances: e.target.value })}
              disabled={!canEdit}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg bg-background disabled:bg-muted disabled:cursor-not-allowed resize-y"
              placeholder="Comment et quand est-ce arrivé..."
            />
          </div>

          {/* Damages */}
          <div>
            <label className="block text-sm font-medium mb-1">Dégâts constatés</label>
            <textarea
              value={formData.damagesObserved}
              onChange={(e) => setFormData({ ...formData, damagesObserved: e.target.value })}
              disabled={!canEdit}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg bg-background disabled:bg-muted disabled:cursor-not-allowed resize-y"
              placeholder="Dommages visibles..."
            />
          </div>

          {/* Customer Statement */}
          <div>
            <label className="block text-sm font-medium mb-1">Déclaration du client</label>
            <textarea
              value={formData.customerStatement}
              onChange={(e) => setFormData({ ...formData, customerStatement: e.target.value })}
              disabled={!canEdit}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg bg-background disabled:bg-muted disabled:cursor-not-allowed resize-y"
              placeholder="Version du client..."
            />
            {incidentCase.customerSignatureId && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> Déclaration signée
              </p>
            )}
          </div>

          {/* Garage Statement */}
          <div>
            <label className="block text-sm font-medium mb-1">Déclaration du garage</label>
            <textarea
              value={formData.garageStatement}
              onChange={(e) => setFormData({ ...formData, garageStatement: e.target.value })}
              disabled={!canEdit}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg bg-background disabled:bg-muted disabled:cursor-not-allowed resize-y"
              placeholder="Évaluation professionnelle du garage..."
            />
            {incidentCase.garageSignatureId && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> Déclaration signée
              </p>
            )}
          </div>

          {/* Attachments info */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <strong>{incidentCase.attachmentKeys.length}</strong> pièce(s) jointe(s)
              </span>
              {/* TODO: Add attachment upload UI */}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t">
        {/* Save (DRAFT only) */}
        {canEdit && (
          <Button
            onClick={updateIncidentCase}
            disabled={actionLoading === "update"}
            variant="outline"
          >
            {actionLoading === "update" ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : null}
            Enregistrer
          </Button>
        )}

        {/* Open (DRAFT -> OPEN) */}
        {isDraft && (
          <Button
            onClick={openIncidentCase}
            disabled={!canOpen || actionLoading === "open"}
            variant="primary"
          >
            {actionLoading === "open" ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Send className="mr-2" size={16} />
            )}
            Ouvrir le dossier
          </Button>
        )}

        {/* Close (OPEN -> CLOSED) */}
        {isOpen && (
          <Button
            onClick={closeIncidentCase}
            disabled={actionLoading === "close"}
            variant="primary"
          >
            {actionLoading === "close" ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <CheckCircle2 className="mr-2" size={16} />
            )}
            Clôturer le dossier
          </Button>
        )}

        {/* View PDF */}
        {(isOpen || isCaseClosed) && (
          <Button
            onClick={() => window.open(`/api/interventions/${interventionId}/incident/summary.pdf`, "_blank")}
            variant="outline"
          >
            <FileText className="mr-2" size={16} />
            Voir le résumé PDF
          </Button>
        )}

        {/* Export ZIP (PRO only) */}
        {hasExportFeature && (isOpen || isCaseClosed) && (
          <Button
            onClick={() => window.open(`/api/interventions/${interventionId}/incident/export.zip`, "_blank")}
            variant="outline"
          >
            <Download className="mr-2" size={16} />
            Export assurance (ZIP)
          </Button>
        )}
      </div>

      {/* Dates footer */}
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
        <p>Créé le: {formatDate(incidentCase.createdAt)}</p>
        {incidentCase.openedAt && <p>Ouvert le: {formatDate(incidentCase.openedAt)}</p>}
        {incidentCase.closedAt && <p>Clôturé le: {formatDate(incidentCase.closedAt)}</p>}
      </div>
    </Card>
  );
}
