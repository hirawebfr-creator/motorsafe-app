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
} from "lucide-react";

// ============================================================================
// INTERVENTION DETAIL PAGE - SafeMotor Design System
// Détails complets d'une intervention
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
}

interface TimelineEvent {
  id: string;
  type: "status_change" | "signature" | "document" | "note";
  title: string;
  description?: string;
  user: string;
  timestamp: Date;
}

const STATUS_CONFIG: Record<InterventionStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  EN_ATTENTE: { label: "En attente", color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", icon: Clock },
  EN_COURS: { label: "En cours", color: "#3B82F6", bgColor: "rgba(59, 130, 246, 0.1)", icon: PlayCircle },
  TERMINE: { label: "Terminée", color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", icon: CheckCircle },
  ANNULE: { label: "Annulée", color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", icon: XCircle },
};

export default function InterventionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const interventionId = params.id as string;

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
          clientName: itv.vehicle?.client ? `${itv.vehicle.client.firstName} ${itv.vehicle.client.lastName}` : "Client inconnu",
          clientEmail: itv.vehicle?.client?.email || "",
          clientPhone: itv.vehicle?.client?.phone || "",
          vehicleId: itv.vehicleId || "",
          vehicleInfo: itv.vehicle ? `${itv.vehicle.brand} ${itv.vehicle.model}` : "Véhicule inconnu",
          vehicleRegistration: itv.vehicle?.plate || "",
          entryDate: new Date(itv.performedAt || itv.createdAt),
          exitDate: itv.closedAt ? new Date(itv.closedAt) : undefined,
          status: mapApiStatus(itv.status),
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
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
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

  // Styles
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    padding: "24px",
  };

  const canChangeStatus = intervention && intervention.status !== "TERMINE" && intervention.status !== "ANNULE";

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", padding: "32px" }}>
        <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
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
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link
          href="/interventions"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280", textDecoration: "none", marginBottom: "16px" }}
        >
          <ArrowLeft size={16} />
          Retour aux interventions
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#111827", margin: 0, fontFamily: "monospace" }}>{intervention.number}</h1>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "100px",
                  background: statusConfig.bgColor,
                  fontSize: "14px",
                  fontWeight: "600",
                  color: statusConfig.color,
                }}
              >
                <StatusIcon size={18} />
                {statusConfig.label}
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
              Créée le {formatDate(intervention.createdAt)} • {intervention.type}
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href={`/interventions/${intervention.id}/reception`} style={{ textDecoration: "none" }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                <FileSignature size={16} />
                PV Réception
              </button>
            </Link>
            <Link href={`/interventions/${intervention.id}/tech`} style={{ textDecoration: "none" }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
              >
                Changer statut
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
        {/* Colonne principale */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Informations intervention */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "20px" }}>Informations</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280", marginBottom: "6px" }}>Date d'entrée</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={16} color="#9CA3AF" />
                  <span style={{ fontSize: "14px", color: "#111827" }}>{formatDate(intervention.entryDate)}</span>
                </div>
              </div>
              {intervention.exitDate && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280", marginBottom: "6px" }}>Date de sortie</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={16} color="#9CA3AF" />
                    <span style={{ fontSize: "14px", color: "#111827" }}>{formatDate(intervention.exitDate)}</span>
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280", marginBottom: "6px" }}>Kilométrage</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Gauge size={16} color="#9CA3AF" />
                  <span style={{ fontSize: "14px", color: "#111827" }}>{intervention.mileage.toLocaleString("fr-FR")} km</span>
                </div>
              </div>
              {intervention.totalAmount && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280", marginBottom: "6px" }}>Montant TTC</div>
                  <span style={{ fontSize: "20px", fontWeight: "700", color: "#111827" }}>{formatCurrency(intervention.totalAmount)}</span>
                </div>
              )}
            </div>

            {intervention.description && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280", marginBottom: "6px" }}>Description</div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    lineHeight: 1.6,
                    margin: 0,
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#F9FAFB",
                  }}
                >
                  {intervention.description}
                </p>
              </div>
            )}

            {intervention.diagnosticNotes && intervention.diagnosticNotes !== intervention.description && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280", marginBottom: "6px" }}>Notes techniques</div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#92400E",
                    lineHeight: 1.6,
                    margin: 0,
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#FEF3C7",
                  }}
                >
                  {intervention.diagnosticNotes}
                </p>
              </div>
            )}
          </div>

          {/* Client */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>Client</h2>
              <Link
                href={`/clients/${intervention.clientId}`}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6366F1", textDecoration: "none" }}
              >
                Voir fiche <ExternalLink size={14} />
              </Link>
            </div>
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
                  fontWeight: "600",
                }}
              >
                {intervention.clientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827" }}>{intervention.clientName}</div>
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

          {/* Véhicule */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>Véhicule</h2>
              <Link
                href={`/vehicules/${intervention.vehicleId}`}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6366F1", textDecoration: "none" }}
              >
                Voir fiche <ExternalLink size={14} />
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Car size={28} color="#6366F1" />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827" }}>{intervention.vehicleInfo}</div>
                <div
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#F3F4F6",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  {intervention.vehicleRegistration}
                </div>
              </div>
            </div>
          </div>

          {/* Photos placeholder */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Photos</h2>
            <div
              style={{
                padding: "40px",
                borderRadius: "12px",
                border: "2px dashed #E5E7EB",
                textAlign: "center",
              }}
            >
              <ImageIcon size={40} color="#9CA3AF" style={{ marginBottom: "12px" }} />
              <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Aucune photo attachée</p>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Signatures */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Signatures</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px",
                  borderRadius: "12px",
                  background: intervention.isClientSigned ? "rgba(16, 185, 129, 0.1)" : "#F9FAFB",
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
                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>Signature client</div>
                    {intervention.clientSignedAt && (
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>{formatDateTime(intervention.clientSignedAt)}</div>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: "500",
                    background: intervention.isClientSigned ? "rgba(16, 185, 129, 0.15)" : "rgba(156, 163, 175, 0.15)",
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
                  background: intervention.isGarageSigned ? "rgba(16, 185, 129, 0.1)" : "#F9FAFB",
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
                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>Signature atelier</div>
                    {intervention.garageSignedAt && (
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>{formatDateTime(intervention.garageSignedAt)}</div>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: "500",
                    background: intervention.isGarageSigned ? "rgba(16, 185, 129, 0.15)" : "rgba(156, 163, 175, 0.15)",
                    color: intervention.isGarageSigned ? "#059669" : "#6B7280",
                  }}
                >
                  {intervention.isGarageSigned ? "Signée" : "En attente"}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Historique</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {timeline.map((event, idx) => (
                <div key={event.id} style={{ display: "flex", gap: "12px", paddingBottom: idx < timeline.length - 1 ? "16px" : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background:
                          event.type === "signature"
                            ? "rgba(16, 185, 129, 0.1)"
                            : event.type === "status_change"
                            ? "rgba(59, 130, 246, 0.1)"
                            : "rgba(156, 163, 175, 0.1)",
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
                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>{event.title}</div>
                    {event.description && <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>{event.description}</div>}
                    <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
                      {event.user} • {formatDateTime(event.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => router.push(`/interventions/${intervention.id}/restitution`)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <FileSignature size={18} color="#6B7280" />
                PV de restitution
              </button>
              <button
                onClick={() => window.open(`/api/interventions/${intervention.id}/pdf`, "_blank")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Download size={18} color="#6B7280" />
                Télécharger PDF
              </button>
              <div style={{ height: "1px", background: "#E5E7EB", margin: "8px 0" }} />
              <button
                onClick={() => setDeleteModalOpen(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  background: "rgba(239, 68, 68, 0.05)",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#DC2626",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Trash2 size={18} />
                Supprimer l'intervention
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {statusModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => setStatusModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              margin: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", marginBottom: "20px" }}>Changer le statut</h3>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Nouveau statut</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as InterventionStatus)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  fontSize: "14px",
                }}
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key} disabled={key === "EN_ATTENTE" && intervention.status !== "EN_ATTENTE"}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Commentaire (optionnel)</label>
              <textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Notes sur ce changement de statut..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setStatusModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleStatusChange}
                disabled={isChangingStatus}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#fff",
                  cursor: isChangingStatus ? "not-allowed" : "pointer",
                  opacity: isChangingStatus ? 0.7 : 1,
                }}
              >
                {isChangingStatus ? "Modification..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              margin: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 20px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={28} color="#EF4444" />
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", textAlign: "center", margin: "0 0 8px" }}>Supprimer l'intervention ?</h3>
            <p style={{ fontSize: "14px", color: "#6B7280", textAlign: "center", margin: "0 0 24px" }}>
              Cette action est irréversible. Toutes les données associées seront perdues.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#EF4444",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#fff",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
