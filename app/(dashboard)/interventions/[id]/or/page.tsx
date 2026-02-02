"use client";

/**
 * ORDRE DE REPARATION (OR) PAGE
 *
 * Professional repair order document with comprehensive details:
 * - Client and vehicle information
 * - Intervention details and description
 * - Work items from devis (if available)
 * - Signature section for client approval
 * - PDF generation
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  User,
  Car,
  Wrench,
  RefreshCw,
  AlertTriangle,
  Mail,
  Printer,
  FileSignature,
  Copy,
  ExternalLink,
  Edit,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

interface OrData {
  id: string;
  orNumber: string | null;
  interventionId: string;
  status: "draft" | "sent" | "signed";
  createdAt: string;
  sentAt: string | null;
  signedAt: string | null;
  intervention: {
    id: string;
    number: string;
    type: string;
    title: string | null;
    notes: string | null;
    status: string;
    performedAt: string | null;
    odometerKm: number | null;
    createdAt: string;
  };
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    vin: string | null;
    year: number | null;
    color: string | null;
    fuel: string | null;
  };
  items: OrItem[];
  totals: {
    subtotalExcl: number;
    totalVat: number;
    totalIncl: number;
  };
  signatureRequest?: {
    id: string;
    status: string;
    token: string;
    sentAt: string | null;
    signedAt: string | null;
  };
}

interface OrItem {
  id?: string;
  description: string;
  qty: number;
  unitPriceExcl: number;
  vatRate: number;
  lineTotalExcl?: number;
  lineTotalIncl?: number;
}

const DEFAULT_VAT_RATE = 0.2;

function fmtDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export default function OrdrReparationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const interventionId = params.id as string;
  const createMode = searchParams.get("create") === "true";

  const [orData, setOrData] = useState<OrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<OrItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Signature modal
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const loadOrData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if OR exists for this intervention
      const res = await fetch(`/api/interventions/${interventionId}/or`);
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 404 && createMode) {
          // OR doesn't exist, create it
          const createRes = await fetch(`/api/interventions/${interventionId}/or`, {
            method: "POST",
          });
          const createJson = await createRes.json();
          if (!createRes.ok) {
            throw new Error(createJson.error?.message || "Erreur lors de la création de l'OR");
          }
          setOrData(createJson.data);
          setEditItems(createJson.data.items || []);
          return;
        }
        throw new Error(json.error?.message || "Ordre de réparation introuvable");
      }

      setOrData(json.data);
      setEditItems(json.data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [interventionId, createMode]);

  useEffect(() => {
    void loadOrData();
  }, [loadOrData]);

  const handleCreateOr = async () => {
    try {
      setActionLoading("create");
      const res = await fetch(`/api/interventions/${interventionId}/or`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Erreur lors de la création");
      }
      setOrData(json.data);
      setEditItems(json.data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendForSignature = async () => {
    if (!orData) return;
    try {
      setActionLoading("send");
      const res = await fetch("/api/signatures/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: "INTERVENTION_ORDER", documentId: interventionId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (json.error?.code === "CLIENT_EMAIL_REQUIRED") {
          alert("L'email du client est requis pour envoyer une demande de signature.");
          return;
        }
        throw new Error(json.error?.message || "Erreur lors de l'envoi");
      }
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${baseUrl}/sign/${json.data.token}`;
      setSignatureUrl(url);
      setShowSignatureModal(true);
      await loadOrData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!orData) return;
    try {
      setActionLoading("pdf");
      const res = await fetch(`/api/interventions/${interventionId}/or/pdf`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Erreur lors de la génération du PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `OR-${orData.orNumber || interventionId.slice(0, 8)}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur PDF");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    if (!signatureUrl) return;
    try {
      await navigator.clipboard.writeText(signatureUrl);
      alert("Lien copié !");
    } catch {
      alert("Impossible de copier le lien");
    }
  };

  // Edit handlers
  const handleItemChange = (idx: number, field: keyof OrItem, value: string | number) => {
    setEditItems((prev) => {
      const updated = [...prev];
      if (field === "description") updated[idx] = { ...updated[idx], description: String(value) };
      else if (field === "qty") updated[idx] = { ...updated[idx], qty: Number(value) || 1 };
      else if (field === "unitPriceExcl") updated[idx] = { ...updated[idx], unitPriceExcl: Number(value) || 0 };
      else if (field === "vatRate") updated[idx] = { ...updated[idx], vatRate: Number(value) || 0 };
      return updated;
    });
  };

  const handleAddItem = () => {
    setEditItems((prev) => [...prev, { description: "", qty: 1, unitPriceExcl: 0, vatRate: DEFAULT_VAT_RATE }]);
  };

  const handleRemoveItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveItems = async () => {
    const validItems = editItems.filter((item) => item.description.trim());
    if (!validItems.length) {
      alert("Au moins une ligne est requise");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/interventions/${interventionId}/or`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur");
      }
      setIsEditing(false);
      await loadOrData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (orData) setEditItems(orData.items || []);
    setIsEditing(false);
  };

  // Calculate totals for preview
  const previewTotals = editItems.reduce(
    (acc, item) => {
      const excl = item.qty * item.unitPriceExcl;
      const vat = excl * item.vatRate;
      return {
        subtotalExcl: acc.subtotalExcl + excl,
        totalVat: acc.totalVat + vat,
        totalIncl: acc.totalIncl + excl + vat,
      };
    },
    { subtotalExcl: 0, totalVat: 0, totalIncl: 0 }
  );

  const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

  // Styles
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
  };

  const buttonPrimary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    fontSize: "14px",
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  };

  const buttonSecondary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#fff",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    fontSize: "14px",
    outline: "none",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center" }}>
        <style>{spinKeyframes}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto",
              borderRadius: "50%",
              border: "4px solid #E0E7FF",
              borderTopColor: "#6366F1",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ marginTop: "16px", color: "#6B7280", fontSize: "14px" }}>Chargement de l&apos;OR...</p>
        </div>
      </div>
    );
  }

  // No OR exists - show create option
  if (error && error.includes("introuvable")) {
    return (
      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        <Link
          href={`/interventions/${interventionId}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}
        >
          <ArrowLeft size={16} />
          Retour à l&apos;intervention
        </Link>

        <div style={{ ...cardStyle, textAlign: "center", padding: "48px 24px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 24px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wrench size={40} color="#F59E0B" />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
            Aucun Ordre de Réparation
          </h2>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
            L&apos;ordre de réparation n&apos;a pas encore été créé pour cette intervention. Cliquez ci-dessous pour le générer.
          </p>
          <button
            onClick={handleCreateOr}
            disabled={actionLoading === "create"}
            style={{ ...buttonPrimary, opacity: actionLoading === "create" ? 0.7 : 1 }}
          >
            {actionLoading === "create" ? (
              <>
                <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                Création en cours...
              </>
            ) : (
              <>
                <FileText size={18} />
                Créer l&apos;Ordre de Réparation
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        <Link
          href={`/interventions/${interventionId}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
        <div style={{ padding: "48px", borderRadius: "16px", background: "#FEF2F2", border: "1px solid #FECACA", textAlign: "center" }}>
          <AlertTriangle size={48} style={{ margin: "0 auto", color: "#EF4444" }} />
          <p style={{ marginTop: "16px", color: "#DC2626", fontSize: "16px" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!orData) return null;

  const canEdit = orData.status === "draft";
  const statusConfig = {
    draft: { label: "Brouillon", color: "#6B7280", bg: "#F3F4F6" },
    sent: { label: "Envoyé", color: "#3B82F6", bg: "#DBEAFE" },
    signed: { label: "Signé", color: "#10B981", bg: "#D1FAE5" },
  };
  const status = statusConfig[orData.status] || statusConfig.draft;

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <style>{spinKeyframes}</style>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* Header */}
      <div className="no-print" style={{ marginBottom: "24px" }}>
        <Link
          href={`/interventions/${interventionId}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "16px" }}
        >
          <ArrowLeft size={16} />
          Retour à l&apos;intervention
        </Link>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>
                Ordre de Réparation
              </h1>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: "100px",
                  background: status.bg,
                  color: status.color,
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {status.label}
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: "8px 0 0" }}>
              {orData.orNumber || `OR-${interventionId.slice(0, 8)}`} • Créé le {fmtDate(orData.createdAt)}
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button onClick={() => void loadOrData()} disabled={!!actionLoading} style={{ ...buttonSecondary, opacity: actionLoading ? 0.6 : 1 }}>
              <RefreshCw size={16} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
              Actualiser
            </button>
            <button onClick={handlePrint} style={buttonSecondary}>
              <Printer size={16} />
              Imprimer
            </button>
            <button onClick={handleDownloadPdf} disabled={!!actionLoading} style={{ ...buttonSecondary, opacity: actionLoading === "pdf" ? 0.6 : 1 }}>
              <Download size={16} />
              PDF
            </button>
            {orData.status !== "signed" && (
              <button
                onClick={handleSendForSignature}
                disabled={!!actionLoading}
                style={{ ...buttonPrimary, opacity: actionLoading === "send" ? 0.6 : 1 }}
              >
                {actionLoading === "send" ? (
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <FileSignature size={16} />
                )}
                {orData.status === "sent" ? "Renvoyer pour signature" : "Envoyer pour signature"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && signatureUrl && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowSignatureModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "20px", padding: "32px", maxWidth: "500px", width: "90%", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={28} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>Demande envoyée !</h2>
                <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0" }}>Le client a reçu un email avec le lien</p>
              </div>
            </div>

            <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6B7280", marginBottom: "8px", textTransform: "uppercase" }}>
                Lien de signature
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  readOnly
                  value={signatureUrl}
                  style={{ flex: 1, padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "13px", color: "#374151" }}
                />
                <button
                  onClick={handleCopyLink}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", color: "#fff", fontWeight: 500, cursor: "pointer" }}
                >
                  <Copy size={16} />
                  Copier
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => window.open(signatureUrl, "_blank")}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 500, cursor: "pointer" }}
              >
                <ExternalLink size={16} />
                Voir la page
              </button>
              <button
                onClick={() => setShowSignatureModal(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OR Document */}
      <div ref={printRef}>
        {/* Header Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            borderRadius: "16px 16px 0 0",
            padding: "24px 28px",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>ORDRE DE RÉPARATION</h2>
              <p style={{ fontSize: "14px", opacity: 0.9, margin: "4px 0 0" }}>
                N° {orData.orNumber || `OR-${interventionId.slice(0, 8)}`}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "14px", opacity: 0.8, margin: 0 }}>Date</p>
              <p style={{ fontSize: "16px", fontWeight: 600, margin: "4px 0 0" }}>{fmtDate(orData.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ ...cardStyle, borderRadius: "0 0 16px 16px", borderTop: "none" }}>
          {/* Client & Vehicle Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "24px", borderBottom: "1px solid #E5E7EB" }}>
            {/* Client */}
            <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <User size={18} color="#6366F1" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Client</span>
              </div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
                {orData.client.firstName} {orData.client.lastName}
              </p>
              {orData.client.email && (
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={14} /> {orData.client.email}
                </p>
              )}
              {orData.client.phone && (
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0" }}>{orData.client.phone}</p>
              )}
              {orData.client.address && (
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "8px 0 0" }}>
                  {orData.client.address}
                  {orData.client.postalCode && orData.client.city && (
                    <><br />{orData.client.postalCode} {orData.client.city}</>
                  )}
                </p>
              )}
            </div>

            {/* Vehicle */}
            <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Car size={18} color="#F59E0B" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Véhicule</span>
              </div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
                {orData.vehicle.brand} {orData.vehicle.model}
              </p>
              <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "8px", background: "#E5E7EB", fontFamily: "monospace", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                {orData.vehicle.plate}
              </div>
              <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px", color: "#6B7280" }}>
                {orData.vehicle.vin && (
                  <div>
                    <span style={{ color: "#9CA3AF" }}>VIN:</span> {orData.vehicle.vin}
                  </div>
                )}
                {orData.vehicle.year && (
                  <div>
                    <span style={{ color: "#9CA3AF" }}>Année:</span> {orData.vehicle.year}
                  </div>
                )}
                {orData.vehicle.fuel && (
                  <div>
                    <span style={{ color: "#9CA3AF" }}>Carburant:</span> {orData.vehicle.fuel}
                  </div>
                )}
                {orData.vehicle.color && (
                  <div>
                    <span style={{ color: "#9CA3AF" }}>Couleur:</span> {orData.vehicle.color}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Intervention Info */}
          <div style={{ padding: "24px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Wrench size={18} color="#10B981" />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Intervention</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px" }}>Type</p>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>{orData.intervention.type}</p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px" }}>Date prévue</p>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>
                  {fmtDate(orData.intervention.performedAt || orData.intervention.createdAt)}
                </p>
              </div>
              {orData.intervention.odometerKm && (
                <div>
                  <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px" }}>Kilométrage</p>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>
                    {orData.intervention.odometerKm.toLocaleString("fr-FR")} km
                  </p>
                </div>
              )}
            </div>
            {(orData.intervention.title || orData.intervention.notes) && (
              <div style={{ marginTop: "16px", padding: "14px", borderRadius: "10px", background: "#FEF3C7" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#92400E", margin: "0 0 8px" }}>Description des travaux</p>
                <p style={{ fontSize: "14px", color: "#78350F", margin: 0, lineHeight: 1.5 }}>
                  {orData.intervention.title || orData.intervention.notes}
                </p>
              </div>
            )}
          </div>

          {/* Work Items */}
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={18} color="#6366F1" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Travaux à effectuer</span>
              </div>
              {canEdit && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="no-print" style={buttonSecondary}>
                  <Edit size={16} />
                  Modifier
                </button>
              )}
              {isEditing && (
                <div className="no-print" style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleCancelEdit} disabled={saving} style={buttonSecondary}>
                    Annuler
                  </button>
                  <button onClick={handleSaveItems} disabled={saving} style={{ ...buttonPrimary, opacity: saving ? 0.6 : 1 }}>
                    {saving ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                    Enregistrer
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="no-print">
                {editItems.map((item, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 80px 100px 80px 50px", gap: "12px", marginBottom: "12px", alignItems: "end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Description</label>
                      <input type="text" value={item.description} onChange={(e) => handleItemChange(idx, "description", e.target.value)} placeholder="Description..." style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Qté</label>
                      <input type="number" min="1" value={item.qty} onChange={(e) => handleItemChange(idx, "qty", e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Prix HT</label>
                      <input type="number" min="0" step="0.01" value={item.unitPriceExcl} onChange={(e) => handleItemChange(idx, "unitPriceExcl", e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>TVA</label>
                      <select value={item.vatRate} onChange={(e) => handleItemChange(idx, "vatRate", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                        <option value="0">0%</option>
                        <option value="0.055">5.5%</option>
                        <option value="0.1">10%</option>
                        <option value="0.2">20%</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "2px" }}>
                      <button onClick={() => handleRemoveItem(idx)} disabled={editItems.length <= 1} style={{ width: "40px", height: "40px", borderRadius: "10px", border: "none", background: "transparent", color: editItems.length <= 1 ? "#D1D5DB" : "#EF4444", cursor: editItems.length <= 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={handleAddItem} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "12px 20px", borderRadius: "12px", border: "2px dashed #E5E7EB", background: "transparent", color: "#6B7280", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                  <Plus size={16} />
                  Ajouter une ligne
                </button>
              </div>
            ) : (
              <div>
                {/* Table Header */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 100px 100px", gap: "12px", padding: "12px 16px", background: "#F9FAFB", borderRadius: "10px 10px 0 0", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>
                  <div>Description</div>
                  <div style={{ textAlign: "center" }}>Qté</div>
                  <div style={{ textAlign: "right" }}>Prix HT</div>
                  <div style={{ textAlign: "right" }}>Total TTC</div>
                </div>
                {/* Table Body */}
                {(orData.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 80px 100px 100px",
                      gap: "12px",
                      padding: "16px",
                      borderBottom: idx < orData.items.length - 1 ? "1px solid #F3F4F6" : "none",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: "14px", color: "#111827" }}>{item.description}</div>
                    <div style={{ textAlign: "center", fontSize: "14px", color: "#6B7280" }}>{item.qty}</div>
                    <div style={{ textAlign: "right", fontSize: "14px", color: "#6B7280" }}>{fmtCurrency(item.unitPriceExcl)}</div>
                    <div style={{ textAlign: "right", fontSize: "14px", fontWeight: 600, color: "#111827" }}>{fmtCurrency(item.lineTotalIncl || 0)}</div>
                  </div>
                ))}
                {(orData.items || []).length === 0 && (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "#9CA3AF" }}>
                    <FileText size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>Aucun travail défini</p>
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div style={{ marginTop: "20px", padding: "16px 20px", background: "#F9FAFB", borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6B7280" }}>
                <span>Total HT</span>
                <span style={{ fontWeight: 500 }}>{fmtCurrency(isEditing ? previewTotals.subtotalExcl : orData.totals.subtotalExcl)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
                <span>TVA</span>
                <span style={{ fontWeight: 500 }}>{fmtCurrency(isEditing ? previewTotals.totalVat : orData.totals.totalVat)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Total TTC</span>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>{fmtCurrency(isEditing ? previewTotals.totalIncl : orData.totals.totalIncl)}</span>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div style={{ padding: "24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", margin: "0 0 16px" }}>Accord du client</p>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 20px", lineHeight: 1.5 }}>
              Je soussigné(e), {orData.client.firstName} {orData.client.lastName}, propriétaire du véhicule immatriculé{" "}
              <strong>{orData.vehicle.plate}</strong>, autorise l&apos;atelier à effectuer les travaux décrits ci-dessus.
              Je m&apos;engage à régler le montant total de <strong>{fmtCurrency(orData.totals.totalIncl)}</strong> TTC à la restitution du véhicule.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 8px" }}>Date</p>
                <div style={{ height: "40px", borderBottom: "1px solid #D1D5DB" }}>
                  {orData.signatureRequest?.signedAt && (
                    <p style={{ fontSize: "14px", color: "#111827", margin: 0 }}>{fmtDate(orData.signatureRequest.signedAt)}</p>
                  )}
                </div>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 8px" }}>Signature du client</p>
                <div style={{ height: "60px", borderRadius: "8px", border: "1px dashed #D1D5DB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {orData.status === "signed" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10B981" }}>
                      <CheckCircle size={20} />
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>Signé électroniquement</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "13px", color: "#9CA3AF" }}>En attente de signature</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
