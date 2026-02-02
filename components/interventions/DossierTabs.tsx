"use client";

/**
 * UX-IMPROVEMENT-02: Dossier Tabs Component
 *
 * Displays tabbed navigation for intervention dossier documents.
 * Tabs: [General] [Reception] [Devis] [OR] [Restitution] [Facture]
 *
 * Each tab shows relevant documents and actions for that step.
 */

import React from "react";
import Link from "next/link";
import {
  Home,
  ClipboardCheck,
  FileText,
  Wrench,
  Package,
  Receipt,
  Check,
  AlertCircle,
  Send,
  Eye,
  Download,
  Mail,
} from "lucide-react";

export type TabId = "general" | "reception" | "devis" | "or" | "restitution" | "facture";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  status?: "completed" | "in_progress" | "pending";
}

export interface DossierTabsProps {
  interventionId: string;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  // Status for each step
  receptionStatus: "completed" | "in_progress" | "pending";
  devisStatus: "completed" | "in_progress" | "pending";
  orStatus: "completed" | "in_progress" | "pending";
  travauxStatus: "completed" | "in_progress" | "pending";
  restitutionStatus: "completed" | "in_progress" | "pending";
  factureStatus: "completed" | "in_progress" | "pending";
  // Data
  quotes?: {
    id: string;
    quoteNumber: string | null;
    status: string;
    signatureStatus: string | null;
    totalIncl: number;
    createdAt: Date;
  }[];
  invoices?: {
    id: string;
    invoiceNumber: string | null;
    status: string;
    totalIncl: number;
    amountPaid: number;
    issuedAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
  }[];
  // Callbacks
  onSendReceptionPv?: () => void;
  onSendDevis?: (quoteId: string) => void;
  onSendOr?: () => void;
  onSendRestitutionPv?: () => void;
  onCreateDevis?: () => void;
  onCreateFacture?: () => void;
  // Loading states
  isSendingReception?: boolean;
  isSendingDevis?: string | null; // quote id being sent
  isSendingOr?: boolean;
  isSendingRestitution?: boolean;
  // Compact mode for mobile
  compact?: boolean;
}

export function DossierTabs({
  interventionId,
  activeTab,
  onTabChange,
  receptionStatus,
  devisStatus,
  orStatus,
  travauxStatus,
  restitutionStatus,
  factureStatus,
  quotes = [],
  invoices = [],
  onSendReceptionPv,
  onSendDevis,
  onSendOr,
  onSendRestitutionPv,
  onCreateDevis,
  onCreateFacture,
  isSendingReception,
  isSendingDevis,
  isSendingOr,
  isSendingRestitution,
  compact = false,
}: DossierTabsProps) {
  const tabs: TabConfig[] = [
    { id: "general", label: "General", icon: Home },
    { id: "reception", label: "Reception", icon: ClipboardCheck, status: receptionStatus },
    { id: "devis", label: "Devis", icon: FileText, status: devisStatus },
    { id: "or", label: "OR", icon: Wrench, status: orStatus },
    { id: "restitution", label: "Restitution", icon: Package, status: restitutionStatus },
    { id: "facture", label: "Facture", icon: Receipt, status: factureStatus },
  ];

  const getStatusIcon = (status?: "completed" | "in_progress" | "pending") => {
    switch (status) {
      case "completed":
        return <Check size={12} />;
      case "in_progress":
        return <AlertCircle size={12} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: "completed" | "in_progress" | "pending") => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "in_progress":
        return "#F59E0B";
      default:
        return "#9CA3AF";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const getQuoteStatusLabel = (status: string, signatureStatus: string | null) => {
    if (signatureStatus === "SIGNED") return { label: "Signe", color: "#10B981", bg: "#D1FAE5" };
    if (status === "SENT") return { label: "Envoye", color: "#3B82F6", bg: "#DBEAFE" };
    if (status === "ACCEPTED") return { label: "Accepte", color: "#10B981", bg: "#D1FAE5" };
    if (status === "REJECTED") return { label: "Refuse", color: "#EF4444", bg: "#FEE2E2" };
    return { label: "Brouillon", color: "#6B7280", bg: "#F3F4F6" };
  };

  const getInvoiceStatusLabel = (status: string, paidAt: Date | null) => {
    if (paidAt) return { label: "Payee", color: "#10B981", bg: "#D1FAE5" };
    if (status === "ISSUED") return { label: "Emise", color: "#3B82F6", bg: "#DBEAFE" };
    return { label: "Brouillon", color: "#6B7280", bg: "#F3F4F6" };
  };

  // Styles
  const tabBarStyle: React.CSSProperties = {
    display: "flex",
    gap: compact ? "4px" : "8px",
    padding: compact ? "8px" : "12px",
    background: "#F9FAFB",
    borderRadius: "16px",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  };

  const tabStyle = (isActive: boolean, status?: "completed" | "in_progress" | "pending"): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: compact ? "4px" : "8px",
    padding: compact ? "8px 12px" : "10px 16px",
    borderRadius: "12px",
    border: "none",
    background: isActive ? "#fff" : "transparent",
    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
    fontSize: compact ? "12px" : "14px",
    fontWeight: isActive ? 600 : 500,
    color: isActive ? "#111827" : "#6B7280",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    position: "relative",
  });

  const statusDotStyle = (status?: "completed" | "in_progress" | "pending"): React.CSSProperties => ({
    position: "absolute",
    top: "4px",
    right: "4px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: getStatusColor(status),
    border: "2px solid #fff",
  });

  const contentStyle: React.CSSProperties = {
    marginTop: "16px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    padding: compact ? "16px" : "20px",
  };

  const buttonPrimary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    fontSize: "13px",
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
  };

  const buttonSecondary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    background: "#fff",
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    cursor: "pointer",
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "32px 16px",
    color: "#6B7280",
  };

  const documentRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderRadius: "10px",
    background: "#F9FAFB",
    marginBottom: "8px",
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div style={cardStyle}>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
              Vue generale du dossier. Selectionnez un onglet pour voir les documents associes.
            </p>
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              {tabs.slice(1).map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      padding: "16px",
                      borderRadius: "12px",
                      border: `2px solid ${getStatusColor(tab.status)}20`,
                      background: `${getStatusColor(tab.status)}10`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <TabIcon size={20} color={getStatusColor(tab.status)} />
                      {getStatusIcon(tab.status) && (
                        <span style={{ color: getStatusColor(tab.status) }}>{getStatusIcon(tab.status)}</span>
                      )}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "reception":
        return (
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>PV de Reception</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>
                  Etat des lieux a l&apos;entree du vehicule
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "100px",
                  background: receptionStatus === "completed" ? "#D1FAE5" : receptionStatus === "in_progress" ? "#FEF3C7" : "#F3F4F6",
                  color: getStatusColor(receptionStatus),
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {getStatusIcon(receptionStatus)}
                {receptionStatus === "completed" ? "Signe" : receptionStatus === "in_progress" ? "En cours" : "A faire"}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <Link href={`/interventions/${interventionId}/reception`} style={{ textDecoration: "none" }}>
                <button style={buttonSecondary}>
                  <Eye size={16} />
                  Voir / Editer
                </button>
              </Link>
              {receptionStatus !== "completed" && onSendReceptionPv && (
                <button
                  onClick={onSendReceptionPv}
                  disabled={isSendingReception}
                  style={{ ...buttonPrimary, opacity: isSendingReception ? 0.7 : 1 }}
                >
                  <Mail size={16} />
                  {isSendingReception ? "Envoi..." : "Envoyer par email"}
                </button>
              )}
              {receptionStatus === "completed" && (
                <button
                  onClick={() => window.open(`/api/interventions/${interventionId}/intake-pv/pdf`, "_blank")}
                  style={buttonSecondary}
                >
                  <Download size={16} />
                  Telecharger PDF
                </button>
              )}
            </div>
          </div>
        );

      case "devis":
        return (
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Devis</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>
                  Estimations et propositions commerciales
                </p>
              </div>
              {onCreateDevis && (
                <button onClick={onCreateDevis} style={buttonPrimary}>
                  <FileText size={16} />
                  Nouveau devis
                </button>
              )}
            </div>

            {quotes.length === 0 ? (
              <div style={emptyStateStyle}>
                <FileText size={40} color="#D1D5DB" style={{ marginBottom: "12px" }} />
                <p style={{ margin: 0 }}>Aucun devis pour cette intervention</p>
              </div>
            ) : (
              <div>
                {quotes.map((quote) => {
                  const statusInfo = getQuoteStatusLabel(quote.status, quote.signatureStatus);
                  return (
                    <div key={quote.id} style={documentRowStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={20} color="#6366F1" />
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>
                            {quote.quoteNumber || `Devis #${quote.id.slice(0, 8)}`}
                          </p>
                          <p style={{ fontSize: "12px", color: "#6B7280", margin: "2px 0 0" }}>
                            {formatCurrency(quote.totalIncl)} TTC - {formatDate(quote.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "100px",
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                        <Link href={`/devis/${quote.id}`}>
                          <button style={{ ...buttonSecondary, padding: "6px 10px" }}>
                            <Eye size={14} />
                          </button>
                        </Link>
                        {quote.status === "DRAFT" && onSendDevis && (
                          <button
                            onClick={() => onSendDevis(quote.id)}
                            disabled={isSendingDevis === quote.id}
                            style={{ ...buttonSecondary, padding: "6px 10px", opacity: isSendingDevis === quote.id ? 0.7 : 1 }}
                          >
                            <Send size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "or":
        return (
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Ordre de Reparation</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>
                  Autorisation client pour les travaux
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "100px",
                  background: orStatus === "completed" ? "#D1FAE5" : orStatus === "in_progress" ? "#FEF3C7" : "#F3F4F6",
                  color: getStatusColor(orStatus),
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {getStatusIcon(orStatus)}
                {orStatus === "completed" ? "Signe" : orStatus === "in_progress" ? "Envoye" : "A creer"}
              </div>
            </div>

            {orStatus === "pending" ? (
              <div style={emptyStateStyle}>
                <Wrench size={40} color="#D1D5DB" style={{ marginBottom: "12px" }} />
                <p style={{ margin: "0 0 12px" }}>Aucun OR genere</p>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                  L&apos;OR est genere automatiquement a partir d&apos;un devis accepte
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <Link href={`/interventions/${interventionId}/or`} style={{ textDecoration: "none" }}>
                  <button style={buttonSecondary}>
                    <Eye size={16} />
                    Voir l&apos;OR
                  </button>
                </Link>
                {orStatus === "in_progress" && onSendOr && (
                  <button
                    onClick={onSendOr}
                    disabled={isSendingOr}
                    style={{ ...buttonPrimary, opacity: isSendingOr ? 0.7 : 1 }}
                  >
                    <Mail size={16} />
                    {isSendingOr ? "Envoi..." : "Renvoyer par email"}
                  </button>
                )}
                {orStatus === "completed" && (
                  <button
                    onClick={() => window.open(`/api/interventions/${interventionId}/or/pdf`, "_blank")}
                    style={buttonSecondary}
                  >
                    <Download size={16} />
                    Telecharger PDF
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case "restitution":
        return (
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>PV de Restitution</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>
                  Etat des lieux a la sortie du vehicule
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "100px",
                  background: restitutionStatus === "completed" ? "#D1FAE5" : restitutionStatus === "in_progress" ? "#FEF3C7" : "#F3F4F6",
                  color: getStatusColor(restitutionStatus),
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {getStatusIcon(restitutionStatus)}
                {restitutionStatus === "completed" ? "Signe" : restitutionStatus === "in_progress" ? "En cours" : "A faire"}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <Link href={`/interventions/${interventionId}/restitution`} style={{ textDecoration: "none" }}>
                <button style={buttonSecondary}>
                  <Eye size={16} />
                  Voir / Editer
                </button>
              </Link>
              {restitutionStatus !== "completed" && travauxStatus === "completed" && onSendRestitutionPv && (
                <button
                  onClick={onSendRestitutionPv}
                  disabled={isSendingRestitution}
                  style={{ ...buttonPrimary, opacity: isSendingRestitution ? 0.7 : 1 }}
                >
                  <Mail size={16} />
                  {isSendingRestitution ? "Envoi..." : "Envoyer par email"}
                </button>
              )}
              {restitutionStatus === "completed" && (
                <button
                  onClick={() => window.open(`/api/interventions/${interventionId}/delivery-pv/pdf`, "_blank")}
                  style={buttonSecondary}
                >
                  <Download size={16} />
                  Telecharger PDF
                </button>
              )}
            </div>
          </div>
        );

      case "facture":
        return (
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Factures</h3>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0" }}>
                  Documents de facturation
                </p>
              </div>
              {onCreateFacture && (
                <button onClick={onCreateFacture} style={buttonPrimary}>
                  <Receipt size={16} />
                  Nouvelle facture
                </button>
              )}
            </div>

            {invoices.length === 0 ? (
              <div style={emptyStateStyle}>
                <Receipt size={40} color="#D1D5DB" style={{ marginBottom: "12px" }} />
                <p style={{ margin: 0 }}>Aucune facture pour cette intervention</p>
              </div>
            ) : (
              <div>
                {invoices.map((invoice) => {
                  const statusInfo = getInvoiceStatusLabel(invoice.status, invoice.paidAt);
                  return (
                    <div key={invoice.id} style={documentRowStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Receipt size={20} color="#F59E0B" />
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>
                            {invoice.invoiceNumber || `Facture #${invoice.id.slice(0, 8)}`}
                          </p>
                          <p style={{ fontSize: "12px", color: "#6B7280", margin: "2px 0 0" }}>
                            {formatCurrency(invoice.totalIncl)} TTC
                            {invoice.paidAt ? ` - Payee le ${formatDate(invoice.paidAt)}` : invoice.issuedAt ? ` - Emise le ${formatDate(invoice.issuedAt)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "100px",
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                        <Link href={`/factures/${invoice.id}`}>
                          <button style={{ ...buttonSecondary, padding: "6px 10px" }}>
                            <Eye size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, "_blank")}
                          style={{ ...buttonSecondary, padding: "6px 10px" }}
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Tab bar */}
      <div style={tabBarStyle}>
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={tabStyle(isActive, tab.status)}
            >
              <TabIcon size={compact ? 14 : 16} />
              {!compact && <span>{tab.label}</span>}
              {tab.status && tab.status !== "pending" && (
                <span style={statusDotStyle(tab.status)} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={contentStyle}>
        {renderTabContent()}
      </div>
    </div>
  );
}

/**
 * Helper to determine tab status from intervention data
 */
export function getTabStatuses(data: {
  intakeCompletedAt?: Date;
  devisStatus?: "none" | "draft" | "sent" | "signed";
  orStatus?: "none" | "draft" | "sent" | "signed";
  apiStatus: "DRAFT" | "OPEN" | "DONE" | "CANCELED";
  deliveryCompletedAt?: Date;
  factureStatus?: "none" | "draft" | "issued" | "paid";
}): {
  reception: "completed" | "in_progress" | "pending";
  devis: "completed" | "in_progress" | "pending";
  or: "completed" | "in_progress" | "pending";
  travaux: "completed" | "in_progress" | "pending";
  restitution: "completed" | "in_progress" | "pending";
  facture: "completed" | "in_progress" | "pending";
} {
  const {
    intakeCompletedAt,
    devisStatus = "none",
    orStatus = "none",
    apiStatus,
    deliveryCompletedAt,
    factureStatus = "none",
  } = data;

  return {
    reception: intakeCompletedAt ? "completed" : "in_progress",
    devis:
      devisStatus === "signed"
        ? "completed"
        : devisStatus === "sent" || devisStatus === "draft"
        ? "in_progress"
        : "pending",
    or:
      orStatus === "signed"
        ? "completed"
        : orStatus === "sent" || orStatus === "draft"
        ? "in_progress"
        : "pending",
    travaux:
      apiStatus === "DONE"
        ? "completed"
        : apiStatus === "OPEN"
        ? "in_progress"
        : "pending",
    restitution:
      deliveryCompletedAt
        ? "completed"
        : apiStatus === "DONE"
        ? "in_progress"
        : "pending",
    facture:
      factureStatus === "paid"
        ? "completed"
        : factureStatus === "issued" || factureStatus === "draft"
        ? "in_progress"
        : "pending",
  };
}
