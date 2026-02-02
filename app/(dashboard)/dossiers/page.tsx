"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Search,
  User,
  Car,
  ChevronRight,
  Calendar,
  Wrench,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Receipt,
  RefreshCw,
  X,
} from "lucide-react";
import { DossierProgress, buildDossierSteps } from "@/components/interventions/DossierProgress";

// ============================================================================
// DOSSIERS PAGE - Recherche par client ou véhicule
// ============================================================================

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registration: string;
  clientId: string;
  clientName?: string;
}

interface Intervention {
  id: string;
  number: string;
  status: "DRAFT" | "OPEN" | "DONE" | "CANCELED";
  type: string;
  entryDate: string;
  exitDate: string | null;
  intakeCompletedAt: string | null;
  deliveryCompletedAt: string | null;
  devisStatus: "none" | "draft" | "sent" | "signed";
  orStatus: "none" | "draft" | "sent" | "signed";
  factureStatus: "none" | "draft" | "issued" | "paid";
  clientName: string;
  vehicleInfo: string;
  vehicleRegistration: string;
  totalAmount: number | null;
}

type SearchMode = "client" | "vehicle";
type SelectedEntity = { type: "client"; data: Client } | { type: "vehicle"; data: Vehicle } | null;

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

export default function DossiersPage() {
  const { isMobile } = useResponsive();

  const [searchMode, setSearchMode] = useState<SearchMode>("client");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoadingInterventions, setIsLoadingInterventions] = useState(false);

  // Debounced search
  const searchEntities = useCallback(async (query: string, mode: SearchMode) => {
    if (query.length < 2) {
      setClients([]);
      setVehicles([]);
      return;
    }

    setIsSearching(true);
    try {
      if (mode === "client") {
        const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } else {
        const res = await fetch(`/api/vehicles?search=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles || []);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchEntities(searchQuery, searchMode);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMode, searchEntities]);

  // Load interventions for selected entity
  const loadInterventions = async (entity: SelectedEntity) => {
    if (!entity) return;

    setIsLoadingInterventions(true);
    try {
      let url = "/api/interventions?";
      if (entity.type === "client") {
        url += `clientId=${entity.data.id}`;
      } else {
        url += `vehicleId=${entity.data.id}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInterventions(data.interventions || []);
      }
    } catch (error) {
      console.error("Load interventions error:", error);
    } finally {
      setIsLoadingInterventions(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    const entity: SelectedEntity = { type: "client", data: client };
    setSelectedEntity(entity);
    setSearchQuery("");
    setClients([]);
    loadInterventions(entity);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    const entity: SelectedEntity = { type: "vehicle", data: vehicle };
    setSelectedEntity(entity);
    setSearchQuery("");
    setVehicles([]);
    loadInterventions(entity);
  };

  const handleClearSelection = () => {
    setSelectedEntity(null);
    setInterventions([]);
  };

  const getStatusLabel = (status: Intervention["status"]) => {
    switch (status) {
      case "DRAFT": return "En attente";
      case "OPEN": return "En cours";
      case "DONE": return "Terminé";
      case "CANCELED": return "Annulé";
      default: return status;
    }
  };

  const getStatusColor = (status: Intervention["status"]) => {
    switch (status) {
      case "DRAFT": return { bg: "#FEF3C7", color: "#D97706" };
      case "OPEN": return { bg: "#DBEAFE", color: "#2563EB" };
      case "DONE": return { bg: "#D1FAE5", color: "#059669" };
      case "CANCELED": return { bg: "#FEE2E2", color: "#DC2626" };
      default: return { bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: isMobile ? "16px" : "32px",
    maxWidth: "1400px",
    margin: "0 auto",
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: "32px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? "24px" : "32px",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 8px 0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
  };

  const searchContainerStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    padding: "24px",
    marginBottom: "24px",
  };

  const tabContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: isActive ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6",
    color: isActive ? "#fff" : "#374151",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  const searchInputContainerStyle: React.CSSProperties = {
    position: "relative",
  };

  const searchInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 14px 14px 48px",
    fontSize: "15px",
    border: "2px solid #E5E7EB",
    borderRadius: "12px",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const searchIconStyle: React.CSSProperties = {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9CA3AF",
  };

  const resultsDropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    marginTop: "8px",
    maxHeight: "300px",
    overflowY: "auto",
    zIndex: 100,
  };

  const resultItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #F3F4F6",
    transition: "background 0.15s ease",
  };

  const selectedEntityCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
    borderRadius: "12px",
    marginBottom: "24px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
    marginBottom: "16px",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "16px 20px",
    borderBottom: "1px solid #F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: "20px",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          <FolderOpen size={32} color="#6366F1" />
          Dossiers
        </h1>
        <p style={subtitleStyle}>
          Recherchez un client ou un véhicule pour voir tous les dossiers associés
        </p>
      </div>

      {/* Search Section */}
      <div style={searchContainerStyle}>
        {/* Mode tabs */}
        <div style={tabContainerStyle}>
          <button
            onClick={() => {
              setSearchMode("client");
              setSearchQuery("");
              setVehicles([]);
            }}
            style={tabStyle(searchMode === "client")}
          >
            <User size={18} />
            Par client
          </button>
          <button
            onClick={() => {
              setSearchMode("vehicle");
              setSearchQuery("");
              setClients([]);
            }}
            style={tabStyle(searchMode === "vehicle")}
          >
            <Car size={18} />
            Par véhicule
          </button>
        </div>

        {/* Search input */}
        <div style={searchInputContainerStyle}>
          <Search size={20} style={searchIconStyle} />
          <input
            type="text"
            placeholder={
              searchMode === "client"
                ? "Rechercher par nom, email ou téléphone..."
                : "Rechercher par immatriculation, marque ou modèle..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
          {isSearching && (
            <RefreshCw
              size={20}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6366F1",
                animation: "spin 1s linear infinite",
              }}
            />
          )}

          {/* Results dropdown */}
          {searchQuery.length >= 2 && (searchMode === "client" ? clients.length > 0 : vehicles.length > 0) && (
            <div style={resultsDropdownStyle}>
              {searchMode === "client"
                ? clients.map((client) => (
                    <div
                      key={client.id}
                      style={resultItemStyle}
                      onClick={() => handleSelectClient(client)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>
                          {client.firstName} {client.lastName}
                        </p>
                        <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                          {client.email || client.phone || "Pas de contact"}
                        </p>
                      </div>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </div>
                  ))
                : vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      style={resultItemStyle}
                      onClick={() => handleSelectVehicle(vehicle)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          background: "#EEF2FF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Car size={20} color="#6366F1" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                          {vehicle.registration} {vehicle.clientName && `• ${vehicle.clientName}`}
                        </p>
                      </div>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </div>
                  ))}
            </div>
          )}

          {/* No results */}
          {searchQuery.length >= 2 &&
            !isSearching &&
            (searchMode === "client" ? clients.length === 0 : vehicles.length === 0) && (
              <div style={resultsDropdownStyle}>
                <div style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>
                  <AlertCircle size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>Aucun résultat trouvé</p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Selected Entity */}
      {selectedEntity && (
        <div style={selectedEntityCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {selectedEntity.type === "client" ? (
              <>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "18px",
                  }}
                >
                  {selectedEntity.data.firstName[0]}{selectedEntity.data.lastName[0]}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "18px", color: "#111827" }}>
                    {selectedEntity.data.firstName} {selectedEntity.data.lastName}
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#6B7280" }}>
                    {interventions.length} dossier{interventions.length !== 1 ? "s" : ""} trouvé{interventions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#6366F1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Car size={24} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "18px", color: "#111827" }}>
                    {selectedEntity.data.brand} {selectedEntity.data.model}
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#6B7280" }}>
                    {selectedEntity.data.registration} • {interventions.length} dossier{interventions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleClearSelection}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "none",
              background: "rgba(99, 102, 241, 0.1)",
              color: "#6366F1",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoadingInterventions && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
          <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Interventions List */}
      {selectedEntity && !isLoadingInterventions && interventions.length === 0 && (
        <div style={{ ...cardStyle, padding: "48px", textAlign: "center" }}>
          <FolderOpen size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
          <p style={{ fontSize: "16px", color: "#6B7280", margin: 0 }}>
            Aucun dossier trouvé pour {selectedEntity.type === "client" ? "ce client" : "ce véhicule"}
          </p>
          <Link
            href={`/interventions/nouvelle${selectedEntity.type === "client" ? `?clientId=${selectedEntity.data.id}` : `?vehicleId=${selectedEntity.data.id}`}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "16px",
              padding: "12px 20px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              color: "#fff",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            <Wrench size={18} />
            Créer une intervention
          </Link>
        </div>
      )}

      {selectedEntity && !isLoadingInterventions && interventions.length > 0 && (
        <div>
          {interventions.map((intervention) => {
            const statusConfig = getStatusColor(intervention.status);
            const steps = buildDossierSteps({
              pvReceptionDone: !!intervention.intakeCompletedAt,
              devisStatus: intervention.devisStatus,
              orStatus: intervention.orStatus,
              interventionStatus: intervention.status,
              pvRestitutionDone: !!intervention.deliveryCompletedAt,
              factureStatus: intervention.factureStatus,
            });
            const completedSteps = steps.filter((s) => s.status === "completed").length;
            const progressPercent = Math.round((completedSteps / steps.length) * 100);

            return (
              <Link
                key={intervention.id}
                href={`/interventions/${intervention.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={cardHeaderStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Wrench size={24} color="#fff" />
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: "16px",
                            color: "#111827",
                            fontFamily: "monospace",
                          }}
                        >
                          {intervention.number}
                        </p>
                        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#6B7280" }}>
                          {intervention.type} • {intervention.vehicleInfo}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "100px",
                          background: statusConfig.bg,
                          color: statusConfig.color,
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {intervention.status === "DONE" ? (
                          <Check size={14} />
                        ) : intervention.status === "OPEN" ? (
                          <Clock size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        {getStatusLabel(intervention.status)}
                      </span>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </div>
                  </div>

                  <div style={cardBodyStyle}>
                    {/* Progress bar */}
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                          Progression du dossier
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: progressPercent === 100 ? "#059669" : "#6366F1",
                          }}
                        >
                          {progressPercent}%
                        </span>
                      </div>
                      <DossierProgress steps={steps} showPercentage={false} compact />
                    </div>

                    {/* Info row */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        paddingTop: "16px",
                        borderTop: "1px solid #F3F4F6",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={14} color="#9CA3AF" />
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>
                          {formatDate(intervention.entryDate)}
                        </span>
                      </div>
                      {intervention.totalAmount && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Receipt size={14} color="#9CA3AF" />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                            {formatCurrency(intervention.totalAmount)}
                          </span>
                        </div>
                      )}
                      {intervention.devisStatus !== "none" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FileText size={14} color={intervention.devisStatus === "signed" ? "#059669" : "#D97706"} />
                          <span
                            style={{
                              fontSize: "12px",
                              color: intervention.devisStatus === "signed" ? "#059669" : "#D97706",
                            }}
                          >
                            Devis {intervention.devisStatus === "signed" ? "signé" : "en cours"}
                          </span>
                        </div>
                      )}
                      {intervention.factureStatus !== "none" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Receipt size={14} color={intervention.factureStatus === "paid" ? "#059669" : "#D97706"} />
                          <span
                            style={{
                              fontSize: "12px",
                              color: intervention.factureStatus === "paid" ? "#059669" : "#D97706",
                            }}
                          >
                            Facture {intervention.factureStatus === "paid" ? "payée" : intervention.factureStatus === "issued" ? "émise" : "brouillon"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state when no selection */}
      {!selectedEntity && (
        <div
          style={{
            ...cardStyle,
            padding: "64px 32px",
            textAlign: "center",
            background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Search size={36} color="#6366F1" />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
            Recherchez un client ou un véhicule
          </h3>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: 0, maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
            Utilisez la barre de recherche ci-dessus pour trouver un client par son nom ou un véhicule par son immatriculation, puis consultez tous les dossiers associés.
          </p>
        </div>
      )}
    </div>
  );
}
