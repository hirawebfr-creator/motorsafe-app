"use client";

/**
 * EVIDENCE-CAPTURE-01: Tech Page (OBD Upload)
 * 
 * Upload OBD diagnostic reports before and after intervention:
 * - OBD_AVANT: Diagnostic before work
 * - OBD_APRES: Diagnostic after work
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Loading } from "@/components/common/Loading";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import {
  ChevronLeft,
  Check,
  CheckCircle2,
  FileText,
  RefreshCw,
  Trash2,
  Upload,
  Cpu,
  FileCode,
  AlertCircle,
} from "lucide-react";

// Types
type EvidenceSession = {
  id: string;
  status: "DRAFT" | "READY" | "SIGNED";
  techCompletedAt: string | null;
  items: EvidenceItem[];
};

type EvidenceItem = {
  id: string;
  type: string;
  label: string;
  category: string;
  storageKey: string | null;
  fileName: string | null;
  jsonData: Record<string, unknown> | null;
  createdAt: string;
};

type Intervention = {
  id: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
  };
  workNotes: string | null;
  ecuType: string | null;
  softwareVersion: string | null;
  checksum: string | null;
};

// OBD report categories
const OBD_REPORTS = [
  { key: "OBD_AVANT", label: "Diagnostic avant travaux", description: "Rapport OBD initial avant intervention", icon: AlertCircle, color: "var(--ms-warning)" },
  { key: "OBD_APRES", label: "Diagnostic après travaux", description: "Rapport OBD final après intervention", icon: CheckCircle2, color: "var(--ms-success)" },
];

export default function TechPage() {
  const params = useParams();
  const router = useRouter();
  const interventionId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [session, setSession] = useState<EvidenceSession | null>(null);
  const [saving, setSaving] = useState(false);

  // OBD reports
  const [reports, setReports] = useState<Record<string, EvidenceItem | null>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeReportKey, setActiveReportKey] = useState<string | null>(null);

  // Tech notes
  const [techNotes, setTechNotes] = useState("");

  // Load intervention and session
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get intervention
      const intRes = await fetch(`/api/interventions/${interventionId}`);
      if (!intRes.ok) throw new Error("Intervention introuvable");
      const intData = await intRes.json();
      setIntervention(intData.data);

      // Get or create session
      const sessionRes = await fetch(`/api/interventions/${interventionId}/evidence-session?step=TECH`);
      if (!sessionRes.ok) {
        // Create session if not exists
        const createRes = await fetch(`/api/interventions/${interventionId}/evidence-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "TECH" }),
        });
        if (!createRes.ok) throw new Error("Erreur création session");
        const createData = await createRes.json();
        setSession(createData.data);
      } else {
        const sessionData = await sessionRes.json();
        setSession(sessionData.data);

        // Restore uploaded reports
        const items = sessionData.data?.items ?? [];
        const reportMap: Record<string, EvidenceItem | null> = {};
        for (const report of OBD_REPORTS) {
          const found = items.find((i: EvidenceItem) => i.type === "OBD_REPORT" && i.category === report.key);
          reportMap[report.key] = found || null;
        }
        setReports(reportMap);

        // Restore tech notes
        const noteItem = items.find((i: EvidenceItem) => i.type === "NOTE" && i.category === "TECH_NOTES");
        if (noteItem?.jsonData) {
          const data = noteItem.jsonData as { notes?: string };
          if (data.notes) setTechNotes(data.notes);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [interventionId]);

  useEffect(() => {
    if (interventionId) fetchData();
  }, [interventionId, fetchData]);

  // Upload OBD report
  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session || !activeReportKey) return;

    setUploading(activeReportKey);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const category = activeReportKey;
        const label = OBD_REPORTS.find((r) => r.key === activeReportKey)?.label || activeReportKey;

        // Upload via evidence-items API
        const res = await fetch(`/api/interventions/${interventionId}/evidence-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            type: "OBD_REPORT",
            label,
            category,
            contentBase64: base64,
            fileName: file.name,
            mime: file.type,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message ?? "Erreur upload");
        }

        await fetchData();
        setUploading(null);
        setActiveReportKey(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
      setUploading(null);
    }
  };

  // Delete report
  const deleteReport = async (itemId: string, key: string) => {
    if (!confirm("Supprimer ce rapport ?")) return;
    setUploading(key);
    try {
      await fetch(`/api/interventions/${interventionId}/evidence-items?itemId=${itemId}`, {
        method: "DELETE",
      });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUploading(null);
    }
  };

  // Save tech notes
  const saveTechNotes = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`/api/interventions/${interventionId}/evidence-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          type: "NOTE",
          label: "Notes techniques",
          category: "TECH_NOTES",
          jsonData: { notes: techNotes, savedAt: new Date().toISOString() },
        }),
      });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  // Complete tech step
  const completeTechStep = async () => {
    if (!session) return;
    setSaving(true);
    try {
      // Save notes first
      if (techNotes.trim()) {
        await saveTechNotes();
      }

      // Mark step complete
      await fetch(`/api/interventions/${interventionId}/evidence-session?step=TECH`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completeStep: "TECH" }),
      });

      router.push(`/interventions/${interventionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const reportsUploaded = Object.values(reports).filter((r) => r !== null).length;
  const isComplete = session?.techCompletedAt !== null;

  if (loading) return <div className="flex justify-center py-12"><Loading /></div>;
  if (error) return <ErrorBanner message={error} />;
  if (!intervention) return <ErrorBanner message="Intervention introuvable" />;

  return (
    <div className="grid gap-6 max-w-4xl mx-auto ms-animate-slide-up">
      <SectionHeader
        title="Diagnostics techniques"
        description={`${intervention.vehicle.plate} — ${intervention.vehicle.brand} ${intervention.vehicle.model}`}
        level={1}
        action={
          <Button variant="secondary" size="sm" onClick={() => router.push(`/interventions/${interventionId}`)}>
            <ChevronLeft size={16} className="mr-1" />
            Retour au dossier
          </Button>
        }
      />

      {/* Completed banner */}
      {isComplete && (
        <div className="rounded-xl bg-[var(--ms-success-light)] border border-[var(--ms-success)] p-4 flex items-center gap-3">
          <CheckCircle2 size={24} className="text-[var(--ms-success)]" />
          <div>
            <p className="font-semibold text-[var(--ms-success)]">Diagnostics validés</p>
            <p className="text-sm text-muted2">Les rapports OBD sont enregistrés.</p>
          </div>
        </div>
      )}

      {/* ECU Info from intervention */}
      {(intervention.ecuType || intervention.softwareVersion || intervention.checksum) && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Cpu size={20} className="text-[var(--ms-primary)]" />
            <h3 className="font-semibold">Données ECU enregistrées</h3>
          </div>
          <div className="grid gap-2 text-sm">
            {intervention.ecuType && (
              <div className="flex justify-between">
                <span className="text-muted2">Type ECU</span>
                <span className="font-mono">{intervention.ecuType}</span>
              </div>
            )}
            {intervention.softwareVersion && (
              <div className="flex justify-between">
                <span className="text-muted2">Version logiciel</span>
                <span className="font-mono">{intervention.softwareVersion}</span>
              </div>
            )}
            {intervention.checksum && (
              <div className="flex justify-between">
                <span className="text-muted2">Checksum</span>
                <span className="font-mono text-xs">{intervention.checksum}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* OBD Reports Upload */}
      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-accent-light)]">
            <FileCode size={20} className="text-[var(--ms-accent)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Rapports OBD</h3>
            <p className="text-xs text-muted2">{reportsUploaded}/2 rapports téléchargés</p>
          </div>
        </div>
        <div className="ms-cardBody space-y-4">
          {OBD_REPORTS.map((report) => {
            const item = reports[report.key];
            const isUploading = uploading === report.key;
            const Icon = report.icon;

            return (
              <div
                key={report.key}
                className={`rounded-xl border-2 p-4 transition-all ${
                  item
                    ? "border-[var(--ms-success)] bg-[var(--ms-success-light)]"
                    : "border-dashed border-[var(--ms-border)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${report.color}20` }}
                    >
                      <Icon size={20} style={{ color: report.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{report.label}</h4>
                      <p className="text-sm text-muted2">{report.description}</p>
                    </div>
                  </div>
                  {item ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">
                        <Check size={12} className="mr-1" />
                        Téléchargé
                      </Badge>
                      {!isComplete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReport(item.id, report.key)}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveReportKey(report.key);
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploading || isComplete}
                    >
                      {isUploading ? (
                        <RefreshCw size={14} className="mr-1 animate-spin" />
                      ) : (
                        <Upload size={14} className="mr-1" />
                      )}
                      Télécharger
                    </Button>
                  )}
                </div>
                {item && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted2">
                    <FileText size={14} />
                    <span>{item.fileName}</span>
                    <span>—</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("fr-FR")}</span>
                    <a
                      href={`/api/uploads/file/${item.storageKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--ms-primary)] hover:underline ml-auto"
                    >
                      Voir le fichier
                    </a>
                  </div>
                )}
              </div>
            );
          })}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.xml,.json,.html,.htm"
            className="hidden"
            onChange={handleReportUpload}
          />
        </div>
      </Card>

      {/* Tech Notes */}
      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
            <FileText size={20} className="text-[var(--ms-primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Notes techniques</h3>
            <p className="text-xs text-muted2">Observations du technicien</p>
          </div>
        </div>
        <div className="ms-cardBody">
          <textarea
            value={techNotes}
            onChange={(e) => setTechNotes(e.target.value)}
            className="ms-input w-full min-h-[150px]"
            placeholder="Observations techniques, codes erreur relevés, remarques..."
            disabled={isComplete}
          />
          {!isComplete && (
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={saveTechNotes} disabled={saving}>
                {saving ? (
                  <RefreshCw size={16} className="mr-1 animate-spin" />
                ) : (
                  <Check size={16} className="mr-1" />
                )}
                Enregistrer notes
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() => router.push(`/interventions/${interventionId}`)}
        >
          <ChevronLeft size={16} className="mr-1" />
          Retour
        </Button>
        {!isComplete && (
          <Button onClick={completeTechStep} disabled={saving || reportsUploaded === 0}>
            {saving ? (
              <RefreshCw size={16} className="mr-1 animate-spin" />
            ) : (
              <CheckCircle2 size={16} className="mr-1" />
            )}
            Valider diagnostics
          </Button>
        )}
      </div>
    </div>
  );
}
