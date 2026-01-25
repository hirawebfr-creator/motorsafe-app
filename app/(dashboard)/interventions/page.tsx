"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  FileSignature,
  User,
  Car,
  Wrench,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// INTERVENTIONS PAGE - SafeMotor Design System
// Liste des interventions avec filtres et actions
// ============================================================================

type InterventionStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "ANNULE";

interface Intervention {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleInfo: string;
  entryDate: Date;
  exitDate?: Date;
  status: InterventionStatus;
  type: string;
  description: string;
  mileage: number;
  amount?: number;
  isClientSigned: boolean;
  isGarageSigned: boolean;
  signedAt?: Date;
  hasIncident?: boolean;
  createdAt: Date;
}

interface Client {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<InterventionStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  EN_ATTENTE: { label: "En attente", color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", icon: Clock },
  EN_COURS: { label: "En cours", color: "#3B82F6", bgColor: "rgba(59, 130, 246, 0.1)", icon: PlayCircle },
  TERMINE: { label: "Terminée", color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", icon: CheckCircle },
  ANNULE: { label: "Annulée", color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", icon: XCircle },
};

export default function InterventionsPage() {
  const router = useRouter();

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [interventionToDelete, setInterventionToDelete] = useState<Intervention | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Stats
  const stats = {
    total: interventions.length,
    enAttente: interventions.filter((i) => i.status === "EN_ATTENTE").length,
    enCours: interventions.filter((i) => i.status === "EN_COURS").length,
    terminees: interventions.filter((i) => i.status === "TERMINE").length,
    aSigner: interventions.filter((i) => !i.isClientSigned && i.status !== "ANNULE").length,
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter, clientFilter]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load clients
      const clientsRes = await fetch("/api/clients");
      const clientsData = await clientsRes.json();
      if (clientsData.ok && clientsData.data?.items) {
        setClients(
          clientsData.data.items.map((c: any) => ({
            id: String(c.id),
            name: `${c.firstName} ${c.lastName}`,
          }))
        );
      }

      // Load interventions
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (clientFilter !== "all") params.set("clientId", clientFilter);
      params.set("pageSize", "100");

      const res = await fetch(`/api/interventions?${params}`);
      const data = await res.json();

      if (data.ok && data.data?.items) {
        const mapped = data.data.items.map((itv: any) => ({
          id: itv.id,
          number: itv.number || `INT-${itv.id}`,
          clientId: String(itv.vehicle?.clientId || ""),
          clientName: itv.vehicle?.client
            ? `${itv.vehicle.client.firstName} ${itv.vehicle.client.lastName}`
            : "Client inconnu",
          vehicleId: itv.vehicleId,
          vehicleInfo: itv.vehicle
            ? `${itv.vehicle.brand} ${itv.vehicle.model} - ${itv.vehicle.plate}`
            : "Véhicule inconnu",
          entryDate: itv.performedAt ? new Date(itv.performedAt) : new Date(itv.createdAt),
          exitDate: itv.completedAt ? new Date(itv.completedAt) : undefined,
          status:
            itv.status === "DRAFT"
              ? "EN_ATTENTE"
              : itv.status === "OPEN"
              ? "EN_COURS"
              : itv.status === "DONE"
              ? "TERMINE"
              : itv.status === "CANCELED"
              ? "ANNULE"
              : itv.status,
          type: itv.type || "Autre",
          description: itv.notes || itv.title || "",
          mileage: itv.odometerKm || 0,
          amount: itv.amountCents ? itv.amountCents / 100 : undefined,
          isClientSigned: !!itv.clientSignedAt,
          isGarageSigned: !!itv.garageSignedAt,
          signedAt: itv.clientSignedAt ? new Date(itv.clientSignedAt) : undefined,
          hasIncident: !!itv.disputeOpenedAt,
          createdAt: new Date(itv.createdAt),
        }));
        setInterventions(mapped);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!interventionToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/interventions/${interventionToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
        setDeleteModalOpen(false);
        setInterventionToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
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
    overflow: "hidden",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    paddingLeft: "40px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
  };

  const selectStyle: React.CSSProperties = {
    padding: "10px 14px",
    paddingRight: "36px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    fontSize: "14px",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#111827", margin: 0 }}>Interventions</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "4px" }}>
            Gérez vos dossiers d'intervention et signatures
          </p>
        </div>

        <Link href="/interventions/nouveau" style={{ textDecoration: "none" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Plus size={18} />
            Nouvelle intervention
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total", value: stats.total, color: "#6366F1", icon: Wrench },
          { label: "En attente", value: stats.enAttente, color: "#F59E0B", icon: Clock },
          { label: "En cours", value: stats.enCours, color: "#3B82F6", icon: PlayCircle },
          { label: "Terminées", value: stats.terminees, color: "#10B981", icon: CheckCircle },
          { label: "À signer", value: stats.aSigner, color: "#EC4899", icon: FileSignature },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              style={{
                ...cardStyle,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: `${stat.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={24} color={stat.color} />
              </div>
              <div>
                <p style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "250px" }}>
            <Search size={18} color="#9CA3AF" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Rechercher par numéro, client, véhicule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={inputStyle}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminées</option>
            <option value="ANNULE">Annulées</option>
          </select>

          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={selectStyle}>
            <option value="all">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadData()}
            style={{
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={18} color="#6B7280" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: "16px", color: "#6B7280" }}>Chargement...</p>
          </div>
        ) : interventions.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                margin: "0 auto",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wrench size={40} color="#6366F1" />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginTop: "24px" }}>
              Aucune intervention
            </h3>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
              {searchQuery ? "Aucun résultat pour cette recherche" : "Créez votre première intervention"}
            </p>
            {!searchQuery && (
              <Link href="/interventions/nouveau" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={18} />
                  Nouvelle intervention
                </button>
              </Link>
            )}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                {["Numéro", "Client & Véhicule", "Type", "Statut", "Montant", "Signatures", ""].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interventions.map((intervention) => {
                const statusConfig = STATUS_CONFIG[intervention.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <tr
                    key={intervention.id}
                    style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}
                    onClick={() => router.push(`/interventions/${intervention.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                        {intervention.number}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={12} />
                        {formatDate(intervention.entryDate)}
                      </div>
                    </td>

                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "500", color: "#111827", marginBottom: "4px" }}>
                        <User size={14} color="#6B7280" />
                        {intervention.clientName}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6B7280" }}>
                        <Car size={13} color="#9CA3AF" />
                        {intervention.vehicleInfo}
                      </div>
                    </td>

                    <td style={{ padding: "16px" }}>
                      <div style={{ fontSize: "14px", color: "#374151" }}>{intervention.type}</div>
                      {intervention.description && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#9CA3AF",
                            marginTop: "2px",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {intervention.description}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "16px" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "100px",
                          background: statusConfig.bgColor,
                          fontSize: "13px",
                          fontWeight: "500",
                          color: statusConfig.color,
                        }}
                      >
                        <StatusIcon size={14} />
                        {statusConfig.label}
                      </div>
                      {intervention.hasIncident && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", fontSize: "12px", color: "#EF4444" }}>
                          <AlertTriangle size={12} />
                          Incident
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "16px" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: intervention.amount ? "#111827" : "#9CA3AF" }}>
                        {formatCurrency(intervention.amount)}
                      </div>
                    </td>

                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <div
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: intervention.isClientSigned ? "rgba(16, 185, 129, 0.1)" : "rgba(156, 163, 175, 0.1)",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: intervention.isClientSigned ? "#10B981" : "#9CA3AF",
                          }}
                        >
                          {intervention.isClientSigned ? "✓" : "○"} Client
                        </div>
                        <div
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: intervention.isGarageSigned ? "rgba(16, 185, 129, 0.1)" : "rgba(156, 163, 175, 0.1)",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: intervention.isGarageSigned ? "#10B981" : "#9CA3AF",
                          }}
                        >
                          {intervention.isGarageSigned ? "✓" : "○"} Atelier
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === intervention.id ? null : intervention.id);
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "none",
                            background: openDropdown === intervention.id ? "#F3F4F6" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <MoreVertical size={18} color="#6B7280" />
                        </button>

                        {openDropdown === intervention.id && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "100%",
                              marginTop: "4px",
                              width: "200px",
                              background: "#fff",
                              borderRadius: "12px",
                              border: "1px solid #E5E7EB",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                              zIndex: 50,
                              overflow: "hidden",
                            }}
                          >
                            <button
                              onClick={() => router.push(`/interventions/${intervention.id}`)}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: "#374151",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Eye size={16} />
                              Voir détails
                            </button>
                            <button
                              onClick={() => router.push(`/interventions/${intervention.id}/tech`)}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: "#374151",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Wrench size={16} />
                              Fiche technique
                            </button>
                            <button
                              onClick={() => router.push(`/interventions/${intervention.id}/reception`)}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: "#374151",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <FileSignature size={16} />
                              PV Réception
                            </button>
                            <div style={{ height: "1px", background: "#E5E7EB" }} />
                            <button
                              onClick={() => {
                                setInterventionToDelete(intervention);
                                setDeleteModalOpen(true);
                                setOpenDropdown(null);
                              }}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: "#EF4444",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Trash2 size={16} />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && interventionToDelete && (
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

            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", textAlign: "center", margin: "0 0 8px" }}>
              Supprimer l'intervention ?
            </h3>
            <p style={{ fontSize: "14px", color: "#6B7280", textAlign: "center", margin: "0 0 24px" }}>
              L'intervention <strong>{interventionToDelete.number}</strong> sera supprimée définitivement. Cette action est irréversible.
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
