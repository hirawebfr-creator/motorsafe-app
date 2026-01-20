"use client";

/**
 * CSV Import Tool Component
 * IMPORT-ONBOARDING-01
 * 
 * Multi-step import wizard:
 * 1. File upload
 * 2. Column mapping preview
 * 3. Dry-run results
 * 4. Confirm & commit
 */

import { useCallback, useState } from "react";
import { AlertTriangle, Check, ChevronRight, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";

type ImportKind = "clients" | "vehicules";

interface ImportStats {
  totalRows: number;
  toCreate: number;
  toUpdate: number;
  skipped: number;
  errorsCount: number;
  clientsNotFound?: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ColumnMapping {
  [targetField: string]: string | null;
}

interface DryRunResult {
  batchId: string;
  stats: ImportStats;
  errors: ValidationError[];
  duplicatesInBatch: number;
  preview: {
    toCreate: Record<string, string>[];
    toUpdate: { existingId: string; updates?: Record<string, string> }[];
    clientsNotFound?: { plate: string; clientEmail?: string }[];
  };
  headers: string[];
  mapping: ColumnMapping;
  delimiter: string;
}

interface ImportToolProps {
  kind: ImportKind;
  onComplete?: (batchId: string, created: number, updated: number) => void;
  onCancel?: () => void;
}

type Step = "upload" | "mapping" | "preview" | "commit" | "done";

const REQUIRED_FIELDS: Record<ImportKind, string[]> = {
  clients: ["firstName", "lastName"],
  vehicules: ["brand", "model", "plate"],
};

const OPTIONAL_FIELDS: Record<ImportKind, string[]> = {
  clients: ["email", "phone", "address", "notes"],
  vehicules: ["clientEmail", "clientId", "vin", "fuel", "year"],
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  email: "Email",
  phone: "Téléphone",
  address: "Adresse",
  notes: "Notes",
  brand: "Marque",
  model: "Modèle",
  plate: "Immatriculation",
  vin: "N° VIN",
  fuel: "Carburant",
  year: "Année",
  clientEmail: "Email client",
  clientId: "ID client",
};

export function ImportTool({ kind, onComplete, onCancel }: ImportToolProps) {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  
  const [commitResult, setCommitResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);
  
  const [updateExisting, setUpdateExisting] = useState(false);
  
  // File handling
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate size (1MB max)
    if (file.size > 1024 * 1024) {
      setError("Fichier trop volumineux (max 1 MB)");
      return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setCsvContent(content);
      setFileName(file.name);
      setError(null);
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier");
    };
    reader.readAsText(file, "UTF-8");
  }, []);
  
  // Dry run
  const runDryRun = useCallback(async (customMapping?: ColumnMapping) => {
    if (!csvContent) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/import/${kind}/dry-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent,
          mapping: customMapping,
        }),
      });
      
      const data = await res.json();
      
      if (!data.ok) {
        throw new Error(data.error?.message || "Erreur lors de la validation");
      }
      
      setDryRunResult(data.data);
      setMapping(data.data.mapping);
      setHeaders(data.data.headers);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [csvContent, kind]);
  
  // Commit import
  const commitImport = useCallback(async () => {
    if (!dryRunResult) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/import/${kind}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: dryRunResult.batchId,
          csvContent,
          updateExisting,
        }),
      });
      
      const data = await res.json();
      
      if (!data.ok) {
        throw new Error(data.error?.message || "Erreur lors de l'import");
      }
      
      setCommitResult(data.data);
      setStep("done");
      onComplete?.(dryRunResult.batchId, data.data.created, data.data.updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [dryRunResult, csvContent, updateExisting, kind, onComplete]);
  
  // Mapping change
  const handleMappingChange = useCallback((targetField: string, sourceColumn: string | null) => {
    setMapping((prev) => ({
      ...prev,
      [targetField]: sourceColumn,
    }));
  }, []);
  
  // Re-run with custom mapping
  const applyMapping = useCallback(() => {
    runDryRun(mapping);
  }, [runDryRun, mapping]);
  
  const requiredFields = REQUIRED_FIELDS[kind];
  const optionalFields = OPTIONAL_FIELDS[kind];
  const allFields = [...requiredFields, ...optionalFields];
  
  // Check if required fields are mapped
  const requiredMapped = requiredFields.every((f) => mapping[f]);
  
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <StepBadge active={step === "upload"} done={step !== "upload"}>1. Fichier</StepBadge>
        <ChevronRight size={16} className="text-muted2" />
        <StepBadge active={step === "mapping" || step === "preview"} done={step === "commit" || step === "done"}>2. Aperçu</StepBadge>
        <ChevronRight size={16} className="text-muted2" />
        <StepBadge active={step === "commit"} done={step === "done"}>3. Import</StepBadge>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/30 p-4 text-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Step: Upload */}
      {step === "upload" && (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet size={32} className="text-primary" />
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                Importer des {kind === "clients" ? "clients" : "véhicules"}
              </h3>
              <p className="text-muted2 mt-1">
                Fichier CSV avec séparateur ; ou , (max 1 MB)
              </p>
            </div>
            
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 p-6 transition-colors">
                <Upload size={20} className="text-muted2" />
                <span className="text-muted2">
                  {fileName || "Sélectionner un fichier CSV"}
                </span>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-success">
                <Check size={16} />
                <span>{fileName}</span>
              </div>
            )}
            
            <div className="flex gap-3 mt-4">
              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button
                disabled={!csvContent || loading}
                onClick={() => runDryRun()}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Analyser le fichier
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Step: Preview / Mapping */}
      {(step === "mapping" || step === "preview") && dryRunResult && (
        <div className="space-y-6">
          {/* Stats summary */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Résumé de l'analyse</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox label="Lignes totales" value={dryRunResult.stats.totalRows} />
              <StatBox label="À créer" value={dryRunResult.stats.toCreate} color="success" />
              <StatBox label="À mettre à jour" value={dryRunResult.stats.toUpdate} color="warning" />
              <StatBox label="Erreurs" value={dryRunResult.stats.errorsCount} color="danger" />
            </div>
            
            {kind === "vehicules" && dryRunResult.stats.clientsNotFound !== undefined && dryRunResult.stats.clientsNotFound > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                <strong>{dryRunResult.stats.clientsNotFound}</strong> véhicules sans client correspondant (seront ignorés)
              </div>
            )}
          </Card>
          
          {/* Column mapping */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Correspondance des colonnes</h3>
            <p className="text-sm text-muted2 mb-4">
              Vérifiez que les colonnes de votre fichier correspondent aux champs attendus.
            </p>
            
            <div className="grid gap-3">
              {allFields.map((field) => (
                <div key={field} className="flex items-center gap-4">
                  <div className="w-36 text-sm font-medium">
                    {FIELD_LABELS[field] || field}
                    {requiredFields.includes(field) && <span className="text-danger ml-1">*</span>}
                  </div>
                  <select
                    value={mapping[field] || ""}
                    onChange={(e) => handleMappingChange(field, e.target.value || null)}
                    className="flex-1 h-10 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="">— Non mappé —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  {mapping[field] && (
                    <Check size={16} className="text-success" />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={applyMapping} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Ré-analyser
              </Button>
            </div>
          </Card>
          
          {/* Errors preview */}
          {dryRunResult.errors.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-danger">
                Erreurs détectées ({dryRunResult.errors.length})
              </h3>
              <div className="max-h-48 overflow-auto space-y-2">
                {dryRunResult.errors.slice(0, 10).map((err, i) => (
                  <div key={i} className="text-sm flex gap-2">
                    <span className="text-muted2">Ligne {err.row}:</span>
                    <span className="font-medium">{err.field}</span>
                    <span className="text-danger">{err.message}</span>
                    {err.value && <span className="text-muted2">({err.value})</span>}
                  </div>
                ))}
                {dryRunResult.errors.length > 10 && (
                  <p className="text-sm text-muted2">
                    ... et {dryRunResult.errors.length - 10} autres erreurs
                  </p>
                )}
              </div>
            </Card>
          )}
          
          {/* Data preview */}
          {dryRunResult.preview.toCreate.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Aperçu des données à créer</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {allFields.filter((f) => mapping[f]).map((f) => (
                        <th key={f} className="py-2 px-3 text-left font-medium">
                          {FIELD_LABELS[f] || f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dryRunResult.preview.toCreate.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {allFields.filter((f) => mapping[f]).map((f) => (
                          <td key={f} className="py-2 px-3">
                            {(row as Record<string, string>)[f] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          
          {/* Update option */}
          {dryRunResult.stats.toUpdate > 0 && (
            <Card className="p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="h-5 w-5 rounded border-border"
                />
                <div>
                  <p className="font-medium">Mettre à jour les existants</p>
                  <p className="text-sm text-muted2">
                    {dryRunResult.stats.toUpdate} {kind === "clients" ? "clients" : "véhicules"} seront mis à jour avec les nouvelles données
                  </p>
                </div>
              </label>
            </Card>
          )}
          
          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("upload")}>
              Retour
            </Button>
            <div className="flex gap-3">
              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button
                disabled={!requiredMapped || loading || dryRunResult.stats.toCreate === 0}
                onClick={() => setStep("commit")}
              >
                Continuer
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step: Commit confirmation */}
      {step === "commit" && dryRunResult && (
        <Card className="p-6">
          <div className="text-center py-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Check size={32} className="text-primary" />
            </div>
            
            <h3 className="font-semibold text-lg mb-2">Confirmer l'import</h3>
            
            <p className="text-muted2 mb-4">
              {dryRunResult.stats.toCreate} {kind === "clients" ? "clients" : "véhicules"} seront créés
              {updateExisting && dryRunResult.stats.toUpdate > 0 && (
                <>, {dryRunResult.stats.toUpdate} seront mis à jour</>
              )}
            </p>
            
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep("preview")} disabled={loading}>
                Retour
              </Button>
              <Button onClick={commitImport} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Importer
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Step: Done */}
      {step === "done" && commitResult && (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="h-16 w-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
              <Check size={32} className="text-success" />
            </div>
            
            <h3 className="font-semibold text-xl mb-2">Import terminé !</h3>
            
            <div className="text-muted2 space-y-1">
              <p><strong className="text-success">{commitResult.created}</strong> créés</p>
              {commitResult.updated > 0 && (
                <p><strong className="text-warning">{commitResult.updated}</strong> mis à jour</p>
              )}
              {commitResult.skipped > 0 && (
                <p><strong className="text-muted2">{commitResult.skipped}</strong> ignorés</p>
              )}
              {commitResult.errors > 0 && (
                <p><strong className="text-danger">{commitResult.errors}</strong> erreurs</p>
              )}
            </div>
            
            <div className="mt-6">
              <Button onClick={onCancel}>
                Fermer
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper components
function StepBadge({ active, done, children }: { active: boolean; done: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        done
          ? "bg-success/10 text-success"
          : active
            ? "bg-primary/10 text-primary"
            : "bg-surface2 text-muted2"
      }`}
    >
      {children}
    </span>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: "success" | "warning" | "danger" }) {
  const colorClass = color === "success" ? "text-success" : color === "warning" ? "text-warning" : color === "danger" ? "text-danger" : "text-text";
  
  return (
    <div className="text-center p-3 rounded-lg bg-surface2">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-muted2">{label}</p>
    </div>
  );
}
