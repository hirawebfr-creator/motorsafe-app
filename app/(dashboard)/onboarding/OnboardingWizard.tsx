"use client";

/**
 * Onboarding Wizard Component
 * IMPORT-ONBOARDING-01
 * 
 * 6-step wizard:
 * 1. Garage info (namePublic, city)
 * 2. Branding (logo, color) - if feature enabled
 * 3. Taxes (TVA) + numbering
 * 4. Import clients (CSV)
 * 5. Import vehicles (CSV)
 * 6. Verification + "Go live"
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Palette,
  Receipt,
  Rocket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ImportTool } from "@/components/common/ImportTool";

interface GarageData {
  id: number;
  name: string;
  displayName: string | null;
  city: string | null;
  logoKey: string | null;
  brandColor: string | null;
  vatNumber: string | null;
  defaultVatRate: number;
  quotePrefix: string;
  invoicePrefix: string;
  interventionPrefix: string;
  onboardingStatus: string | null;
}

interface ImportBatchInfo {
  id: string;
  kind: "CLIENTS" | "VEHICULES";
  stats: { created?: number; updated?: number };
  createdAt: string;
}

interface OnboardingWizardProps {
  garage: GarageData;
  hasBranding: boolean;
  hasImport: boolean;
  importBatches: ImportBatchInfo[];
  clientCount: number;
  vehicleCount: number;
}

type StepKey = "info" | "branding" | "taxes" | "clients" | "vehicules" | "finish";

interface Step {
  key: StepKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  optional?: boolean;
}

export function OnboardingWizard({
  garage,
  hasBranding,
  hasImport,
  importBatches,
  clientCount,
  vehicleCount,
}: OnboardingWizardProps) {
  const router = useRouter();
  
  // Build steps based on features
  const steps: Step[] = [
    { key: "info", label: "Informations", icon: Building2, description: "Nom public et ville" },
    ...(hasBranding ? [{ key: "branding" as StepKey, label: "Apparence", icon: Palette, description: "Logo et couleur", optional: true }] : []),
    { key: "taxes", label: "Taxes & Numérotation", icon: Receipt, description: "TVA et préfixes" },
    ...(hasImport ? [
      { key: "clients" as StepKey, label: "Clients", icon: Users, description: "Importer vos clients", optional: true },
      { key: "vehicules" as StepKey, label: "Véhicules", icon: Car, description: "Importer vos véhicules", optional: true },
    ] : []),
    { key: "finish", label: "Terminé", icon: Rocket, description: "Commencer à utiliser" },
  ];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: garage.displayName || garage.name,
    city: garage.city || "",
    brandColor: garage.brandColor || "#4F46E5",
    vatNumber: garage.vatNumber || "",
    defaultVatRate: garage.defaultVatRate ?? 0.2,
    quotePrefix: garage.quotePrefix || "DEV",
    invoicePrefix: garage.invoicePrefix || "FAC",
    interventionPrefix: garage.interventionPrefix || "INT",
  });
  
  // Import state
  const [showImportClients, setShowImportClients] = useState(false);
  const [showImportVehicles, setShowImportVehicles] = useState(false);
  const [importedClients, setImportedClients] = useState(
    importBatches.filter((b) => b.kind === "CLIENTS").reduce((acc, b) => acc + (b.stats.created || 0), 0)
  );
  const [importedVehicles, setImportedVehicles] = useState(
    importBatches.filter((b) => b.kind === "VEHICULES").reduce((acc, b) => acc + (b.stats.created || 0), 0)
  );
  
  const step = steps[currentStep];
  
  const handleChange = useCallback((field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);
  
  const saveGarageInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/garage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName,
          city: formData.city,
          brandColor: formData.brandColor,
          vatNumber: formData.vatNumber,
          defaultVatRate: formData.defaultVatRate,
          quotePrefix: formData.quotePrefix,
          invoicePrefix: formData.invoicePrefix,
          interventionPrefix: formData.interventionPrefix,
          onboardingStatus: "IN_PROGRESS",
        }),
      });
      
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error?.message || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [formData]);
  
  const finishOnboarding = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/garage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingStatus: "DONE",
        }),
      });
      
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error?.message || "Erreur lors de la finalisation");
      }
      
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  const goNext = useCallback(async () => {
    // Save data on certain steps
    if (step.key === "info" || step.key === "taxes" || step.key === "branding") {
      try {
        await saveGarageInfo();
      } catch {
        return; // Don't advance if save failed
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [step.key, currentStep, steps.length, saveGarageInfo]);
  
  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <div
              key={s.key}
              className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
            >
              <button
                type="button"
                onClick={() => i < currentStep && setCurrentStep(i)}
                disabled={i > currentStep}
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full transition-all
                  ${i === currentStep
                    ? "bg-primary text-white shadow-lg"
                    : i < currentStep
                      ? "bg-success/20 text-success cursor-pointer hover:bg-success/30"
                      : "bg-surface2 text-muted2"
                  }
                `}
              >
                {i < currentStep ? (
                  <Check size={18} />
                ) : (
                  <s.icon size={18} />
                )}
              </button>
              
              {i < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded
                    ${i < currentStep ? "bg-success" : "bg-surface2"}
                  `}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted2">
            Étape {currentStep + 1} sur {steps.length}: {step.label}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}
      
      {/* Step content */}
      <Card className="p-6 sm:p-8">
        {/* Step: Info */}
        {step.key === "info" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Informations du garage</h2>
              <p className="text-muted2 mt-1">
                Ces informations apparaîtront sur vos documents et votre page publique
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom public</label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="Garage Dupont"
                />
                <p className="text-xs text-muted2 mt-1">
                  Le nom affiché à vos clients
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ville</label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Step: Branding */}
        {step.key === "branding" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Palette size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Apparence</h2>
              <p className="text-muted2 mt-1">
                Personnalisez l'apparence de vos documents
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Couleur principale</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => handleChange("brandColor", e.target.value)}
                    className="h-12 w-20 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.brandColor}
                    onChange={(e) => handleChange("brandColor", e.target.value)}
                    placeholder="#4F46E5"
                    className="w-32"
                  />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-surface2 text-sm text-muted2">
                <p>
                  💡 Le logo peut être ajouté dans les <strong>Paramètres</strong> du garage.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step: Taxes */}
        {step.key === "taxes" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Receipt size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Taxes & Numérotation</h2>
              <p className="text-muted2 mt-1">
                Configuration de la TVA et des préfixes de numérotation
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">N° TVA intracommunautaire</label>
                <Input
                  value={formData.vatNumber}
                  onChange={(e) => handleChange("vatNumber", e.target.value)}
                  placeholder="FR12345678901"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Taux de TVA par défaut</label>
                <select
                  value={formData.defaultVatRate}
                  onChange={(e) => handleChange("defaultVatRate", parseFloat(e.target.value))}
                  className="w-full h-11 rounded-lg border border-border bg-surface px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="0.2">20% (taux normal)</option>
                  <option value="0.1">10% (taux intermédiaire)</option>
                  <option value="0.055">5,5% (taux réduit)</option>
                  <option value="0">Exonéré</option>
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Préfixe devis</label>
                  <Input
                    value={formData.quotePrefix}
                    onChange={(e) => handleChange("quotePrefix", e.target.value.toUpperCase())}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Préfixe factures</label>
                  <Input
                    value={formData.invoicePrefix}
                    onChange={(e) => handleChange("invoicePrefix", e.target.value.toUpperCase())}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Préfixe interventions</label>
                  <Input
                    value={formData.interventionPrefix}
                    onChange={(e) => handleChange("interventionPrefix", e.target.value.toUpperCase())}
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step: Import Clients */}
        {step.key === "clients" && (
          <div className="space-y-6">
            {!showImportClients ? (
              <>
                <div className="text-center mb-6">
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users size={32} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Importer vos clients</h2>
                  <p className="text-muted2 mt-1">
                    Importez votre base clients existante depuis un fichier CSV
                  </p>
                </div>
                
                <div className="text-center py-8">
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-primary">{clientCount}</p>
                    <p className="text-sm text-muted2">clients dans votre base</p>
                  </div>
                  
                  {importedClients > 0 && (
                    <p className="text-sm text-success mb-4">
                      ✓ {importedClients} clients importés récemment
                    </p>
                  )}
                  
                  <Button onClick={() => setShowImportClients(true)}>
                    <FileSpreadsheet size={18} />
                    Importer un fichier CSV
                  </Button>
                  
                  <p className="text-xs text-muted2 mt-4">
                    Cette étape est optionnelle. Vous pouvez ajouter des clients manuellement.
                  </p>
                </div>
              </>
            ) : (
              <ImportTool
                kind="clients"
                onComplete={(_, created) => {
                  setImportedClients((c) => c + created);
                  setShowImportClients(false);
                }}
                onCancel={() => setShowImportClients(false)}
              />
            )}
          </div>
        )}
        
        {/* Step: Import Vehicles */}
        {step.key === "vehicules" && (
          <div className="space-y-6">
            {!showImportVehicles ? (
              <>
                <div className="text-center mb-6">
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Car size={32} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Importer vos véhicules</h2>
                  <p className="text-muted2 mt-1">
                    Importez votre parc véhicules depuis un fichier CSV
                  </p>
                </div>
                
                <div className="text-center py-8">
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-primary">{vehicleCount}</p>
                    <p className="text-sm text-muted2">véhicules dans votre base</p>
                  </div>
                  
                  {importedVehicles > 0 && (
                    <p className="text-sm text-success mb-4">
                      ✓ {importedVehicles} véhicules importés récemment
                    </p>
                  )}
                  
                  <Button onClick={() => setShowImportVehicles(true)}>
                    <FileSpreadsheet size={18} />
                    Importer un fichier CSV
                  </Button>
                  
                  <p className="text-xs text-muted2 mt-4">
                    Assurez-vous d'avoir importé les clients d'abord pour le lien automatique.
                  </p>
                </div>
              </>
            ) : (
              <ImportTool
                kind="vehicules"
                onComplete={(_, created) => {
                  setImportedVehicles((c) => c + created);
                  setShowImportVehicles(false);
                }}
                onCancel={() => setShowImportVehicles(false)}
              />
            )}
          </div>
        )}
        
        {/* Step: Finish */}
        {step.key === "finish" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-20 w-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                <Rocket size={40} className="text-success" />
              </div>
              <h2 className="text-2xl font-semibold">Configuration terminée !</h2>
              <p className="text-muted2 mt-2">
                Votre garage est prêt à utiliser MotorSafe
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="text-center p-4 rounded-lg bg-surface2">
                <p className="text-3xl font-bold text-primary">{clientCount}</p>
                <p className="text-sm text-muted2">Clients</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-surface2">
                <p className="text-3xl font-bold text-primary">{vehicleCount}</p>
                <p className="text-sm text-muted2">Véhicules</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button size="lg" onClick={finishOnboarding} disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
                Commencer à utiliser MotorSafe
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* Navigation */}
      {step.key !== "finish" && !showImportClients && !showImportVehicles && (
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 0 || loading}
          >
            <ChevronLeft size={18} />
            Précédent
          </Button>
          
          <div className="flex gap-3">
            {step.optional && (
              <Button variant="ghost" onClick={goNext} disabled={loading}>
                Passer
              </Button>
            )}
            <Button onClick={goNext} disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Suivant
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
