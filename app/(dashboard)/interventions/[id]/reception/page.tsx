"use client";

/**
 * EVIDENCE-CAPTURE-01: Reception Wizard Page
 * 
 * Guided wizard for vehicle intake:
 * 1. Kilométrage + niveau carburant
 * 2. Voyants / symptômes checklist
 * 3. Photos obligatoires (6 minimum)
 * 4. Signature état d'entrée client (QR code)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Loading } from "@/components/common/Loading";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { QRCodeDialog } from "@/components/common/QRCodeDialog";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  AlertTriangle,
  QrCode,
  RefreshCw,
  Trash2,
  Car,
  PenTool,
  X,
} from "lucide-react";

// Types
type EvidenceSession = {
  id: string;
  status: "DRAFT" | "READY" | "SIGNED";
  intakeCompletedAt: string | null;
  items: EvidenceItem[];
};

type EvidenceItem = {
  id: string;
  type: string;
  label: string;
  category: string;
  storageKey: string | null;
  jsonData: Record<string, unknown> | null;
  createdAt: string;
};

type Intervention = {
  id: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    client: { firstName: string; lastName: string };
  };
  odometerKm: number | null;
};

// Warning items for intake checklist
const WARNING_ITEMS = [
  { key: "engineLight", label: "Voyant moteur", icon: AlertTriangle },
  { key: "oilLight", label: "Voyant huile", icon: AlertTriangle },
  { key: "batteryLight", label: "Voyant batterie", icon: AlertTriangle },
  { key: "brakeLight", label: "Voyant freins", icon: AlertTriangle },
  { key: "absLight", label: "Voyant ABS", icon: AlertTriangle },
  { key: "airbagLight", label: "Voyant airbag", icon: AlertTriangle },
  { key: "tireLight", label: "Voyant pression pneus", icon: AlertTriangle },
  { key: "tempLight", label: "Voyant température", icon: AlertTriangle },
  { key: "noises", label: "Bruits anormaux", icon: AlertTriangle },
  { key: "leaks", label: "Fuites visibles", icon: AlertTriangle },
  { key: "bodyDamage", label: "Dégâts carrosserie", icon: AlertTriangle },
  { key: "scratches", label: "Rayures visibles", icon: AlertTriangle },
];

// Required photo categories
const REQUIRED_PHOTOS = [
  { key: "FRONT", label: "Avant", description: "Vue avant du véhicule" },
  { key: "REAR", label: "Arrière", description: "Vue arrière du véhicule" },
  { key: "LEFT", label: "Côté gauche", description: "Vue latérale gauche" },
  { key: "RIGHT", label: "Côté droit", description: "Vue latérale droite" },
  { key: "DASHBOARD", label: "Tableau de bord", description: "Kilométrage visible" },
  { key: "VIN", label: "Plaque VIN", description: "Numéro de châssis" },
];

// Fuel level options
const FUEL_LEVELS = [
  { value: 0, label: "Vide", color: "#ef4444" },
  { value: 25, label: "1/4", color: "#f97316" },
  { value: 50, label: "1/2", color: "#eab308" },
  { value: 75, label: "3/4", color: "#84cc16" },
  { value: 100, label: "Plein", color: "#22c55e" },
];

export default function ReceptionWizardPage() {
  const params = useParams();
  const router = useRouter();
  const interventionId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [session, setSession] = useState<EvidenceSession | null>(null);
  const [saving, setSaving] = useState(false);

  // Wizard step (0-3)
  const [step, setStep] = useState(0);

  // Form state - Step 1
  const [odometerKm, setOdometerKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState<number>(50);

  // Form state - Step 2
  const [warnings, setWarnings] = useState<Record<string, boolean>>({});
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Form state - Step 3
  const [photos, setPhotos] = useState<Record<string, EvidenceItem | null>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoKey, setActivePhotoKey] = useState<string | null>(null);

  // Form state - Step 4
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<"pending" | "sent" | "signed">("pending");

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
      if (intData.data?.odometerKm) {
        setOdometerKm(intData.data.odometerKm.toString());
      }

      // Get or create session
      const sessionRes = await fetch(`/api/interventions/${interventionId}/evidence-session?step=INTAKE`);
      if (!sessionRes.ok) {
        // Create session if not exists
        const createRes = await fetch(`/api/interventions/${interventionId}/evidence-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "INTAKE" }),
        });
        if (!createRes.ok) throw new Error("Erreur création session");
        const createData = await createRes.json();
        setSession(createData.data);
      } else {
        const sessionData = await sessionRes.json();
        setSession(sessionData.data);

        // Restore form state from session items
        const items = sessionData.data?.items ?? [];
        
        // Restore form data
        const formItem = items.find((i: EvidenceItem) => i.type === "FORM" && i.category === "INTAKE_FORM");
        if (formItem?.jsonData) {
          const data = formItem.jsonData as { warnings?: Record<string, boolean>; additionalNotes?: string; fuelLevel?: number };
          if (data.warnings) setWarnings(data.warnings);
          if (data.additionalNotes) setAdditionalNotes(data.additionalNotes);
          if (data.fuelLevel !== undefined) setFuelLevel(data.fuelLevel);
        }

        // Restore photos
        const photoItems = items.filter((i: EvidenceItem) => i.type === "PHOTO");
        const photoMap: Record<string, EvidenceItem | null> = {};
        for (const photo of REQUIRED_PHOTOS) {
          const found = photoItems.find((p: EvidenceItem) => p.category === `INTAKE_${photo.key}`);
          photoMap[photo.key] = found || null;
        }
        setPhotos(photoMap);

        // Check signature status
        const signItem = items.find((i: EvidenceItem) => i.type === "SIGNATURE");
        if (signItem) {
          setSignatureStatus("signed");
          setStep(3); // Jump to last step if signed
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

  // Save intake form data
  const saveFormData = async () => {
    if (!session) return;
    setSaving(true);
    try {
      // Update intervention with odometer
      await fetch(`/api/interventions/${interventionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odometerKm: odometerKm ? parseInt(odometerKm, 10) : null }),
      });

      // Save form item
      const formData = {
        warnings,
        additionalNotes,
        fuelLevel,
        savedAt: new Date().toISOString(),
      };

      await fetch(`/api/interventions/${interventionId}/evidence-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          type: "FORM",
          label: "Formulaire de réception",
          category: "INTAKE_FORM",
          jsonData: formData,
        }),
      });

      await fetchData(); // Refresh
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  // Upload photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session || !activePhotoKey) return;

    setUploading(activePhotoKey);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const category = `INTAKE_${activePhotoKey}`;
        const label = REQUIRED_PHOTOS.find((p) => p.key === activePhotoKey)?.label || activePhotoKey;

        // Upload via evidence-items API (inline upload)
        const res = await fetch(`/api/interventions/${interventionId}/evidence-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            type: "PHOTO",
            label: `Photo ${label}`,
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

        await fetchData(); // Refresh to get updated photos
        setUploading(null);
        setActivePhotoKey(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
      setUploading(null);
    }
  };

  // Delete photo
  const deletePhoto = async (itemId: string, key: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    setUploading(key);
    try {
      await fetch(`/api/interventions/${interventionId}/evidence-items?itemId=${itemId}`, {
        method: "DELETE",
      });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUploading(null);
    }
  };

  // Start signature flow
  const startSignature = async () => {
    if (!session) return;
    setSaving(true);
    try {
      // First, save form data if not saved
      await saveFormData();

      // Then request signature
      const res = await fetch(`/api/interventions/${interventionId}/evidence-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "INTAKE",
          sessionId: session.id,
          method: "QR_CODE",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? "Erreur signature");
      }

      const data = await res.json();
      setQrUrl(data.data?.signUrl);
      setSignatureStatus("sent");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  // Check signature status (poll)
  useEffect(() => {
    if (signatureStatus !== "sent") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/interventions/${interventionId}/evidence-sign?step=INTAKE`);
      if (res.ok) {
        const data = await res.json();
        if (data.data?.signed) {
          setSignatureStatus("signed");
          setQrUrl(null);
          clearInterval(interval);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [signatureStatus, interventionId]);

  // Validation
  const step1Valid = odometerKm.length > 0;
  const step2Valid = true; // Always valid (optional warnings)
  const photosUploaded = Object.values(photos).filter((p) => p !== null).length;
  const step3Valid = photosUploaded >= 6;
  const step4Valid = signatureStatus === "signed";

  const canProceed = [step1Valid, step2Valid, step3Valid, step4Valid][step];

  if (loading) return <div className="flex justify-center py-12"><Loading /></div>;
  if (error) return <ErrorBanner message={error} />;
  if (!intervention) return <ErrorBanner message="Intervention introuvable" />;

  const isSigned = session?.status === "SIGNED" || signatureStatus === "signed";

  return (
    <div className="grid gap-6 max-w-4xl mx-auto ms-animate-slide-up">
      <SectionHeader
        title="Réception véhicule"
        description={`${intervention.vehicle.plate} — ${intervention.vehicle.brand} ${intervention.vehicle.model}`}
        level={1}
        action={
          <Button variant="secondary" size="sm" onClick={() => router.push(`/interventions/${interventionId}`)}>
            <ChevronLeft size={16} className="mr-1" />
            Retour au dossier
          </Button>
        }
      />

      {/* Progress indicator */}
      <div className="flex items-center justify-between px-4">
        {["Kilométrage", "Voyants", "Photos", "Signature"].map((label, idx) => (
          <div key={idx} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
                idx < step
                  ? "bg-[var(--ms-success)] text-white"
                  : idx === step
                  ? "bg-[var(--ms-primary)] text-white"
                  : "bg-[var(--ms-bg-subtle)] text-muted2"
              }`}
            >
              {idx < step ? <Check size={18} /> : idx + 1}
            </div>
            <span className={`ml-2 hidden sm:inline text-sm ${idx === step ? "font-semibold" : "text-muted2"}`}>
              {label}
            </span>
            {idx < 3 && <div className={`mx-4 h-0.5 w-8 ${idx < step ? "bg-[var(--ms-success)]" : "bg-[var(--ms-border)]"}`} />}
          </div>
        ))}
      </div>

      {/* Signed banner */}
      {isSigned && (
        <div className="rounded-xl bg-[var(--ms-success-light)] border border-[var(--ms-success)] p-4 flex items-center gap-3">
          <CheckCircle2 size={24} className="text-[var(--ms-success)]" />
          <div>
            <p className="font-semibold text-[var(--ms-success)]">État d&apos;entrée signé</p>
            <p className="text-sm text-muted2">Le formulaire est verrouillé et les preuves sont scellées.</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <Card className="p-0 overflow-hidden">
        {/* Step 1: Odometer & Fuel */}
        {step === 0 && (
          <>
            <div className="ms-cardHeader flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
                <Gauge size={20} className="text-[var(--ms-primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Kilométrage & carburant</h3>
                <p className="text-xs text-muted2">Enregistrez le kilométrage et le niveau de carburant</p>
              </div>
            </div>
            <div className="ms-cardBody space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Kilométrage (km) *</label>
                <input
                  type="number"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  className="ms-input w-full text-2xl font-bold text-center py-4"
                  placeholder="125000"
                  disabled={isSigned}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Niveau de carburant</label>
                <div className="flex gap-2">
                  {FUEL_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFuelLevel(level.value)}
                      disabled={isSigned}
                      className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
                        fuelLevel === level.value
                          ? "ring-2 ring-offset-2"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: `${level.color}20`,
                        color: level.color,
                        // @ts-expect-error -- ringColor is a valid Tailwind custom property
                        "--tw-ring-color": level.color,
                      }}
                    >
                      <Fuel size={24} className="mx-auto mb-1" />
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Warnings checklist */}
        {step === 1 && (
          <>
            <div className="ms-cardHeader flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]">
                <AlertTriangle size={20} className="text-[#B45309]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Voyants & symptômes</h3>
                <p className="text-xs text-muted2">Cochez les anomalies constatées à l&apos;entrée</p>
              </div>
            </div>
            <div className="ms-cardBody space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WARNING_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setWarnings((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    disabled={isSigned}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      warnings[item.key]
                        ? "bg-[var(--ms-warning-light)] border-2 border-[var(--ms-warning)] text-[#B45309]"
                        : "bg-[var(--ms-bg-subtle)] border-2 border-transparent text-muted2 hover:border-[var(--ms-border)]"
                    }`}
                  >
                    <AlertTriangle size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes supplémentaires</label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="ms-input w-full min-h-[100px]"
                  placeholder="Autres observations..."
                  disabled={isSigned}
                />
              </div>
              {Object.values(warnings).filter(Boolean).length > 0 && (
                <Badge variant="warning">
                  {Object.values(warnings).filter(Boolean).length} anomalie(s) signalée(s)
                </Badge>
              )}
            </div>
          </>
        )}

        {/* Step 3: Photos */}
        {step === 2 && (
          <>
            <div className="ms-cardHeader flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-accent-light)]">
                <Camera size={20} className="text-[var(--ms-accent)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Photos obligatoires</h3>
                <p className="text-xs text-muted2">
                  {photosUploaded}/6 photos — Minimum 6 requises
                </p>
              </div>
            </div>
            <div className="ms-cardBody">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {REQUIRED_PHOTOS.map((photo) => {
                  const item = photos[photo.key];
                  const isUploading = uploading === photo.key;

                  return (
                    <div key={photo.key} className="relative">
                      {item ? (
                        <div className="rounded-xl border border-[var(--ms-success)] overflow-hidden">
                          <div className="aspect-video bg-[var(--ms-bg-subtle)] relative">
                            <img
                              src={item.storageKey ? `/api/uploads/file/${item.storageKey}` : ""}
                              alt={photo.label}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Badge style={{ background: "var(--ms-success)", color: "white" }}>
                                <Check size={12} className="mr-1" />
                                OK
                              </Badge>
                            </div>
                            {!isSigned && (
                              <button
                                onClick={() => deletePhoto(item.id, photo.key)}
                                className="absolute bottom-2 right-2 p-2 rounded-lg bg-white/90 text-[var(--ms-error)] hover:bg-[var(--ms-error)] hover:text-white transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                          <div className="p-2 text-center text-sm font-medium">{photo.label}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActivePhotoKey(photo.key);
                            fileInputRef.current?.click();
                          }}
                          disabled={isSigned || isUploading}
                          className="w-full aspect-video rounded-xl border-2 border-dashed border-[var(--ms-border)] flex flex-col items-center justify-center gap-2 hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-light)] transition-all"
                        >
                          {isUploading ? (
                            <RefreshCw size={24} className="animate-spin text-[var(--ms-primary)]" />
                          ) : (
                            <>
                              <Camera size={24} className="text-muted2" />
                              <span className="text-sm font-medium">{photo.label}</span>
                              <span className="text-xs text-muted2">{photo.description}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {photosUploaded < 6 && (
                <p className="mt-4 text-sm text-[var(--ms-warning)] text-center">
                  <AlertTriangle size={14} className="inline mr-1" />
                  Il manque {6 - photosUploaded} photo(s) pour pouvoir signer
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 4: Signature */}
        {step === 3 && (
          <>
            <div className="ms-cardHeader flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
                <PenTool size={20} className="text-[var(--ms-success)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Signature état d&apos;entrée</h3>
                <p className="text-xs text-muted2">Le client signe pour confirmer l&apos;état du véhicule</p>
              </div>
            </div>
            <div className="ms-cardBody">
              {signatureStatus === "signed" || isSigned ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={64} className="mx-auto text-[var(--ms-success)] mb-4" />
                  <h4 className="text-xl font-bold text-[var(--ms-success)]">Signé avec succès !</h4>
                  <p className="text-muted2 mt-2">
                    L&apos;état d&apos;entrée est maintenant verrouillé et horodaté.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => router.push(`/interventions/${interventionId}`)}>
                      <Check size={16} className="mr-1" />
                      Retour au dossier
                    </Button>
                  </div>
                </div>
              ) : signatureStatus === "sent" ? (
                <div className="text-center py-8">
                  <QrCode size={64} className="mx-auto text-[var(--ms-primary)] mb-4" />
                  <h4 className="text-xl font-bold">En attente de signature</h4>
                  <p className="text-muted2 mt-2">
                    Présentez le QR code au client pour qu&apos;il signe sur son téléphone.
                  </p>
                  <div className="mt-4 flex justify-center gap-4">
                    <Button variant="secondary" onClick={() => setQrUrl(qrUrl)}>
                      <QrCode size={16} className="mr-1" />
                      Afficher QR code
                    </Button>
                    <Button variant="ghost" onClick={() => setSignatureStatus("pending")}>
                      <X size={16} className="mr-1" />
                      Annuler
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted2">
                    <RefreshCw size={14} className="animate-spin" />
                    Vérification automatique...
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car size={64} className="mx-auto text-muted2 mb-4" />
                  <h4 className="text-xl font-bold">Récapitulatif</h4>
                  <div className="mt-4 text-left max-w-md mx-auto bg-[var(--ms-bg-subtle)] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted2">Kilométrage</span>
                      <span className="font-semibold">{odometerKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted2">Carburant</span>
                      <span className="font-semibold">{FUEL_LEVELS.find((f) => f.value === fuelLevel)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted2">Anomalies</span>
                      <span className="font-semibold">{Object.values(warnings).filter(Boolean).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted2">Photos</span>
                      <span className="font-semibold">{photosUploaded}/6</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button onClick={startSignature} disabled={saving || !step3Valid}>
                      {saving ? (
                        <RefreshCw size={16} className="mr-1 animate-spin" />
                      ) : (
                        <QrCode size={16} className="mr-1" />
                      )}
                      Générer QR code signature
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Navigation */}
      {!isSigned && (
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft size={16} className="mr-1" />
            Précédent
          </Button>
          <Button
            onClick={async () => {
              if (step === 1) {
                await saveFormData();
              }
              setStep((s) => Math.min(3, s + 1));
            }}
            disabled={!canProceed || step === 3}
          >
            {saving ? (
              <RefreshCw size={16} className="mr-1 animate-spin" />
            ) : (
              <>
                Suivant
                <ChevronRight size={16} className="ml-1" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* QR Code Dialog */}
      {qrUrl && <QRCodeDialog url={qrUrl} onClose={() => setQrUrl(null)} />}
    </div>
  );
}
