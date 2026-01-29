"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Download,
  Mail,
  MoreVertical,
  Trash2,
  Package,
  Search,
  X,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// DOCUMENTS PAGE - SafeMotor Design System (Fully Responsive)
// ============================================================================

type DocumentType = "DEVIS" | "FACTURE" | "EXPORT";
type DevisStatus = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";
type FactureStatus = "BROUILLON" | "ENVOYEE" | "PAYEE" | "IMPAYEE";
type ExportType = "ASSURANCE" | "EXPERT" | "COMPLET";

interface Devis {
  id: string;
  number: string;
  interventionId: string;
  interventionNumber: string;
  clientName: string;
  vehicleInfo: string;
  amount: number;
  status: DevisStatus;
  validUntil: Date;
  createdAt: Date;
  pdfUrl?: string;
}

interface Facture {
  id: string;
  number: string;
  interventionId: string;
  interventionNumber: string;
  clientName: string;
  vehicleInfo: string;
  amount: number;
  status: FactureStatus;
  paidAt?: Date;
  dueDate: Date;
  createdAt: Date;
  pdfUrl?: string;
}

interface Export {
  id: string;
  number: string;
  type: ExportType;
  interventionId: string;
  interventionNumber: string;
  clientName: string;
  vehicleInfo: string;
  requestedBy: string;
  createdAt: Date;
  zipUrl?: string;
}

interface Intervention {
  id: string;
  number: string;
  clientName: string;
  vehicleInfo: string;
}

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

  return {
    isMobile: screen === "mobile",
    isTablet: screen === "tablet",
    isDesktop: screen === "desktop",
    screen,
  };
}

// Status configs (API returns English status values)
const DEVIS_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  DRAFT: { color: "#6B7280", bg: "#F3F4F6", label: "Brouillon" },
  SENT: { color: "#3B82F6", bg: "#DBEAFE", label: "Envoyé" },
  ACCEPTED: { color: "#10B981", bg: "#ECFDF5", label: "Accepté" },
  REJECTED: { color: "#EF4444", bg: "#FEF2F2", label: "Refusé" },
  // Legacy French statuses for backward compatibility
  BROUILLON: { color: "#6B7280", bg: "#F3F4F6", label: "Brouillon" },
  ENVOYE: { color: "#3B82F6", bg: "#DBEAFE", label: "Envoyé" },
  ACCEPTE: { color: "#10B981", bg: "#ECFDF5", label: "Accepté" },
  REFUSE: { color: "#EF4444", bg: "#FEF2F2", label: "Refusé" },
};

const FACTURE_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  DRAFT: { color: "#6B7280", bg: "#F3F4F6", label: "Brouillon" },
  ISSUED: { color: "#3B82F6", bg: "#DBEAFE", label: "Émise" },
  PAID: { color: "#10B981", bg: "#ECFDF5", label: "Payée" },
  PARTIALLY_PAID: { color: "#F59E0B", bg: "#FFFBEB", label: "Partielle" },
  OVERDUE: { color: "#EF4444", bg: "#FEF2F2", label: "Impayée" },
  CANCELED: { color: "#9CA3AF", bg: "#F3F4F6", label: "Annulée" },
  // Legacy French statuses for backward compatibility
  BROUILLON: { color: "#6B7280", bg: "#F3F4F6", label: "Brouillon" },
  ENVOYEE: { color: "#3B82F6", bg: "#DBEAFE", label: "Envoyée" },
  PAYEE: { color: "#10B981", bg: "#ECFDF5", label: "Payée" },
  IMPAYEE: { color: "#EF4444", bg: "#FEF2F2", label: "Impayée" },
};

const EXPORT_TYPE: Record<string, { color: string; bg: string; label: string }> = {
  INTERVENTION_REPORT: { color: "#3B82F6", bg: "#DBEAFE", label: "Rapport" },
  UPLOAD: { color: "#F59E0B", bg: "#FFFBEB", label: "Document" },
  ASSURANCE: { color: "#3B82F6", bg: "#DBEAFE", label: "Assurance" },
  EXPERT: { color: "#F59E0B", bg: "#FFFBEB", label: "Expert" },
  COMPLET: { color: "#10B981", bg: "#ECFDF5", label: "Complet" },
};

// Default badge for unknown statuses
const DEFAULT_STATUS = { color: "#6B7280", bg: "#F3F4F6", label: "Inconnu" };

export default function DocumentsPage() {
  const { isMobile, isTablet } = useResponsive();

  const [activeTab, setActiveTab] = useState<DocumentType>("DEVIS");
  const [devis, setDevis] = useState<Devis[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [exports, setExports] = useState<Export[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateType, setGenerateType] = useState<DocumentType>("DEVIS");
  const [selectedInterventionId, setSelectedInterventionId] = useState("");
  const [exportType, setExportType] = useState<ExportType>("ASSURANCE");
  const [sendEmail, setSendEmail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Devis | Facture | Export | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [generateDropdownOpen, setGenerateDropdownOpen] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Send document by email
  const handleSendEmail = async (type: "quote" | "invoice", id: string) => {
    setSendingEmailId(id);
    try {
      const endpoint = type === "quote" ? `/api/quotes/${id}/send` : `/api/invoices/${id}/send`;
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Erreur lors de l'envoi");
      }

      toast.success("Document envoyé par email");
      setDropdownOpen(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSendingEmailId(null);
    }
  };

  // Load interventions
  const loadInterventions = useCallback(async () => {
    try {
      const response = await fetch("/api/interventions?status=TERMINE");
      const data = await response.json();
      if (data.ok && data.data?.items) {
        setInterventions(
          data.data.items.map((i: Intervention) => ({
            id: i.id,
            number: i.number,
            clientName: i.clientName,
            vehicleInfo: i.vehicleInfo,
          }))
        );
      }
    } catch {
      setInterventions([
        { id: "1", number: "INT-2024-001", clientName: "Jean Dupont", vehicleInfo: "Peugeot 208 - AB-123-CD" },
        { id: "2", number: "INT-2024-002", clientName: "Marie Martin", vehicleInfo: "Citroën C3 - IJ-789-KL" },
      ]);
    }
  }, []);

  // Load devis
  const loadDevis = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter === "all" ? "" : statusFilter,
        page: "1",
        limit: "100",
      });
      const response = await fetch(`/api/documents/devis?${params}`);
      const data = await response.json();
      if (data.ok && data.data?.items) {
        // Map API data to frontend format
        const mappedDevis = data.data.items.map((item: any) => ({
          id: item.id,
          number: item.quoteNumber || `D-${item.id.slice(0, 8)}`,
          interventionId: item.vehicleId || "",
          interventionNumber: "-",
          clientName: item.client ? `${item.client.firstName} ${item.client.lastName}` : "Client inconnu",
          vehicleInfo: item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model} - ${item.vehicle.plate}` : "-",
          amount: item.totalIncl || 0,
          status: item.status,
          validUntil: item.createdAt ? new Date(new Date(item.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000) : new Date(),
          createdAt: new Date(item.createdAt),
          pdfUrl: `/api/quotes/${item.id}/pdf`,
        }));
        setDevis(mappedDevis);
      }
    } catch {
      toast.error("Impossible de charger les devis");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Load factures
  const loadFactures = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter === "all" ? "" : statusFilter,
        page: "1",
        limit: "100",
      });
      const response = await fetch(`/api/documents/factures?${params}`);
      const data = await response.json();
      if (data.ok && data.data?.items) {
        // Map API data to frontend format
        const mappedFactures = data.data.items.map((item: any) => ({
          id: item.id,
          number: item.invoiceNumber || `F-${item.id.slice(0, 8)}`,
          interventionId: item.vehicleId || "",
          interventionNumber: "-",
          clientName: item.client ? `${item.client.firstName} ${item.client.lastName}` : "Client inconnu",
          vehicleInfo: item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model} - ${item.vehicle.plate}` : "-",
          amount: item.totalIncl || 0,
          status: item.status,
          paidAt: item.paidAt ? new Date(item.paidAt) : undefined,
          dueDate: item.dueAt ? new Date(item.dueAt) : new Date(),
          createdAt: new Date(item.createdAt),
          pdfUrl: `/api/invoices/${item.id}/pdf`,
        }));
        setFactures(mappedFactures);
      }
    } catch {
      toast.error("Impossible de charger les factures");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Load exports
  const loadExports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: "1",
        limit: "100",
      });
      const response = await fetch(`/api/documents/exports?${params}`);
      const data = await response.json();
      if (data.ok && data.data?.items) {
        // Map API data to frontend format
        const mappedExports = data.data.items.map((item: any) => ({
          id: item.id,
          number: `EXP-${item.id.slice(0, 8)}`,
          type: item.type || "INTERVENTION_REPORT",
          interventionId: item.interventionId || "",
          interventionNumber: item.intervention?.id?.slice(0, 8) || "-",
          clientName: "-",
          vehicleInfo: item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model} - ${item.vehicle.plate}` : "-",
          requestedBy: "Système",
          createdAt: new Date(item.createdAt),
          zipUrl: item.fileUrl || undefined,
        }));
        setExports(mappedExports);
      }
    } catch {
      toast.error("Impossible de charger les exports");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    void loadInterventions();
  }, [loadInterventions]);

  useEffect(() => {
    if (activeTab === "DEVIS") loadDevis();
    else if (activeTab === "FACTURE") loadFactures();
    else loadExports();
  }, [activeTab, loadDevis, loadFactures, loadExports]);

  const handleOpenGenerateModal = (type: DocumentType) => {
    setGenerateType(type);
    setSelectedInterventionId("");
    setExportType("ASSURANCE");
    setSendEmail(false);
    setIsGenerateModalOpen(true);
    setGenerateDropdownOpen(false);
  };

  const handleGenerate = async () => {
    if (!selectedInterventionId) {
      toast.error("Sélectionnez une intervention");
      return;
    }

    setIsGenerating(true);

    try {
      let url = "";
      const payload: Record<string, unknown> = { interventionId: selectedInterventionId };

      if (generateType === "DEVIS") {
        url = "/api/documents/devis/generate";
        payload.sendEmail = sendEmail;
      } else if (generateType === "FACTURE") {
        url = "/api/documents/factures/generate";
        payload.sendEmail = sendEmail;
      } else {
        url = "/api/documents/exports/generate";
        payload.type = exportType;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ok) {
        toast.success(sendEmail ? "Document généré et envoyé par email" : "Document généré avec succès");
        setIsGenerateModalOpen(false);
        if (generateType === "DEVIS") loadDevis();
        else if (generateType === "FACTURE") loadFactures();
        else loadExports();
      } else {
        toast.error(data.error || "Impossible de générer le document");
      }
    } catch {
      toast.error("Impossible de se connecter au serveur");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.info("Le fichier sera disponible dans quelques secondes");
    }
  };

  const handleDeleteClick = (document: Devis | Facture | Export) => {
    setDocumentToDelete(document);
    setDeleteModalOpen(true);
    setDropdownOpen(null);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);

    try {
      let url = "";
      if (activeTab === "DEVIS") url = `/api/documents/devis/${documentToDelete.id}`;
      else if (activeTab === "FACTURE") url = `/api/documents/factures/${documentToDelete.id}`;
      else url = `/api/documents/exports/${documentToDelete.id}`;

      const response = await fetch(url, { method: "DELETE" });
      const data = await response.json();

      if (data.ok) {
        toast.success("Le document a été supprimé avec succès");
        setDeleteModalOpen(false);
        setDocumentToDelete(null);
        if (activeTab === "DEVIS") loadDevis();
        else if (activeTab === "FACTURE") loadFactures();
        else loadExports();
      } else {
        toast.error(data.error || "Impossible de supprimer le document");
      }
    } catch {
      toast.error("Impossible de se connecter au serveur");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen(null);
      setGenerateDropdownOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Responsive styles
  const padding = isMobile ? "16px" : isTablet ? "24px" : "32px";
  const headerFlex = isMobile ? "column" : "row";
  const headerAlign = isMobile ? "stretch" : "center";
  const headerGap = isMobile ? "16px" : "0";

  const tabsList = [
    { id: "DEVIS", label: "Devis", count: devis.length },
    { id: "FACTURE", label: "Factures", count: factures.length },
    { id: "EXPORT", label: "Exports", count: exports.length },
  ];

  return (
    <div style={{ padding, maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: headerFlex as "column" | "row",
          justifyContent: "space-between",
          alignItems: headerAlign as "stretch" | "center",
          gap: headerGap,
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: isMobile ? "40px" : "48px",
              height: isMobile ? "40px" : "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={isMobile ? 20 : 24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>
              Documents
            </h1>
            <p style={{ fontSize: isMobile ? "13px" : "15px", color: "#6B7280", margin: "4px 0 0" }}>
              Gérez vos devis, factures et exports
            </p>
          </div>
        </div>

        {/* Generate dropdown */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setGenerateDropdownOpen(!generateDropdownOpen);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: isMobile ? "10px 16px" : "12px 20px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              width: isMobile ? "100%" : "auto",
              justifyContent: isMobile ? "center" : "flex-start",
            }}
          >
            <Plus size={18} />
            Générer un document
            <ChevronDown size={16} />
          </button>

          {generateDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: isMobile ? "0" : "0",
                left: isMobile ? "0" : "auto",
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                zIndex: 50,
                minWidth: "200px",
                overflow: "hidden",
              }}
            >
              {[
                { id: "DEVIS" as const, label: "Nouveau devis", icon: FileText },
                { id: "FACTURE" as const, label: "Nouvelle facture", icon: FileText },
                { id: "EXPORT" as const, label: "Export assurance", icon: Package },
              ].map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenGenerateModal(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    color: "#374151",
                    cursor: "pointer",
                    textAlign: "left",
                    borderTop: i > 0 ? "1px solid #F3F4F6" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <item.icon size={16} color="#6B7280" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: isMobile ? "4px" : "8px",
          marginBottom: "24px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tabsList.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as DocumentType);
              setSearchQuery("");
              setStatusFilter("all");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: isMobile ? "10px 14px" : "12px 20px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === tab.id ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6",
              fontSize: isMobile ? "13px" : "14px",
              fontWeight: 600,
              color: activeTab === tab.id ? "#fff" : "#6B7280",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "10px",
                background: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "#E5E7EB",
                fontSize: "12px",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={18}
            color="#9CA3AF"
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder={
              activeTab === "DEVIS"
                ? "Rechercher un devis..."
                : activeTab === "FACTURE"
                ? "Rechercher une facture..."
                : "Rechercher un export..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 44px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              fontSize: "14px",
              outline: "none",
              background: "#fff",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={16} color="#9CA3AF" />
            </button>
          )}
        </div>

        {/* Status filter (not for exports) */}
        {activeTab !== "EXPORT" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              fontSize: "14px",
              background: "#fff",
              cursor: "pointer",
              minWidth: isMobile ? "100%" : "180px",
            }}
          >
            <option value="all">Tous les statuts</option>
            {activeTab === "DEVIS" ? (
              <>
                <option value="BROUILLON">Brouillons</option>
                <option value="ENVOYE">Envoyés</option>
                <option value="ACCEPTE">Acceptés</option>
                <option value="REFUSE">Refusés</option>
              </>
            ) : (
              <>
                <option value="BROUILLON">Brouillons</option>
                <option value="ENVOYEE">Envoyées</option>
                <option value="PAYEE">Payées</option>
                <option value="IMPAYEE">Impayées</option>
              </>
            )}
          </select>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
            <Loader2 size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : activeTab === "DEVIS" && devis.length === 0 ? (
          <EmptyState type="DEVIS" onGenerate={() => handleOpenGenerateModal("DEVIS")} isMobile={isMobile} />
        ) : activeTab === "FACTURE" && factures.length === 0 ? (
          <EmptyState type="FACTURE" onGenerate={() => handleOpenGenerateModal("FACTURE")} isMobile={isMobile} />
        ) : activeTab === "EXPORT" && exports.length === 0 ? (
          <EmptyState type="EXPORT" onGenerate={() => handleOpenGenerateModal("EXPORT")} isMobile={isMobile} />
        ) : isMobile ? (
          // Mobile card view
          <div style={{ padding: "12px" }}>
            {activeTab === "DEVIS" &&
              devis.map((d) => (
                <MobileCard
                  key={d.id}
                  title={d.number}
                  subtitle={`${d.clientName} • ${d.vehicleInfo}`}
                  badge={{ ...DEVIS_STATUS[d.status] }}
                  info={[
                    { label: "Montant", value: formatCurrency(d.amount) },
                    { label: "Validité", value: formatDate(d.validUntil) },
                  ]}
                  onDownload={() => handleDownload(d.pdfUrl || "")}
                  onDelete={() => handleDeleteClick(d)}
                  onSendEmail={() => handleSendEmail("quote", d.id)}
                  isSending={sendingEmailId === d.id}
                />
              ))}
            {activeTab === "FACTURE" &&
              factures.map((f) => (
                <MobileCard
                  key={f.id}
                  title={f.number}
                  subtitle={`${f.clientName} • ${f.vehicleInfo}`}
                  badge={{ ...FACTURE_STATUS[f.status] }}
                  info={[
                    { label: "Montant", value: formatCurrency(f.amount) },
                    { label: "Échéance", value: formatDate(f.dueDate) },
                  ]}
                  onDownload={() => handleDownload(f.pdfUrl || "")}
                  onDelete={() => handleDeleteClick(f)}
                  onSendEmail={() => handleSendEmail("invoice", f.id)}
                  isSending={sendingEmailId === f.id}
                />
              ))}
            {activeTab === "EXPORT" &&
              exports.map((e) => (
                <MobileCard
                  key={e.id}
                  title={e.number}
                  subtitle={`${e.clientName} • ${e.vehicleInfo}`}
                  badge={{ ...EXPORT_TYPE[e.type] }}
                  info={[
                    { label: "Demandeur", value: e.requestedBy },
                    { label: "Date", value: formatDate(e.createdAt) },
                  ]}
                  onDownload={() => handleDownload(e.zipUrl || "")}
                  onDelete={() => handleDeleteClick(e)}
                  isZip
                />
              ))}
          </div>
        ) : (
          // Desktop/Tablet table view
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ ...thStyle, width: isTablet ? "25%" : "18%" }}>Numéro</th>
                  <th style={{ ...thStyle, width: isTablet ? "30%" : "25%" }}>Intervention</th>
                  {activeTab === "EXPORT" ? (
                    <th style={thStyle}>Type</th>
                  ) : (
                    <th style={thStyle}>Montant</th>
                  )}
                  <th style={thStyle}>{activeTab === "EXPORT" ? "Demandeur" : "Statut"}</th>
                  <th style={thStyle}>{activeTab === "DEVIS" ? "Validité" : activeTab === "FACTURE" ? "Échéance" : "Date"}</th>
                  <th style={{ ...thStyle, width: "80px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "DEVIS" &&
                  devis.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={tdStyle}>
                        <div style={{ fontFamily: "monospace", fontWeight: 600, color: "#111827" }}>{d.number}</div>
                        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{formatDate(d.createdAt)}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: "#111827" }}>{d.interventionNumber}</div>
                        <div style={{ fontSize: "12px", color: "#6B7280" }}>{d.clientName}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{d.vehicleInfo}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(d.amount)}</span>
                      </td>
                      <td style={tdStyle}>
                        <StatusBadge config={DEVIS_STATUS[d.status]} />
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>{formatDate(d.validUntil)}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <ActionMenu
                          isOpen={dropdownOpen === d.id}
                          onToggle={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === d.id ? null : d.id);
                          }}
                          onDownload={() => handleDownload(d.pdfUrl || "")}
                          onDelete={() => handleDeleteClick(d)}
                          onSendEmail={() => handleSendEmail("quote", d.id)}
                          isSending={sendingEmailId === d.id}
                        />
                      </td>
                    </tr>
                  ))}
                {activeTab === "FACTURE" &&
                  factures.map((f) => (
                    <tr key={f.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={tdStyle}>
                        <div style={{ fontFamily: "monospace", fontWeight: 600, color: "#111827" }}>{f.number}</div>
                        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{formatDate(f.createdAt)}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: "#111827" }}>{f.interventionNumber}</div>
                        <div style={{ fontSize: "12px", color: "#6B7280" }}>{f.clientName}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{f.vehicleInfo}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(f.amount)}</span>
                      </td>
                      <td style={tdStyle}>
                        <StatusBadge config={FACTURE_STATUS[f.status]} />
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>{formatDate(f.dueDate)}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <ActionMenu
                          isOpen={dropdownOpen === f.id}
                          onToggle={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === f.id ? null : f.id);
                          }}
                          onDownload={() => handleDownload(f.pdfUrl || "")}
                          onDelete={() => handleDeleteClick(f)}
                          onSendEmail={() => handleSendEmail("invoice", f.id)}
                          isSending={sendingEmailId === f.id}
                        />
                      </td>
                    </tr>
                  ))}
                {activeTab === "EXPORT" &&
                  exports.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={tdStyle}>
                        <div style={{ fontFamily: "monospace", fontWeight: 600, color: "#111827" }}>{e.number}</div>
                        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{formatDate(e.createdAt)}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: "#111827" }}>{e.interventionNumber}</div>
                        <div style={{ fontSize: "12px", color: "#6B7280" }}>{e.clientName}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{e.vehicleInfo}</div>
                      </td>
                      <td style={tdStyle}>
                        <StatusBadge config={EXPORT_TYPE[e.type]} />
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>{e.requestedBy}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>{formatDate(e.createdAt)}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <ActionMenu
                          isOpen={dropdownOpen === e.id}
                          onToggle={(ev) => {
                            ev.stopPropagation();
                            setDropdownOpen(dropdownOpen === e.id ? null : e.id);
                          }}
                          onDownload={() => handleDownload(e.zipUrl || "")}
                          onDelete={() => handleDeleteClick(e)}
                          isZip
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <ModalOverlay onClose={() => setIsGenerateModalOpen(false)}>
          <div
            style={{
              background: "#fff",
              borderRadius: isMobile ? "16px 16px 0 0" : "16px",
              width: isMobile ? "100%" : "480px",
              maxWidth: "100%",
              maxHeight: isMobile ? "85vh" : "90vh",
              overflow: "auto",
              position: isMobile ? "fixed" : "relative",
              bottom: isMobile ? 0 : "auto",
              left: isMobile ? 0 : "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0 }}>
                Générer {generateType === "DEVIS" ? "un devis" : generateType === "FACTURE" ? "une facture" : "un export"}
              </h2>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                  Intervention *
                </label>
                <select
                  value={selectedInterventionId}
                  onChange={(e) => setSelectedInterventionId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="">Sélectionner une intervention</option>
                  {interventions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.number} - {i.clientName} ({i.vehicleInfo})
                    </option>
                  ))}
                </select>
              </div>

              {generateType === "EXPORT" && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                    Type d'export
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as ExportType)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                      fontSize: "14px",
                      background: "#fff",
                    }}
                  >
                    <option value="ASSURANCE">Assurance (Photos + Factures + Signatures)</option>
                    <option value="EXPERT">Expert (Complet + Chaîne de preuves)</option>
                    <option value="COMPLET">Complet (Archive complète)</option>
                  </select>
                </div>
              )}

              {(generateType === "DEVIS" || generateType === "FACTURE") && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    background: "#F9FAFB",
                    borderRadius: "10px",
                    marginBottom: "20px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="sendEmail" style={{ fontSize: "14px", color: "#374151", cursor: "pointer" }}>
                    Envoyer par email au client
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  disabled={isGenerating}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    cursor: isGenerating ? "not-allowed" : "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedInterventionId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background:
                      isGenerating || !selectedInterventionId
                        ? "#D1D5DB"
                        : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#fff",
                    cursor: isGenerating || !selectedInterventionId ? "not-allowed" : "pointer",
                    boxShadow: isGenerating || !selectedInterventionId ? "none" : "0 4px 14px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {isGenerating && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                  Générer
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && documentToDelete && (
        <ModalOverlay onClose={() => setDeleteModalOpen(false)}>
          <div
            style={{
              background: "#fff",
              borderRadius: isMobile ? "16px 16px 0 0" : "16px",
              width: isMobile ? "100%" : "420px",
              maxWidth: "100%",
              position: isMobile ? "fixed" : "relative",
              bottom: isMobile ? 0 : "auto",
              left: isMobile ? 0 : "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <AlertTriangle size={28} color="#EF4444" />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Supprimer le document</h3>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px" }}>
                Êtes-vous sûr de vouloir supprimer <strong style={{ color: "#111827" }}>{documentToDelete.number}</strong> ?
              </p>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#EF4444",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#fff",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                  }}
                >
                  {isDeleting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* CSS Animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `,
        }}
      />
    </div>
  );
}

// Helper components
const thStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#6B7280",
  textAlign: "left",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "16px",
  fontSize: "14px",
  verticalAlign: "top",
};

function StatusBadge({ config }: { config: { color: string; bg: string; label: string } | undefined }) {
  const safeConfig = config || DEFAULT_STATUS;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        background: safeConfig.bg,
        color: safeConfig.color,
      }}
    >
      {safeConfig.label}
    </span>
  );
}

function ActionMenu({
  isOpen,
  onToggle,
  onDownload,
  onDelete,
  onSendEmail,
  isZip = false,
  isSending = false,
}: {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onDownload: () => void;
  onDelete: () => void;
  onSendEmail?: () => void;
  isZip?: boolean;
  isSending?: boolean;
}) {
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          padding: "8px",
          border: "none",
          background: isOpen ? "#F3F4F6" : "transparent",
          borderRadius: "8px",
          cursor: "pointer",
          color: "#6B7280",
        }}
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
            zIndex: 50,
            minWidth: "160px",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={onDownload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "12px 16px",
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
            {isZip ? <Package size={16} /> : <Download size={16} />}
            Télécharger {isZip ? "ZIP" : "PDF"}
          </button>
          {!isZip && onSendEmail && (
            <button
              type="button"
              onClick={onSendEmail}
              disabled={isSending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                fontSize: "14px",
                color: isSending ? "#9CA3AF" : "#374151",
                cursor: isSending ? "not-allowed" : "pointer",
                textAlign: "left",
                borderTop: "1px solid #F3F4F6",
              }}
              onMouseEnter={(e) => !isSending && (e.currentTarget.style.background = "#F9FAFB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {isSending ? "Envoi..." : "Envoyer par email"}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "12px 16px",
              border: "none",
              background: "transparent",
              fontSize: "14px",
              color: "#EF4444",
              cursor: "pointer",
              textAlign: "left",
              borderTop: "1px solid #F3F4F6",
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
  );
}

function MobileCard({
  title,
  subtitle,
  badge,
  info,
  onDownload,
  onDelete,
  onSendEmail,
  isZip = false,
  isSending = false,
}: {
  title: string;
  subtitle: string;
  badge: { color: string; bg: string; label: string };
  info: { label: string; value: string }[];
  onDownload: () => void;
  onDelete: () => void;
  onSendEmail?: () => void;
  isZip?: boolean;
  isSending?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: 600, color: "#111827" }}>{title}</div>
          <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>{subtitle}</div>
        </div>
        <StatusBadge config={badge} />
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        {info.map((item, i) => (
          <div key={i}>
            <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "2px" }}>{item.label}</div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={onDownload}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            background: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          {isZip ? <Package size={14} /> : <Download size={14} />}
          {isZip ? "ZIP" : "PDF"}
        </button>
        {!isZip && onSendEmail && (
          <button
            type="button"
            onClick={onSendEmail}
            disabled={isSending}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              background: isSending ? "#F9FAFB" : "#fff",
              color: isSending ? "#9CA3AF" : "#374151",
              cursor: isSending ? "not-allowed" : "pointer",
            }}
          >
            {isSending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #FECACA",
            background: "#FEF2F2",
            color: "#EF4444",
            cursor: "pointer",
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  type,
  onGenerate,
  isMobile,
}: {
  type: DocumentType;
  onGenerate: () => void;
  isMobile: boolean;
}) {
  const config = {
    DEVIS: { title: "Aucun devis", desc: "Commencez par générer votre premier devis", btn: "Générer un devis" },
    FACTURE: { title: "Aucune facture", desc: "Commencez par générer votre première facture", btn: "Générer une facture" },
    EXPORT: { title: "Aucun export", desc: "Commencez par générer votre premier export", btn: "Générer un export" },
  };

  const c = config[type];

  return (
    <div style={{ textAlign: "center", padding: isMobile ? "48px 24px" : "64px 24px" }}>
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "#F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <FileText size={28} color="#9CA3AF" />
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>{c.title}</h3>
      <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px" }}>{c.desc}</p>
      <button
        type="button"
        onClick={onGenerate}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          fontSize: "14px",
          fontWeight: 600,
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
        }}
      >
        <Plus size={18} />
        {c.btn}
      </button>
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
      onClick={onClose}
    >
      {children}
    </div>
  );
}
