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
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  AlertTriangle,
  Mail,
  RefreshCw,
  Trash2,
  Car,
  PenTool,
  Loader2,
  Send,
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
    client: { firstName: string; lastName: string; email?: string | null };
  };
  odometerKm: number | null;
};

// Warning items for intake checklist
const WARNING_ITEMS = [
  { key: "engineLight", label: "Voyant moteur" },
  { key: "oilLight", label: "Voyant huile" },
  { key: "batteryLight", label: "Voyant batterie" },
  { key: "brakeLight", label: "Voyant freins" },
  { key: "absLight", label: "Voyant ABS" },
  { key: "airbagLight", label: "Voyant airbag" },
  { key: "tireLight", label: "Voyant pression pneus" },
  { key: "tempLight", label: "Voyant température" },
  { key: "noises", label: "Bruits anormaux" },
  { key: "leaks", label: "Fuites visibles" },
  { key: "bodyDamage", label: "Dégâts carrosserie" },
  { key: "scratches", label: "Rayures visibles" },
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

// Step labels
const STEP_LABELS = ["Kilométrage", "Voyants", "Photos", "Signature"];

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

  // Form state - Step 4 (Email signature)
  const [clientEmail, setClientEmail] = useState<string>("");
  const [signatureStatus, setSignatureStatus] = useState<"pending" | "sent" | "signed">("pending");
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

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
      // Pre-fill client email if available
      if (intData.data?.vehicle?.client?.email) {
        setClientEmail(intData.data.vehicle.client.email);
      }

      // Get or create session - always POST to ensure we have a valid session
      const createRes = await fetch(`/api/interventions/${interventionId}/evidence-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "INTAKE" }),
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
    if (!file || !session || !activePhotoKey) {
      console.log("Upload cancelled - missing:", { file: !!file, session: !!session, activePhotoKey });
      return;
    }

    const currentPhotoKey = activePhotoKey;
    setUploading(currentPhotoKey);

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

      const category = `INTAKE_${currentPhotoKey}`;
      const label = REQUIRED_PHOTOS.find((p) => p.key === currentPhotoKey)?.label || currentPhotoKey;

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
        const errData = await res.json().catch(() => ({}));
        console.error("API Error:", res.status, errData);
        throw new Error(errData?.error?.message ?? errData?.message ?? `Erreur upload (${res.status})`);
      }

      await fetchData(); // Refresh to get updated photos
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

  // Start signature flow - Send email to client
  const startSignature = async () => {
    if (!session) return;
    if (!clientEmail || !clientEmail.includes("@")) {
      alert("Email client requis et doit être valide");
      return;
    }
    setSaving(true);
    try {
      // First, save form data if not saved
      await saveFormData();

      // Send email to client for signature
      const res = await fetch(`/api/interventions/${interventionId}/intake-pv/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          clientEmail: clientEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? "Erreur envoi email");
      }

      setEmailSentTo(clientEmail);
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
  const step3Valid = true; // Photos are now optional but recommended
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px",
    fontSize: "24px",
    fontWeight: 700,
    textAlign: "center",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "100px",
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

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Réception véhicule</h1>
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
            <p style={{ fontWeight: 700, color: "#047857", margin: 0 }}>État d&apos;entrée signé</p>
            <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Le formulaire est verrouillé et les preuves sont scellées.</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <div style={cardStyle}>
        {/* Step 1: Odometer & Fuel */}
        {step === 0 && (
          <>
            <div style={cardHeaderStyle}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge size={24} style={{ color: "#2563eb" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Kilométrage & carburant</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Enregistrez le kilométrage et le niveau de carburant</p>
              </div>
            </div>
            <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
                  Kilométrage (km) *
                </label>
                <input
                  type="number"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  style={inputStyle}
                  placeholder="125000"
                  disabled={isSigned}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#374151" }}>
                  Niveau de carburant
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                  {FUEL_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFuelLevel(level.value)}
                      disabled={isSigned}
                      style={{
                        padding: "16px 8px",
                        borderRadius: "12px",
                        fontWeight: 600,
                        fontSize: "14px",
                        border: fuelLevel === level.value ? `3px solid ${level.color}` : "2px solid transparent",
                        background: `${level.color}20`,
                        color: level.color,
                        cursor: isSigned ? "not-allowed" : "pointer",
                        opacity: fuelLevel === level.value ? 1 : 0.6,
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Fuel size={24} />
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
            <div style={cardHeaderStyle}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={24} style={{ color: "#b45309" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Voyants & symptômes</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Cochez les anomalies constatées à l&apos;entrée</p>
              </div>
            </div>
            <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
                {WARNING_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setWarnings((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    disabled={isSigned}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: isSigned ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      ...(warnings[item.key]
                        ? { background: "#fef3c7", border: "2px solid #f59e0b", color: "#b45309" }
                        : { background: "#f9fafb", border: "2px solid transparent", color: "#6b7280" }),
                    }}
                  >
                    <AlertTriangle size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
                  Notes supplémentaires
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  style={textareaStyle}
                  placeholder="Autres observations..."
                  disabled={isSigned}
                />
              </div>
              {Object.values(warnings).filter(Boolean).length > 0 && (
                <div style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", background: "#fef3c7", color: "#b45309", borderRadius: "20px", fontSize: "13px", fontWeight: 600, alignSelf: "flex-start" }}>
                  {Object.values(warnings).filter(Boolean).length} anomalie(s) signalée(s)
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
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Photos du véhicule</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                  {photosUploaded}/6 photos — Très conseillées pour preuve
                </p>
              </div>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" }}>
                {REQUIRED_PHOTOS.map((photo) => {
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
                            <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: "#10b981", color: "#ffffff", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                                <Check size={12} />
                                OK
                              </span>
                            </div>
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
                              <span style={{ fontSize: "11px", color: "#9ca3af" }}>{photo.description}</span>
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
              {photosUploaded < 6 && (
                <div style={{ marginTop: "20px", padding: "16px 20px", borderRadius: "12px", background: "#fffbeb", border: "1px solid #fcd34d" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <AlertTriangle size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <p style={{ fontWeight: 600, color: "#92400e", margin: 0 }}>Photos fortement recommandées</p>
                      <p style={{ fontSize: "13px", color: "#b45309", marginTop: "6px" }}>
                        {photosUploaded === 0
                          ? "Sans photos, vous n'aurez aucune preuve visuelle de l'état d'entrée du véhicule en cas de litige avec le client ou l'assurance."
                          : `${6 - photosUploaded} photo(s) manquante(s). Plus vous documentez l'état du véhicule, mieux vous êtes protégé en cas de contestation.`
                        }
                      </p>
                      <p style={{ fontSize: "12px", color: "#d97706", marginTop: "8px" }}>
                        Les assurances exigent souvent des preuves photographiques pour traiter les réclamations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 4: Signature by Email */}
        {step === 3 && (
          <>
            <div style={cardHeaderStyle}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PenTool size={24} style={{ color: "#16a34a" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Signature état d&apos;entrée</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Le client recevra un email pour signer le PV de réception</p>
              </div>
            </div>
            <div style={cardBodyStyle}>
              {signatureStatus === "signed" || isSigned ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <CheckCircle2 size={64} style={{ color: "#10b981", margin: "0 auto 16px" }} />
                  <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#10b981", margin: 0 }}>Signé avec succès !</h4>
                  <p style={{ color: "#6b7280", marginTop: "8px" }}>
                    L&apos;état d&apos;entrée est maintenant verrouillé et horodaté.
                  </p>
                  <div style={{ marginTop: "24px" }}>
                    <button
                      onClick={() => router.push(`/interventions/${interventionId}`)}
                      style={primaryButtonStyle}
                    >
                      <Check size={16} />
                      Retour au dossier
                    </button>
                  </div>
                </div>
              ) : signatureStatus === "sent" ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <Mail size={64} style={{ color: "#10b981", margin: "0 auto 16px" }} />
                  <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#10b981", margin: 0 }}>Email envoyé !</h4>
                  <p style={{ color: "#6b7280", marginTop: "8px" }}>
                    Un email a été envoyé à <strong>{emailSentTo}</strong> avec le lien de signature.
                  </p>
                  <div style={{ marginTop: "20px", padding: "16px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                    <p style={{ fontSize: "14px", color: "#166534", margin: 0 }}>
                      Le client peut consulter le PV de réception et le signer depuis son téléphone ou ordinateur.
                    </p>
                  </div>
                  <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => router.push(`/interventions/${interventionId}`)}
                      style={primaryButtonStyle}
                    >
                      <Check size={16} />
                      Retour au dossier
                    </button>
                    <button
                      onClick={() => {
                        setSignatureStatus("pending");
                        setEmailSentTo(null);
                      }}
                      style={secondaryButtonStyle}
                    >
                      <Send size={16} />
                      Renvoyer l&apos;email
                    </button>
                  </div>
                  <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                    <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                    Vérification automatique de la signature...
                  </div>
                </div>
              ) : (
                <div style={{ padding: "32px 0" }}>
                  {/* Récapitulatif */}
                  <div style={{ textAlign: "center" }}>
                    <Car size={48} style={{ color: "#9ca3af", margin: "0 auto 16px" }} />
                    <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Récapitulatif</h4>
                  </div>
                  <div style={{ marginTop: "16px", maxWidth: "400px", margin: "16px auto 0", background: "#f9fafb", borderRadius: "12px", padding: "16px", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ color: "#6b7280" }}>Kilométrage</span>
                      <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{odometerKm} km</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ color: "#6b7280" }}>Carburant</span>
                      <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{FUEL_LEVELS.find((f) => f.value === fuelLevel)?.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ color: "#6b7280" }}>Anomalies</span>
                      <span style={{ fontWeight: 600, color: Object.values(warnings).filter(Boolean).length > 0 ? "#d97706" : "#1a1a2e" }}>
                        {Object.values(warnings).filter(Boolean).length || "Aucune"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                      <span style={{ color: "#6b7280" }}>Photos</span>
                      <span style={{ fontWeight: 600, color: photosUploaded < 3 ? "#f59e0b" : "#1a1a2e" }}>
                        {photosUploaded}/6 {photosUploaded < 3 && "(conseillé: min. 3)"}
                      </span>
                    </div>
                  </div>

                  {photosUploaded < 3 && (
                    <div style={{ marginTop: "16px", maxWidth: "400px", margin: "16px auto 0", padding: "16px", borderRadius: "12px", background: "#fffbeb", border: "1px solid #fcd34d", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <AlertTriangle size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <p style={{ fontWeight: 600, color: "#92400e", margin: 0 }}>
                            {photosUploaded === 0 ? "Aucune photo ajoutée" : `Seulement ${photosUploaded} photo(s)`}
                          </p>
                          <p style={{ fontSize: "13px", color: "#b45309", marginTop: "6px" }}>
                            {photosUploaded === 0
                              ? "Sans photos, vous n'aurez pas de preuve visuelle en cas de litige."
                              : "Nous recommandons au moins 3 photos pour documenter l'état du véhicule."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email input */}
                  <div style={{ marginTop: "24px", maxWidth: "400px", margin: "24px auto 0" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
                      <Mail size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
                      Email du client *
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        fontSize: "15px",
                        border: "2px solid #e5e7eb",
                        borderRadius: "12px",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      placeholder="client@email.com"
                      disabled={isSigned}
                    />
                    <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                      Le client recevra un email avec le PV de réception et un lien pour signer électroniquement.
                    </p>
                  </div>

                  {/* Send button */}
                  <div style={{ marginTop: "24px", textAlign: "center" }}>
                    <button
                      onClick={startSignature}
                      disabled={saving || !clientEmail || !clientEmail.includes("@")}
                      style={{
                        ...primaryButtonStyle,
                        opacity: (saving || !clientEmail || !clientEmail.includes("@")) ? 0.5 : 1,
                        cursor: (saving || !clientEmail || !clientEmail.includes("@")) ? "not-allowed" : "pointer",
                      }}
                    >
                      {saving ? (
                        <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Send size={16} />
                      )}
                      Envoyer le PV par email
                    </button>
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
              if (step === 1) {
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
