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
  ClipboardCheck,
  FileWarning,
  Loader2,
  Mail,
  Send,
  ExternalLink,
  FileText,
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

// Step labels
const STEP_LABELS = ["Tests", "Réserves", "Photos", "Signature"];

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
  const [emailSent, setEmailSent] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState("");

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

      // Get or create session - always try to create first to ensure we have one
      const createRes = await fetch(`/api/interventions/${interventionId}/evidence-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "DELIVERY" }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        console.error("Session creation error:", errData);
        throw new Error("Erreur création session");
      }

      const createData = await createRes.json();
      console.log("Session API response:", createData);

      // Extract session from response - API returns { data: { session: {...} } }
      const sessionObj = createData.data?.session || createData.data;
      console.log("Extracted session:", sessionObj);

      if (!sessionObj?.id) {
        console.error("No session ID in response:", createData);
        throw new Error("Session invalide");
      }

      setSession(sessionObj);

      // If session already existed, restore form state from existing items
      if (!createData.data?.created) {
        const items = sessionObj?.items ?? [];

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
    if (!file || !session || !activePhotoKey) {
      console.log("Upload cancelled - missing:", { file: !!file, session: !!session, activePhotoKey });
      return;
    }

    const currentPhotoKey = activePhotoKey;
    setUploading(currentPhotoKey);

    console.log("Session state:", session);
    console.log("Session ID:", session?.id);

    if (!session?.id) {
      alert("Session non initialisée. Veuillez rafraîchir la page.");
      setUploading(null);
      return;
    }

    try {
      // Read file as base64
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Erreur lecture fichier"));
        reader.readAsDataURL(file);
      });

      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,") to get pure base64
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        throw new Error("Format de fichier invalide");
      }

      const category = `DELIVERY_${currentPhotoKey}`;
      const label = DELIVERY_PHOTOS.find((p) => p.key === currentPhotoKey)?.label || currentPhotoKey;

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
        const errData = await res.json().catch(() => ({}));
        console.error("API Error:", res.status, JSON.stringify(errData, null, 2));
        const details = errData?.error?.details?.fieldErrors || errData?.error?.details || {};
        console.error("Validation details:", details);
        throw new Error(errData?.error?.message ?? errData?.message ?? `Erreur upload (${res.status})`);
      }

      await fetchData();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(null);
      setActivePhotoKey(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  // Start signature flow - send PV by email
  const sendPvByEmail = async () => {
    if (!session) return;
    setSaving(true);
    try {
      // Save form data first
      await saveFormData();

      // Send PV by email
      const res = await fetch(`/api/interventions/${interventionId}/delivery-pv/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          clientEmail: clientEmail || undefined, // Override if provided
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? "Erreur envoi email");
      }

      const data = await res.json();
      setSigningUrl(data.data?.signingUrl);
      setEmailSent(true);
      setSignatureStatus("sent");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  // Legacy QR code method (keep for fallback)
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
  const step1Valid = true; // Tests are now optional but recommended
  const step2Valid = !hasReservations || reservations.trim().length >= 10;
  const step3Valid = true; // Photos are optional for delivery
  const step4Valid = signatureStatus === "signed";

  const canProceed = [step1Valid, step2Valid, step3Valid, step4Valid][step];

  // Styles
  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "20px 24px",
    borderBottom: "1px solid #f3f4f6",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: "24px",
  };

  const primaryButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(26, 26, 46, 0.2)",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    background: "#ffffff",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "120px",
    padding: "12px 16px",
    fontSize: "14px",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px", minHeight: "400px" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#1a1a2e" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#dc2626" }}>
        <strong>Erreur:</strong> {error}
      </div>
    );
  }

  if (!intervention) {
    return (
      <div style={{ padding: "24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#dc2626" }}>
        Intervention introuvable
      </div>
    );
  }

  const isSigned = session?.status === "SIGNED" || signatureStatus === "signed";
  const photosUploaded = Object.values(photos).filter((p) => p !== null).length;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Restitution véhicule</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            {intervention.vehicle.plate} — {intervention.vehicle.brand} {intervention.vehicle.model}
          </p>
        </div>
        <button
          onClick={() => router.push(`/interventions/${interventionId}`)}
          style={secondaryButtonStyle}
        >
          <ChevronLeft size={16} />
          Retour au dossier
        </button>
      </div>

      {/* Progress indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
        {STEP_LABELS.map((label, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "16px",
                transition: "all 0.3s",
                ...(idx < step
                  ? { background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)" }
                  : idx === step
                  ? { background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", color: "#ffffff", boxShadow: "0 2px 8px rgba(26, 26, 46, 0.3)" }
                  : { background: "#f3f4f6", color: "#9ca3af" }),
              }}
            >
              {idx < step ? <Check size={20} /> : idx + 1}
            </div>
            <span
              style={{
                marginLeft: "12px",
                fontSize: "14px",
                fontWeight: idx === step ? 600 : 400,
                color: idx === step ? "#1a1a2e" : "#9ca3af",
                display: "none",
              }}
              className="step-label"
            >
              {label}
            </span>
            {idx < 3 && (
              <div
                style={{
                  width: "40px",
                  height: "3px",
                  marginLeft: "16px",
                  marginRight: "16px",
                  borderRadius: "2px",
                  background: idx < step ? "#10b981" : "#e5e7eb",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Signed banner */}
      {isSigned && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px", background: "#ecfdf5", border: "2px solid #10b981", borderRadius: "16px" }}>
          <CheckCircle2 size={28} style={{ color: "#10b981" }} />
          <div>
            <p style={{ fontWeight: 700, color: "#047857", margin: 0 }}>PV de restitution signé</p>
            <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Le client a accepté l&apos;état de sortie du véhicule.</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <div style={cardStyle}>
        {/* Step 1: Outtake checklist */}
        {step === 0 && (
          <>
            <div style={cardHeaderStyle}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ClipboardCheck size={24} style={{ color: "#16a34a" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Tests de sortie</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{checkedItems}/{OUTTAKE_ITEMS.length} validés — Recommandé pour votre protection</p>
              </div>
            </div>
            <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
              {OUTTAKE_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setOuttakeChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                  disabled={isSigned}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px",
                    borderRadius: "12px",
                    textAlign: "left",
                    cursor: isSigned ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    ...(outtakeChecklist[item.key]
                      ? { background: "#ecfdf5", border: "2px solid #10b981" }
                      : { background: "#f9fafb", border: "2px solid transparent" }),
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      ...(outtakeChecklist[item.key]
                        ? { background: "#10b981", color: "#ffffff" }
                        : { background: "#e5e7eb", color: "#9ca3af" }),
                    }}
                  >
                    {outtakeChecklist[item.key] && <Check size={16} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: "#1a1a2e", margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>{item.description}</p>
                  </div>
                </button>
              ))}

              {/* Warning if not enough tests checked */}
              {checkedItems < 4 && (
                <div style={{ marginTop: "8px", padding: "16px 20px", borderRadius: "12px", background: "#fef2f2", border: "1px solid #fecaca" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <AlertTriangle size={20} style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <p style={{ fontWeight: 600, color: "#991b1b", margin: 0 }}>
                        {checkedItems === 0 ? "Aucun test validé" : `Seulement ${checkedItems} test(s) validé(s)`}
                      </p>
                      <p style={{ fontSize: "13px", color: "#b91c1c", marginTop: "6px" }}>
                        <strong>Risques en cas de litige :</strong> Sans validation des tests de sortie, vous ne pourrez pas prouver que le véhicule fonctionnait correctement lors de la restitution. En cas de réclamation du client (panne, bruit, voyant allumé...), votre responsabilité pourrait être engagée.
                      </p>
                      <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px" }}>
                        Nous recommandons fortement de valider au moins 4 tests avant de continuer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 2: Reservations */}
        {step === 1 && (
          <>
            <div style={cardHeaderStyle}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileWarning size={24} style={{ color: "#b45309" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Réserves éventuelles</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Signaler les points non résolus ou observations</p>
              </div>
            </div>
            <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <button
                  type="button"
                  onClick={() => setHasReservations(false)}
                  disabled={isSigned}
                  style={{
                    padding: "24px 16px",
                    borderRadius: "12px",
                    textAlign: "center",
                    cursor: isSigned ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    ...(!hasReservations
                      ? { background: "#ecfdf5", border: "3px solid #10b981" }
                      : { background: "#f9fafb", border: "2px solid transparent" }),
                  }}
                >
                  <CheckCircle2 size={40} style={{ margin: "0 auto 12px", color: !hasReservations ? "#10b981" : "#9ca3af" }} />
                  <p style={{ fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Aucune réserve</p>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Travaux conformes</p>
                </button>
                <button
                  type="button"
                  onClick={() => setHasReservations(true)}
                  disabled={isSigned}
                  style={{
                    padding: "24px 16px",
                    borderRadius: "12px",
                    textAlign: "center",
                    cursor: isSigned ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    ...(hasReservations
                      ? { background: "#fffbeb", border: "3px solid #f59e0b" }
                      : { background: "#f9fafb", border: "2px solid transparent" }),
                  }}
                >
                  <AlertTriangle size={40} style={{ margin: "0 auto 12px", color: hasReservations ? "#f59e0b" : "#9ca3af" }} />
                  <p style={{ fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Réserves</p>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Points à signaler</p>
                </button>
              </div>
              {hasReservations && (
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
                    Détail des réserves *
                  </label>
                  <textarea
                    value={reservations}
                    onChange={(e) => setReservations(e.target.value)}
                    style={textareaStyle}
                    placeholder="Décrivez les points non résolus, travaux à prévoir, observations importantes..."
                    disabled={isSigned}
                  />
                  {reservations.length < 10 && (
                    <p style={{ fontSize: "13px", color: "#f59e0b", marginTop: "8px" }}>
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
            <div style={cardHeaderStyle}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera size={24} style={{ color: "#7c3aed" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Photos sortie (optionnel)</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{photosUploaded} photo(s) ajoutée(s)</p>
              </div>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                {DELIVERY_PHOTOS.map((photo) => {
                  const item = photos[photo.key];
                  const isUploading = uploading === photo.key;

                  return (
                    <div key={photo.key} style={{ position: "relative" }}>
                      {item ? (
                        <div style={{ borderRadius: "12px", border: "2px solid #10b981", overflow: "hidden" }}>
                          <div style={{ aspectRatio: "16/10", background: "#f3f4f6", position: "relative" }}>
                            <img
                              src={item.storageKey ? `/api/uploads/file/${item.storageKey}` : ""}
                              alt={photo.label}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {!isSigned && (
                              <button
                                onClick={() => deletePhoto(item.id, photo.key)}
                                style={{ position: "absolute", bottom: "8px", right: "8px", padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.9)", color: "#dc2626", border: "none", cursor: "pointer" }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                          <div style={{ padding: "8px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                            {photo.label}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActivePhotoKey(photo.key);
                            fileInputRef.current?.click();
                          }}
                          disabled={isSigned || isUploading}
                          style={{
                            width: "100%",
                            aspectRatio: "16/10",
                            borderRadius: "12px",
                            border: "2px dashed #d1d5db",
                            background: "#f9fafb",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            cursor: isSigned || isUploading ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {isUploading ? (
                            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#7c3aed" }} />
                          ) : (
                            <>
                              <Camera size={24} style={{ color: "#9ca3af" }} />
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{photo.label}</span>
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
                style={{ display: "none" }}
                onChange={handlePhotoUpload}
              />
            </div>
          </>
        )}

        {/* Step 4: Signature */}
        {step === 3 && (
          <>
            <div style={cardHeaderStyle}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mail size={24} style={{ color: "#16a34a" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Envoi PV de restitution</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Le client recevra un email professionnel avec le PV complet</p>
              </div>
            </div>
            <div style={cardBodyStyle}>
              {signatureStatus === "signed" || isSigned ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <CheckCircle2 size={64} style={{ color: "#10b981", margin: "0 auto 16px" }} />
                  <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#10b981", margin: 0 }}>PV signé avec succès !</h4>
                  <p style={{ color: "#6b7280", marginTop: "8px" }}>
                    Le véhicule a été officiellement restitué au client.
                  </p>
                  <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <a
                      href={`/api/interventions/${interventionId}/delivery-pv/pdf?sessionId=${session?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...secondaryButtonStyle, textDecoration: "none" }}
                    >
                      <FileText size={16} />
                      Télécharger le PDF
                    </a>
                    <button
                      onClick={() => router.push(`/interventions/${interventionId}`)}
                      style={primaryButtonStyle}
                    >
                      <Check size={16} />
                      Retour au dossier
                    </button>
                  </div>
                </div>
              ) : emailSent || signatureStatus === "sent" ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Send size={36} style={{ color: "#2563eb" }} />
                  </div>
                  <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Email envoyé !</h4>
                  <p style={{ color: "#6b7280", marginTop: "8px", maxWidth: "400px", margin: "8px auto 0" }}>
                    Le client a reçu un email avec le PV complet et un lien de signature sécurisé.
                  </p>

                  {/* Email details */}
                  <div style={{ marginTop: "24px", maxWidth: "400px", margin: "24px auto 0", background: "#f0fdf4", borderRadius: "12px", padding: "16px", border: "1px solid #bbf7d0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Mail size={16} style={{ color: "#16a34a" }} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#166534" }}>Email envoyé au client</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#15803d", margin: 0 }}>
                      Le PDF inclut : logo garage, SIRET, coordonnées, photos, tests, et réserves.
                    </p>
                  </div>

                  <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                    {signingUrl && (
                      <a
                        href={signingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...secondaryButtonStyle, textDecoration: "none" }}
                      >
                        <ExternalLink size={16} />
                        Ouvrir le lien signature
                      </a>
                    )}
                    <a
                      href={`/api/interventions/${interventionId}/delivery-pv/pdf?sessionId=${session?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...secondaryButtonStyle, textDecoration: "none" }}
                    >
                      <FileText size={16} />
                      Voir le PDF
                    </a>
                  </div>

                  <div style={{ marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                    <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                    Vérification automatique de la signature...
                  </div>

                  <button
                    onClick={() => { setSignatureStatus("pending"); setEmailSent(false); }}
                    style={{ marginTop: "16px", background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}
                  >
                    Renvoyer l&apos;email
                  </button>
                </div>
              ) : (
                <div style={{ padding: "16px 0" }}>
                  {/* Summary */}
                  <div style={{ maxWidth: "500px", margin: "0 auto" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a2e", margin: "0 0 16px", textAlign: "center" }}>
                      Récapitulatif du PV
                    </h4>

                    <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ color: "#6b7280" }}>Véhicule</span>
                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{intervention?.vehicle?.brand} {intervention?.vehicle?.model}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ color: "#6b7280" }}>Immatriculation</span>
                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{intervention?.vehicle?.plate}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ color: "#6b7280" }}>Tests validés</span>
                        <span style={{ fontWeight: 600, color: checkedItems >= 4 ? "#10b981" : "#f59e0b" }}>{checkedItems}/{OUTTAKE_ITEMS.length}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ color: "#6b7280" }}>Réserves</span>
                        <span style={{ fontWeight: 600, color: hasReservations ? "#f59e0b" : "#10b981" }}>
                          {hasReservations ? "Signalées" : "Aucune"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                        <span style={{ color: "#6b7280" }}>Photos jointes</span>
                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{photosUploaded} photo(s)</span>
                      </div>
                    </div>

                    {hasReservations && reservations && (
                      <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "12px", background: "#fffbeb", border: "1px solid #fcd34d" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#b45309", marginBottom: "4px" }}>Réserves signalées :</p>
                        <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>{reservations}</p>
                      </div>
                    )}

                    {/* Email preview */}
                    <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderRadius: "12px", padding: "20px", color: "#fff", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <Mail size={20} style={{ color: "#4ade80" }} />
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#4ade80" }}>Email professionnel</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, lineHeight: "1.6" }}>
                        Le client recevra un email professionnel contenant :<br />
                        • Logo et coordonnées du garage<br />
                        • Récapitulatif des tests et réserves<br />
                        • Photos de sortie<br />
                        • Lien de signature sécurisé (7 jours)<br />
                        • PDF complet en pièce jointe
                      </p>
                    </div>

                    {/* Optional: Override email */}
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                        Email du client (optionnel - pour modifier)
                      </label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="Laisser vide pour utiliser l'email du dossier"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Send button */}
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                      <button
                        onClick={sendPvByEmail}
                        disabled={saving}
                        style={saving ? { ...primaryButtonStyle, opacity: 0.6, cursor: "not-allowed" } : primaryButtonStyle}
                      >
                        {saving ? (
                          <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Send size={16} />
                        )}
                        Envoyer le PV par email
                      </button>
                    </div>

                    {/* Alternative: QR code */}
                    <div style={{ marginTop: "16px", textAlign: "center" }}>
                      <button
                        onClick={startSignature}
                        disabled={saving}
                        style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}
                      >
                        <QrCode size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                        Ou utiliser un QR code (signature en personne)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      {!isSigned && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              ...secondaryButtonStyle,
              opacity: step === 0 ? 0.5 : 1,
              cursor: step === 0 ? "not-allowed" : "pointer",
              pointerEvents: step === 0 ? "none" : "auto",
            }}
          >
            <ChevronLeft size={18} />
            Précédent
          </button>
          <button
            type="button"
            onClick={async () => {
              if (step === 0 || step === 1) {
                await saveFormData();
              }
              setStep((s) => Math.min(3, s + 1));
            }}
            disabled={!canProceed || step === 3}
            style={{
              ...primaryButtonStyle,
              opacity: (!canProceed || step === 3) ? 0.5 : 1,
              cursor: (!canProceed || step === 3) ? "not-allowed" : "pointer",
              pointerEvents: (!canProceed || step === 3) ? "none" : "auto",
            }}
          >
            {saving ? (
              <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                Suivant
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      )}

      {/* QR Code Dialog */}
      {qrUrl && <QRCodeDialog url={qrUrl} onClose={() => setQrUrl(null)} />}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (min-width: 640px) {
          .step-label { display: inline !important; }
        }
      `}</style>
    </div>
  );
}
