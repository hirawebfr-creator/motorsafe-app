"use client";

/**
 * EVIDENCE-CAPTURE-01: Restitution Page
 * 
 * Guided wizard for vehicle delivery:
 * 1. Tests de sortie checklist
 * 2. Réserves éventuelles
 * 3. Photos sortie (optionnel)
 * 4. Signature PV restitution client
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
// Badge import removed - not used in this page
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
  AlertTriangle,
  QrCode,
  RefreshCw,
  Trash2,
  LogOut,
  PenTool,
  X,
  ClipboardCheck,
  FileWarning,
} from "lucide-react";

// Types
type EvidenceSession = {
  id: string;
  status: "DRAFT" | "READY" | "SIGNED";
  deliveryCompletedAt: string | null;
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
  status: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    client: { firstName: string; lastName: string };
  };
  odometerKm: number | null;
  workNotes: string | null;
};

// Outtake checklist items
const OUTTAKE_ITEMS = [
  { key: "roadTest", label: "Essai routier effectué", description: "Le véhicule a été testé en conditions réelles" },
  { key: "lightsOff", label: "Voyants éteints", description: "Aucun voyant d'alerte au tableau de bord" },
  { key: "noisesGone", label: "Bruits résolus", description: "Les bruits signalés ont été corrigés" },
  { key: "leaksFixed", label: "Fuites corrigées", description: "Aucune fuite visible" },
  { key: "cleanVehicle", label: "Véhicule propre", description: "Habitacle et extérieur nettoyés" },
  { key: "toolsRemoved", label: "Outils retirés", description: "Aucun outil ou pièce oublié dans le véhicule" },
];

// Optional photo categories for delivery
const DELIVERY_PHOTOS = [
  { key: "FINAL_FRONT", label: "Avant final", description: "Vue avant après intervention" },
  { key: "FINAL_REAR", label: "Arrière final", description: "Vue arrière après intervention" },
  { key: "FINAL_DASHBOARD", label: "Tableau de bord", description: "Kilométrage sortie + voyants" },
  { key: "WORK_DONE", label: "Travaux effectués", description: "Photo des pièces changées / réparations" },
];

export default function RestitutionPage() {
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

  // Form state - Step 1: Checklist
  const [outtakeChecklist, setOuttakeChecklist] = useState<Record<string, boolean>>({});

  // Form state - Step 2: Reservations
  const [hasReservations, setHasReservations] = useState(false);
  const [reservations, setReservations] = useState("");

  // Form state - Step 3: Photos
  const [photos, setPhotos] = useState<Record<string, EvidenceItem | null>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoKey, setActivePhotoKey] = useState<string | null>(null);

  // Form state - Step 4: Signature
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

      // Get or create session
      const sessionRes = await fetch(`/api/interventions/${interventionId}/evidence-session?step=DELIVERY`);
      if (!sessionRes.ok) {
        // Create session if not exists
        const createRes = await fetch(`/api/interventions/${interventionId}/evidence-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "DELIVERY" }),
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
        const formItem = items.find((i: EvidenceItem) => i.type === "FORM" && i.category === "DELIVERY_FORM");
        if (formItem?.jsonData) {
          const data = formItem.jsonData as { outtakeChecklist?: Record<string, boolean>; hasReservations?: boolean; reservations?: string };
          if (data.outtakeChecklist) setOuttakeChecklist(data.outtakeChecklist);
          if (data.hasReservations !== undefined) setHasReservations(data.hasReservations);
          if (data.reservations) setReservations(data.reservations);
        }

        // Restore photos
        const photoItems = items.filter((i: EvidenceItem) => i.type === "PHOTO");
        const photoMap: Record<string, EvidenceItem | null> = {};
        for (const photo of DELIVERY_PHOTOS) {
          const found = photoItems.find((p: EvidenceItem) => p.category === `DELIVERY_${photo.key}`);
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

  // Save form data
  const saveFormData = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const formData = {
        outtakeChecklist,
        hasReservations,
        reservations: hasReservations ? reservations : "",
        savedAt: new Date().toISOString(),
      };

      await fetch(`/api/interventions/${interventionId}/evidence-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          type: "FORM",
          label: "PV de restitution",
          category: "DELIVERY_FORM",
          jsonData: formData,
        }),
      });

      await fetchData();
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
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const category = `DELIVERY_${activePhotoKey}`;
        const label = DELIVERY_PHOTOS.find((p) => p.key === activePhotoKey)?.label || activePhotoKey;

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

        await fetchData();
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
      // Save form data first
      await saveFormData();

      // Request signature
      const res = await fetch(`/api/interventions/${interventionId}/evidence-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "DELIVERY",
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

  // Poll signature status
  useEffect(() => {
    if (signatureStatus !== "sent") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/interventions/${interventionId}/evidence-sign?step=DELIVERY`);
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
  const checkedItems = Object.values(outtakeChecklist).filter(Boolean).length;
  const step1Valid = checkedItems >= 4; // At least 4 items checked
  const step2Valid = !hasReservations || reservations.trim().length >= 10;
  const step3Valid = true; // Photos are optional for delivery
  const step4Valid = signatureStatus === "signed";

  const canProceed = [step1Valid, step2Valid, step3Valid, step4Valid][step];

  if (loading) return <div className="flex justify-center py-12"><Loading /></div>;
  if (error) return <ErrorBanner message={error} />;
  if (!intervention) return <ErrorBanner message="Intervention introuvable" />;

  const isSigned = session?.status === "SIGNED" || signatureStatus === "signed";
  const photosUploaded = Object.values(photos).filter((p) => p !== null).length;

  return (
    <div className="grid gap-6 max-w-4xl mx-auto ms-animate-slide-up">
      <SectionHeader
        title="Restitution véhicule"
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
        {["Tests", "Réserves", "Photos", "Signature"].map((label, idx) => (
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
            <p className="font-semibold text-[var(--ms-success)]">PV de restitution signé</p>
            <p className="text-sm text-muted2">Le client a accepté l&apos;état de sortie du véhicule.</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <Card className="p-0 overflow-hidden">
        {/* Step 1: Outtake checklist */}
        {step === 0 && (
          <>
            <div className="ms-cardHeader flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
                <ClipboardCheck size={20} className="text-[var(--ms-success)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Tests de sortie</h3>
                <p className="text-xs text-muted2">{checkedItems}/{OUTTAKE_ITEMS.length} validés — Minimum 4 requis</p>
              </div>
            </div>
            <div className="ms-cardBody space-y-3">
              {OUTTAKE_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setOuttakeChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                  disabled={isSigned}
                  className={`w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all ${
                    outtakeChecklist[item.key]
                      ? "bg-[var(--ms-success-light)] border-2 border-[var(--ms-success)]"
                      : "bg-[var(--ms-bg-subtle)] border-2 border-transparent hover:border-[var(--ms-border)]"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      outtakeChecklist[item.key]
                        ? "bg-[var(--ms-success)] text-white"
                        : "bg-[var(--ms-border)]"
                    }`}
                  >
                    {outtakeChecklist[item.key] ? <Check size={16} /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted2">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Reservations */}
        {step === 1 && (
          <>
            <div className="ms-cardHeader flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]">
                <FileWarning size={20} className="text-[#B45309]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Réserves éventuelles</h3>
                <p className="text-xs text-muted2">Signaler les points non résolus ou observations</p>
              </div>
            </div>
            <div className="ms-cardBody space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setHasReservations(false)}
                  disabled={isSigned}
                  className={`flex-1 p-4 rounded-xl text-center transition-all ${
                    !hasReservations
                      ? "bg-[var(--ms-success-light)] border-2 border-[var(--ms-success)]"
                      : "bg-[var(--ms-bg-subtle)] border-2 border-transparent"
                  }`}
                >
                  <CheckCircle2 size={32} className={`mx-auto mb-2 ${!hasReservations ? "text-[var(--ms-success)]" : "text-muted2"}`} />
                  <p className="font-semibold">Aucune réserve</p>
                  <p className="text-sm text-muted2">Travaux conformes</p>
                </button>
                <button
                  type="button"
                  onClick={() => setHasReservations(true)}
                  disabled={isSigned}
                  className={`flex-1 p-4 rounded-xl text-center transition-all ${
                    hasReservations
                      ? "bg-[var(--ms-warning-light)] border-2 border-[var(--ms-warning)]"
                      : "bg-[var(--ms-bg-subtle)] border-2 border-transparent"
                  }`}
                >
                  <AlertTriangle size={32} className={`mx-auto mb-2 ${hasReservations ? "text-[#B45309]" : "text-muted2"}`} />
                  <p className="font-semibold">Réserves</p>
                  <p className="text-sm text-muted2">Points à signaler</p>
                </button>
              </div>
              {hasReservations && (
                <div>
                  <label className="block text-sm font-medium mb-2">Détail des réserves *</label>
                  <textarea
                    value={reservations}
                    onChange={(e) => setReservations(e.target.value)}
                    className="ms-input w-full min-h-[120px]"
                    placeholder="Décrivez les points non résolus, travaux à prévoir, observations importantes..."
                    disabled={isSigned}
                  />
                  {reservations.length < 10 && (
                    <p className="text-sm text-[var(--ms-warning)] mt-1">
                      Minimum 10 caractères requis
                    </p>
                  )}
                </div>
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
                <h3 className="text-lg font-semibold">Photos sortie (optionnel)</h3>
                <p className="text-xs text-muted2">{photosUploaded} photo(s) ajoutée(s)</p>
              </div>
            </div>
            <div className="ms-cardBody">
              <div className="grid grid-cols-2 gap-4">
                {DELIVERY_PHOTOS.map((photo) => {
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
                            {!isSigned && (
                              <button
                                onClick={() => deletePhoto(item.id, photo.key)}
                                className="absolute bottom-2 right-2 p-2 rounded-lg bg-white/90 text-[var(--ms-error)] hover:bg-[var(--ms-error)] hover:text-white"
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
                <h3 className="text-lg font-semibold">Signature PV restitution</h3>
                <p className="text-xs text-muted2">Le client signe pour accepter la restitution</p>
              </div>
            </div>
            <div className="ms-cardBody">
              {signatureStatus === "signed" || isSigned ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={64} className="mx-auto text-[var(--ms-success)] mb-4" />
                  <h4 className="text-xl font-bold text-[var(--ms-success)]">PV signé avec succès !</h4>
                  <p className="text-muted2 mt-2">
                    Le véhicule a été officiellement restitué au client.
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
                    Présentez le QR code au client.
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
                  <LogOut size={64} className="mx-auto text-muted2 mb-4" />
                  <h4 className="text-xl font-bold">Récapitulatif sortie</h4>
                  <div className="mt-4 text-left max-w-md mx-auto bg-[var(--ms-bg-subtle)] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted2">Tests validés</span>
                      <span className="font-semibold">{checkedItems}/{OUTTAKE_ITEMS.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted2">Réserves</span>
                      <span className={`font-semibold ${hasReservations ? "text-[var(--ms-warning)]" : "text-[var(--ms-success)]"}`}>
                        {hasReservations ? "Oui" : "Aucune"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted2">Photos sortie</span>
                      <span className="font-semibold">{photosUploaded}</span>
                    </div>
                  </div>
                  {hasReservations && reservations && (
                    <div className="mt-4 text-left max-w-md mx-auto bg-[var(--ms-warning-light)] rounded-xl p-4">
                      <p className="text-sm font-medium text-[#B45309] mb-1">Réserves signalées :</p>
                      <p className="text-sm">{reservations}</p>
                    </div>
                  )}
                  <div className="mt-6">
                    <Button onClick={startSignature} disabled={saving}>
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
              if (step === 0 || step === 1) {
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
