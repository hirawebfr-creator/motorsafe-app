"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Gauge,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  FileSignature,
  Car,
  Trash2,
  Download,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  Image as ImageIcon,
  ExternalLink,
  User,
  Wrench,
} from "lucide-react";
import { DossierProgress, buildDossierSteps } from "@/components/interventions/DossierProgress";
import { NextStepCard, getNextStep } from "@/components/interventions/NextStepCard";

// ============================================================================
// INTERVENTION DETAIL PAGE - SafeMotor Inline Styles
// ============================================================================

type InterventionStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "ANNULE";

interface Intervention {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  vehicleId: string;
  vehicleInfo: string;
  vehicleRegistration: string;
  entryDate: Date;
  exitDate?: Date;
  status: InterventionStatus;
  apiStatus: "DRAFT" | "OPEN" | "DONE" | "CANCELED";
  type: string;
  description: string;
  diagnosticNotes?: string;
  mileage: number;
  laborCost?: number;
  partsCost?: number;
  totalAmount?: number;
  isClientSigned: boolean;
  isGarageSigned: boolean;
  clientSignedAt?: Date;
  garageSignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Progress tracking
  intakeCompletedAt?: Date;
  deliveryCompletedAt?: Date;
  // Devis and OR status
  devisStatus?: "none" | "draft" | "sent" | "signed";
  orStatus?: "none" | "draft" | "sent" | "signed";
  quotes?: { id: string; quoteNumber: string | null; status: string; signatureStatus: string | null; totalIncl: number; createdAt: Date }[];
}

interface TimelineEvent {
  id: string;
  type: "status_change" | "signature" | "document" | "note";
  title: string;
  description?: string;
  user: string;
  timestamp: Date;
}

const STATUS_CONFIG: Record<
  InterventionStatus,
  { label: string; color: string; bgColor: string; icon: typeof Clock }
> = {
  EN_ATTENTE: { label: "En attente", color: "#F59E0B", bgColor: "#FEF3C7", icon: Clock },
  EN_COURS: { label: "En cours", color: "#3B82F6", bgColor: "#DBEAFE", icon: PlayCircle },
  TERMINE: { label: "Terminée", color: "#10B981", bgColor: "#D1FAE5", icon: CheckCircle },
  ANNULE: { label: "Annulée", color: "#EF4444", bgColor: "#FEE2E2", icon: XCircle },
};

// Responsive hook
function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen };
}

export default function InterventionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const interventionId = params.id as string;
  const { isMobile, isTablet } = useResponsive();

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<InterventionStatus>("EN_ATTENTE");
  const [statusComment, setStatusComment] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadInterventionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionId]);

  const mapApiStatus = (apiStatus: string): InterventionStatus => {
    const mapping: Record<string, InterventionStatus> = {
      DRAFT: "EN_ATTENTE",
      OPEN: "EN_COURS",
      DONE: "TERMINE",
      CANCELED: "ANNULE",
    };
    return mapping[apiStatus] || "EN_ATTENTE";
  };

  const mapStatusToApi = (status: InterventionStatus): string => {
    const mapping: Record<InterventionStatus, string> = {
      EN_ATTENTE: "DRAFT",
      EN_COURS: "OPEN",
      TERMINE: "DONE",
      ANNULE: "CANCELED",
    };
    return mapping[status];
  };

  const loadInterventionData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/interventions/${interventionId}`);
      const data = await res.json();

      if (data.ok && data.data) {
        const itv = data.data;
        const mapped: Intervention = {
          id: itv.id,
          number: itv.number || `INT-${String(itv.id).slice(0, 8)}`,
          clientId: itv.vehicle?.client?.id?.toString() || "",
          clientName: itv.vehicle?.client
            ? `${itv.vehicle.client.firstName} ${itv.vehicle.client.lastName}`
            : "Client inconnu",
          clientEmail: itv.vehicle?.client?.email || "",
          clientPhone: itv.vehicle?.client?.phone || "",
          vehicleId: itv.vehicleId || "",
          vehicleInfo: itv.vehicle ? `${itv.vehicle.brand} ${itv.vehicle.model}` : "Véhicule inconnu",
          vehicleRegistration: itv.vehicle?.plate || "",
          entryDate: new Date(itv.performedAt || itv.createdAt),
          exitDate: itv.closedAt ? new Date(itv.closedAt) : undefined,
          status: mapApiStatus(itv.status),
          apiStatus: itv.status as "DRAFT" | "OPEN" | "DONE" | "CANCELED",
          type: itv.type || "Intervention",
          description: itv.title || itv.notes || "Aucune description",
          diagnosticNotes: itv.notes,
          mileage: itv.odometerKm || 0,
          totalAmount: itv.amountCents ? itv.amountCents / 100 : undefined,
          isClientSigned: !!itv.agreementAt || !!itv.clientSignedAt,
          isGarageSigned: !!itv.closedAt || !!itv.garageSignedAt,
          clientSignedAt: itv.agreementAt ? new Date(itv.agreementAt) : undefined,
          garageSignedAt: itv.closedAt ? new Date(itv.closedAt) : undefined,
          createdAt: new Date(itv.createdAt),
          updatedAt: new Date(itv.updatedAt),
          // Progress tracking
          intakeCompletedAt: itv.intakeCompletedAt ? new Date(itv.intakeCompletedAt) : undefined,
          deliveryCompletedAt: itv.deliveryCompletedAt ? new Date(itv.deliveryCompletedAt) : undefined,
          // Devis and OR status
          devisStatus: itv.devisStatus || "none",
          orStatus: itv.orStatus || "none",
          quotes: itv.quotes || [],
        };

        setIntervention(mapped);

        // Build timeline
        const events: TimelineEvent[] = [
          {
            id: "1",
            type: "status_change",
            title: "Intervention créée",
            description: `Statut initial : ${STATUS_CONFIG.EN_ATTENTE.label}`,
            user: "Système",
            timestamp: mapped.createdAt,
          },
        ];

        if (mapped.status !== "EN_ATTENTE") {
          events.push({
            id: "2",
            type: "status_change",
            title: "Intervention démarrée",
            description: `Statut : ${STATUS_CONFIG.EN_COURS.label}`,
            user: "Atelier",
            timestamp: mapped.updatedAt,
          });
        }

        if (mapped.isClientSigned) {
          events.push({
            id: "3",
            type: "signature",
            title: "Signature client",
            description: "Le client a signé le bon d'intervention",
            user: mapped.clientName,
            timestamp: mapped.clientSignedAt || new Date(),
          });
        }

        if (mapped.isGarageSigned) {
          events.push({
            id: "4",
            type: "signature",
            title: "Signature atelier",
            description: "L'atelier a validé les travaux",
            user: "Atelier",
            timestamp: mapped.garageSignedAt || new Date(),
          });
        }

        if (mapped.status === "TERMINE") {
          events.push({
            id: "5",
            type: "status_change",
            title: "Intervention terminée",
            description: "Les travaux sont finalisés",
            user: "Atelier",
            timestamp: mapped.exitDate || mapped.updatedAt,
          });
        }

        setTimeline(events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } else {
        router.push("/interventions");
      }
    } catch (error) {
      console.error("Error loading intervention:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!intervention) return;
    setIsChangingStatus(true);
    try {
      const res = await fetch(`/api/interventions/${intervention.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: mapStatusToApi(newStatus), notes: statusComment || undefined }),
      });

      if (res.ok) {
        setStatusModalOpen(false);
        loadInterventionData();
      }
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!intervention) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/interventions/${intervention.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/interventions");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  };

  const canChangeStatus = intervention && intervention.status !== "TERMINE" && intervention.status !== "ANNULE";

  // Styles
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: isMobile ? "16px" : "20px 24px",
    borderBottom: "1px solid #F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: isMobile ? "16px" : "24px",
  };

  const buttonPrimary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: isMobile ? "10px 16px" : "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    fontSize: "14px",
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    width: isMobile ? "100%" : "auto",
  };

  const buttonSecondary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#fff",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    cursor: "pointer",
    width: isMobile ? "100%" : "auto",
  };

  const buttonDanger: React.CSSProperties = {
    ...buttonSecondary,
    border: "1px solid rgba(239, 68, 68, 0.2)",
    background: "rgba(239, 68, 68, 0.05)",
    color: "#DC2626",
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", padding: "32px" }}>
        <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "#6B7280" }}>Intervention introuvable</p>
        <Link href="/interventions" style={{ color: "#6366F1" }}>
          Retour aux interventions
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[intervention.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? "24px" : "32px" }}>
        <Link
          href="/interventions"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "16px" }}
        >
          <ArrowLeft size={16} />
          Retour aux interventions
        </Link>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "#111827", margin: 0, fontFamily: "monospace" }}>
                {intervention.number}
              </h1>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "100px",
                  background: statusConfig.bgColor,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: statusConfig.color,
                }}
              >
                <StatusIcon size={16} />
                {statusConfig.label}
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
              Créée le {formatDate(intervention.createdAt)} • {intervention.type}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
            <Link href={`/interventions/${intervention.id}/reception`} style={{ textDecoration: "none" }}>
              <button style={buttonSecondary}>
                <FileSignature size={16} />
                PV Réception
              </button>
            </Link>
            <Link href={`/interventions/${intervention.id}/tech`} style={{ textDecoration: "none" }}>
              <button style={buttonSecondary}>
                <FileText size={16} />
                Fiche technique
              </button>
            </Link>
            {canChangeStatus && (
              <button
                onClick={() => {
                  setNewStatus(intervention.status === "EN_ATTENTE" ? "EN_COURS" : "TERMINE");
                  setStatusComment("");
                  setStatusModalOpen(true);
                }}
                style={buttonPrimary}
              >
                Changer statut
              </button>
            )}
          </div>
        </div>
      </div>

      {/* UX-IMPROVEMENT-01: Barre de progression du dossier */}
      <div style={{ ...cardStyle, marginBottom: "24px", padding: isMobile ? "16px" : "20px 24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "0 0 4px 0" }}>
            Progression du dossier
          </h3>
          <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>
            Suivez l&apos;avancement de cette intervention
          </p>
        </div>
        <DossierProgress
          steps={buildDossierSteps({
            pvReceptionDone: !!intervention.intakeCompletedAt,
            devisStatus: intervention.devisStatus || "none",
            orStatus: intervention.orStatus || "none",
            interventionStatus: intervention.apiStatus,
            pvRestitutionDone: !!intervention.deliveryCompletedAt,
            factureStatus: "none", // TODO: fetch from invoice relation
          })}
          compact={isMobile}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 400px", gap: "24px" }}>
        {/* Colonne principale */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* UX-IMPROVEMENT-01: Carte prochaine etape */}
          <NextStepCard
            interventionId={intervention.id}
            nextStep={getNextStep({
              interventionId: intervention.id,
              pvReceptionDone: !!intervention.intakeCompletedAt,
              hasDevis: (intervention.quotes?.length || 0) > 0,
              devisSigned: intervention.devisStatus === "signed",
              hasOr: intervention.orStatus !== "none",
              orSigned: intervention.orStatus === "signed",
              interventionStatus: intervention.apiStatus,
              pvRestitutionDone: !!intervention.deliveryCompletedAt,
              hasFacture: false, // TODO: fetch from invoice relation
              facturePaid: false,
            })}
          />

          {/* Informations intervention */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wrench size={20} color="#6366F1" />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Informations</h2>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Détails de l&apos;intervention</p>
                </div>
              </div>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Date d&apos;entrée</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={16} color="#9CA3AF" />
                    <span style={{ fontSize: "14px", color: "#111827" }}>{formatDate(intervention.entryDate)}</span>
                  </div>
                </div>
                {intervention.exitDate && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Date de sortie</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={16} color="#9CA3AF" />
                      <span style={{ fontSize: "14px", color: "#111827" }}>{formatDate(intervention.exitDate)}</span>
                    </div>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Kilométrage</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Gauge size={16} color="#9CA3AF" />
                    <span style={{ fontSize: "14px", color: "#111827" }}>{intervention.mileage.toLocaleString("fr-FR")} km</span>
                  </div>
                </div>
                {intervention.totalAmount && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Montant TTC</p>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>{formatCurrency(intervention.totalAmount)}</span>
                  </div>
                )}
              </div>

              {intervention.description && (
                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #F3F4F6" }}>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "8px" }}>Description</p>
                  <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.6, margin: 0, padding: "12px", borderRadius: "12px", background: "#F9FAFB" }}>
                    {intervention.description}
                  </p>
                </div>
              )}

              {intervention.diagnosticNotes && intervention.diagnosticNotes !== intervention.description && (
                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "8px" }}>Notes techniques</p>
                  <p style={{ fontSize: "14px", color: "#92400E", lineHeight: 1.6, margin: 0, padding: "12px", borderRadius: "12px", background: "#FEF3C7" }}>
                    {intervention.diagnosticNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Client */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={20} color="#F59E0B" />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Client</h2>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Informations contact</p>
                </div>
              </div>
              <Link href={`/clients/${intervention.clientId}`} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6366F1", textDecoration: "none" }}>
                Voir fiche <ExternalLink size={14} />
              </Link>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "20px",
                    fontWeight: 600,
                  }}
                >
                  {intervention.clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>{intervention.clientName}</p>
                  {intervention.clientEmail && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                      <Mail size={14} />
                      {intervention.clientEmail}
                    </div>
                  )}
                  {intervention.clientPhone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                      <Phone size={14} />
                      {intervention.clientPhone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Véhicule */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Car size={20} color="#6366F1" />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Véhicule</h2>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Informations véhicule</p>
                </div>
              </div>
              <Link href={`/vehicules/${intervention.vehicleId}`} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6366F1", textDecoration: "none" }}>
                Voir fiche <ExternalLink size={14} />
              </Link>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Car size={28} color="#6366F1" />
                </div>
                <div>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>{intervention.vehicleInfo}</p>
                  <div style={{ display: "inline-block", marginTop: "8px", padding: "4px 12px", borderRadius: "8px", background: "#F3F4F6", fontFamily: "monospace", fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                    {intervention.vehicleRegistration}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photos placeholder */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon size={20} color="#6B7280" />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Photos</h2>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Documentation visuelle</p>
                </div>
              </div>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ padding: "40px", borderRadius: "12px", border: "2px dashed #E5E7EB", textAlign: "center" }}>
                <ImageIcon size={40} color="#9CA3AF" style={{ marginBottom: "12px" }} />
                <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Aucune photo attachée</p>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "4px 0 0" }}>Les photos sont accessibles via les PV</p>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Signatures */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Signatures</h2>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px",
                    borderRadius: "12px",
                    background: intervention.isClientSigned ? "#D1FAE5" : "#F9FAFB",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: intervention.isClientSigned ? "#10B981" : "#E5E7EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      {intervention.isClientSigned ? <CheckCircle size={20} /> : <Clock size={20} color="#9CA3AF" />}
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>Signature client</p>
                      {intervention.clientSignedAt && (
                        <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>{formatDateTime(intervention.clientSignedAt)}</p>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: 500,
                      background: intervention.isClientSigned ? "rgba(16, 185, 129, 0.2)" : "#E5E7EB",
                      color: intervention.isClientSigned ? "#059669" : "#6B7280",
                    }}
                  >
                    {intervention.isClientSigned ? "Signée" : "En attente"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px",
                    borderRadius: "12px",
                    background: intervention.isGarageSigned ? "#D1FAE5" : "#F9FAFB",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: intervention.isGarageSigned ? "#10B981" : "#E5E7EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      {intervention.isGarageSigned ? <CheckCircle size={20} /> : <Clock size={20} color="#9CA3AF" />}
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>Signature atelier</p>
                      {intervention.garageSignedAt && (
                        <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>{formatDateTime(intervention.garageSignedAt)}</p>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: 500,
                      background: intervention.isGarageSigned ? "rgba(16, 185, 129, 0.2)" : "#E5E7EB",
                      color: intervention.isGarageSigned ? "#059669" : "#6B7280",
                    }}
                  >
                    {intervention.isGarageSigned ? "Signée" : "En attente"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Historique</h2>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {timeline.map((event, idx) => (
                  <div key={event.id} style={{ display: "flex", gap: "12px", paddingBottom: idx < timeline.length - 1 ? "16px" : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: event.type === "signature" ? "#D1FAE5" : event.type === "status_change" ? "#DBEAFE" : "#F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {event.type === "signature" ? (
                          <FileSignature size={14} color="#10B981" />
                        ) : event.type === "status_change" ? (
                          <PlayCircle size={14} color="#3B82F6" />
                        ) : (
                          <FileText size={14} color="#6B7280" />
                        )}
                      </div>
                      {idx < timeline.length - 1 && <div style={{ width: "2px", flex: 1, background: "#E5E7EB", marginTop: "4px" }} />}
                    </div>
                    <div style={{ flex: 1, paddingTop: "4px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>{event.title}</p>
                      {event.description && <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0" }}>{event.description}</p>}
                      <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "4px 0 0" }}>
                        {event.user} • {formatDateTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Actions</h2>
            </div>
            <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => router.push(`/interventions/${intervention.id}/restitution`)} style={{ ...buttonSecondary, width: "100%", justifyContent: "flex-start" }}>
                <FileSignature size={18} color="#6B7280" />
                PV de restitution
              </button>
              <button onClick={() => window.open(`/api/interventions/${intervention.id}/pdf`, "_blank")} style={{ ...buttonSecondary, width: "100%", justifyContent: "flex-start" }}>
                <Download size={18} color="#6B7280" />
                Télécharger PDF
              </button>
              <div style={{ height: "1px", background: "#E5E7EB", margin: "8px 0" }} />
              <button onClick={() => setDeleteModalOpen(true)} style={{ ...buttonDanger, width: "100%", justifyContent: "flex-start" }}>
                <Trash2 size={18} />
                Supprimer l&apos;intervention
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {statusModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }}
          onClick={() => setStatusModalOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "20px", padding: isMobile ? "24px" : "32px", maxWidth: "440px", width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "20px" }}>Changer le statut</h3>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Nouveau statut</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as InterventionStatus)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", background: "#fff" }}
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key} disabled={key === "EN_ATTENTE" && intervention.status !== "EN_ATTENTE"}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Commentaire (optionnel)</label>
              <textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Notes sur ce changement de statut..."
                rows={3}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setStatusModalOpen(false)} style={{ ...buttonSecondary, flex: 1 }}>
                Annuler
              </button>
              <button onClick={handleStatusChange} disabled={isChangingStatus} style={{ ...buttonPrimary, flex: 1, opacity: isChangingStatus ? 0.7 : 1 }}>
                {isChangingStatus ? "Modification..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }}
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "20px", padding: isMobile ? "24px" : "32px", maxWidth: "440px", width: "100%", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "56px", height: "56px", margin: "0 auto 20px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={28} color="#EF4444" />
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Supprimer l&apos;intervention ?</h3>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px" }}>
              Cette action est irréversible. Toutes les données associées seront perdues.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setDeleteModalOpen(false)} style={{ ...buttonSecondary, flex: 1 }}>
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ ...buttonPrimary, flex: 1, background: "#EF4444", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)", opacity: isDeleting ? 0.7 : 1 }}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
