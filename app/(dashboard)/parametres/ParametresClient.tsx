"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  Crown,
  Gift,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { ComplianceToggles } from "@/components/parametres/ComplianceToggles";
import { BrandingSettings } from "@/components/parametres/BrandingSettings";

// ============================================================================
// PARAMÈTRES PAGE - SafeMotor Design System
// ============================================================================

type GarageInfo = {
  id?: number | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  status?: "PENDING" | "ACTIVE" | "REJECTED" | string | null;
  logoKey?: string | null;
} | null;

type TabKey = "garage" | "users" | "security" | "notifications" | "abonnement";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "garage", label: "Garage", icon: Building2 },
  { key: "users", label: "Utilisateurs", icon: Users },
  { key: "security", label: "Sécurité", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "abonnement", label: "Abonnement", icon: CreditCard },
];

export function ParametresClient({
  role,
  userEmail,
  garage,
  hasBrandingFeature = false,
  planName = "Essai",
}: {
  role: "ADMIN" | "GARAGE" | string;
  userEmail: string;
  garage: GarageInfo;
  hasBrandingFeature?: boolean;
  planName?: string;
}) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabKey | null;
  const [tab, setTab] = useState<TabKey>(
    tabFromUrl && TABS.some((t) => t.key === tabFromUrl) ? tabFromUrl : "garage"
  );

  const roleLabel = role === "ADMIN" ? "Administrateur" : "Garage";

  const statusConfig = useMemo(() => {
    if (role === "ADMIN") return { label: "Administration", bg: "#EEF2FF", text: "#6366F1" };
    if (garage?.status === "ACTIVE") return { label: "Actif", bg: "#ECFDF5", text: "#10B981" };
    if (garage?.status === "REJECTED") return { label: "Refusé", bg: "#FEF2F2", text: "#EF4444" };
    if (garage?.status === "PENDING") return { label: "En attente", bg: "#FFFBEB", text: "#B45309" };
    return { label: "—", bg: "#F3F4F6", text: "#6B7280" };
  }, [garage?.status, role]);

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#111827",
          margin: 0,
          marginBottom: "4px",
        }}>
          Paramètres
        </h1>
        <p style={{
          fontSize: "15px",
          color: "#6B7280",
          margin: 0,
        }}>
          Gérez les informations de votre garage et vos préférences
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "4px",
        padding: "4px",
        backgroundColor: "#F3F4F6",
        borderRadius: "12px",
        marginBottom: "32px",
        width: "fit-content",
      }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: tab === key ? "#FFFFFF" : "#6B7280",
              background: tab === key ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "transparent",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: tab === key ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Garage Tab */}
      {tab === "garage" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "24px",
        }}>
          {/* Profile Card */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "24px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
              marginBottom: "24px",
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Building2 size={28} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <h2 style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                  }}>
                    {role === "ADMIN" ? "Administration" : garage?.name ?? "Garage"}
                  </h2>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "#EEF2FF",
                    color: "#6366F1",
                  }}>
                    {roleLabel}
                  </span>
                </div>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: statusConfig.bg,
                  color: statusConfig.text,
                }}>
                  <CheckCircle size={12} />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <InfoRow icon={Mail} label="Email" value={garage?.email ?? userEmail} />
              <InfoRow icon={Phone} label="Téléphone" value={garage?.phone || "Non renseigné"} />
              <InfoRow icon={MapPin} label="Adresse" value={garage?.address || "Non renseignée"} />
              <InfoRow icon={Settings} label="SIRET" value={garage?.siret || "Non renseigné"} mono />
            </div>

            <div style={{
              marginTop: "24px",
              paddingTop: "24px",
              borderTop: "1px solid #E5E7EB",
            }}>
              <button type="button" style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                cursor: "pointer",
              }}>
                Modifier les informations
              </button>
            </div>
          </div>

          {/* Compliance Summary */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "24px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Shield size={22} color="#10B981" />
              </div>
              <div>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                }}>
                  Conformité
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  margin: 0,
                }}>
                  État de vos paramètres de sécurité
                </p>
              </div>
            </div>

            <div style={{
              padding: "16px",
              borderRadius: "12px",
              background: "#ECFDF5",
              marginBottom: "16px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#10B981",
              }}>
                <CheckCircle size={18} />
                <span style={{ fontWeight: 500 }}>Conformité active</span>
              </div>
              <p style={{
                fontSize: "13px",
                color: "#6B7280",
                margin: "8px 0 0",
              }}>
                Vos paramètres de sécurité sont correctement configurés pour la
                traçabilité et la génération de preuves.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setTab("security")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#6B7280",
                background: "transparent",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              <Lock size={18} />
              Voir les paramètres de sécurité
            </button>
          </div>

          {/* Branding Card - WHITE-LABEL-PARTNERS-01 */}
          <BrandingSettings
            garageId={garage?.id ?? null}
            currentLogoKey={garage?.logoKey ?? null}
            hasBrandingFeature={hasBrandingFeature}
            planName={planName}
          />
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          padding: "48px",
          textAlign: "center",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 16px",
            borderRadius: "16px",
            background: "#F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Users size={28} color="#9CA3AF" />
          </div>
          <h3 style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            margin: "0 0 8px",
          }}>
            Gestion des utilisateurs
          </h3>
          <p style={{
            fontSize: "14px",
            color: "#6B7280",
            margin: "0 0 24px",
            maxWidth: "400px",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Invitez des membres de votre équipe et gérez leurs accès.
            <br />
            Fonctionnalité disponible avec le plan Pro.
          </p>
          <button type="button" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#fff",
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
          }}>
            Passer à Pro
          </button>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "24px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "24px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Shield size={22} color="#6366F1" />
              </div>
              <div>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                }}>
                  Assurance & Traçabilité
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  margin: 0,
                }}>
                  Paramètres de conformité
                </p>
              </div>
            </div>

            <ComplianceToggles />

            <div style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "12px",
              background: "#ECFDF5",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#10B981",
              }}>
                <CheckCircle size={16} />
                <span style={{ fontSize: "14px", fontWeight: 500 }}>Conformité active</span>
              </div>
            </div>
          </div>

          <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "24px",
          }}>
            <h3 style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 16px",
            }}>
              Bonnes pratiques
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                "Conservez les preuves et révisions pour chaque dossier.",
                "Générez un PDF après validation du client.",
                "Activez les alertes pour les dossiers critiques.",
                "Effectuez des sauvegardes régulières.",
              ].map((tip, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  fontSize: "14px",
                }}>
                  <div style={{
                    marginTop: "6px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#6366F1",
                    flexShrink: 0,
                  }} />
                  <span style={{ color: "#6B7280" }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === "notifications" && <NotificationsPanel />}

      {/* Abonnement Tab */}
      {tab === "abonnement" && <AbonnementPanel role={role} />}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
    }}>
      <Icon size={18} color="#9CA3AF" />
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}>
        <span style={{ fontSize: "14px", color: "#6B7280" }}>{label}</span>
        <span style={{
          fontSize: "14px",
          color: "#111827",
          fontFamily: mono ? "monospace" : "inherit",
        }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const [settings, setSettings] = useState({
    signatureReminders: true,
    quoteReminders: false,
    invoiceReminders: false,
    quotaAlerts: true,
    appointmentsReminders: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings/notifications");
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data) {
            setSettings({
              signatureReminders: json.data.signatureReminders ?? true,
              quoteReminders: json.data.quoteReminders ?? false,
              invoiceReminders: json.data.invoiceReminders ?? false,
              quotaAlerts: json.data.quotaAlerts ?? true,
              appointmentsReminders: json.data.appointmentsReminders ?? false,
            });
          }
        }
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    const prevSettings = { ...settings };
    setSettings({ ...settings, [key]: value });
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        throw new Error("Erreur de sauvegarde");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSettings(prevSettings);
      setError("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: "500px",
      }}>
        <Loader2 size={24} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff",
      borderRadius: "16px",
      border: "1px solid #E5E7EB",
      padding: "24px",
      maxWidth: "500px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px",
      }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: "#EEF2FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Bell size={22} color="#6366F1" />
        </div>
        <div>
          <h3 style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#111827",
            margin: 0,
          }}>
            Relances automatiques
          </h3>
          <p style={{
            fontSize: "13px",
            color: "#6B7280",
            margin: 0,
          }}>
            Gérez les emails de relance envoyés automatiquement
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <ToggleRow
          checked={settings.signatureReminders}
          onChange={(v) => updateSetting("signatureReminders", v)}
          label="Relances signature"
          description="Rappel automatique J+1 et J+3 si signature en attente"
        />
        <ToggleRow
          checked={settings.quoteReminders}
          onChange={(v) => updateSetting("quoteReminders", v)}
          label="Relances devis"
          description="Rappel automatique J+2 et J+7 si devis non accepté"
        />
        <ToggleRow
          checked={settings.invoiceReminders}
          onChange={(v) => updateSetting("invoiceReminders", v)}
          label="Relances factures"
          description="Rappel automatique J+7 et J+14 si facture impayée"
        />
        <ToggleRow
          checked={settings.appointmentsReminders}
          onChange={(v) => updateSetting("appointmentsReminders", v)}
          label="Rappels RDV"
          description="Rappel automatique J-1 et H-2 avant un rendez-vous"
        />
        
        <div style={{
          borderTop: "1px solid #E5E7EB",
          paddingTop: "12px",
          marginTop: "8px",
        }}>
          <ToggleRow
            checked={settings.quotaAlerts}
            onChange={(v) => updateSetting("quotaAlerts", v)}
            label="Alertes quotas"
            description="Notification quand vous atteignez 80% de vos quotas"
          />
        </div>
      </div>

      <div style={{
        marginTop: "24px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        {saving && (
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "#9CA3AF",
          }}>
            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Enregistrement...
          </span>
        )}
        {saved && (
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "#10B981",
          }}>
            <CheckCircle size={12} /> Enregistré
          </span>
        )}
        {error && (
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "#EF4444",
          }}>
            <AlertTriangle size={12} /> {error}
          </span>
        )}
      </div>

      <p style={{
        marginTop: "16px",
        fontSize: "12px",
        color: "#9CA3AF",
      }}>
        Les relances sont envoyées uniquement si le client a une adresse email valide.
        Max 50 emails automatiques par jour.
      </p>
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "12px",
        borderRadius: "10px",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onClick={() => onChange(!checked)}
      onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{label}</div>
        {description && (
          <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        style={{
          position: "relative",
          width: "44px",
          height: "24px",
          borderRadius: "12px",
          border: "none",
          background: checked ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#E5E7EB",
          cursor: "pointer",
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute",
          top: "2px",
          left: checked ? "22px" : "2px",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s ease",
        }} />
      </button>
    </div>
  );
}

// Types for billing
type BillingStatus = {
  plan: "FREE" | "STARTER" | "PRO" | "ADMIN";
  status: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  trialDaysLeft: number | null;
  hasPaymentMethod: boolean;
  hasSubscription: boolean;
  canManageBilling: boolean;
};

type BillingPeriod = "monthly" | "yearly";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Actif", color: "#10B981" },
  TRIALING: { label: "Période d'essai", color: "#3B82F6" },
  PAST_DUE: { label: "Paiement en retard", color: "#F59E0B" },
  CANCELED: { label: "Annulé", color: "#EF4444" },
  UNPAID: { label: "Impayé", color: "#EF4444" },
  INCOMPLETE: { label: "Incomplet", color: "#9CA3AF" },
  INCOMPLETE_EXPIRED: { label: "Expiré", color: "#9CA3AF" },
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function AbonnementPanel({ role }: { role: string }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      const json = await res.json();
      if (json.ok && json.data) {
        setStatus(json.data);
      } else {
        setError(json.error?.message || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleCheckout = async (priceKey: string) => {
    try {
      setError(null);
      setActionLoading(priceKey);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceKey }),
      });
      const json = await res.json();
      if (json.ok && json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error?.message || "Erreur lors de la création du checkout");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortal = async () => {
    try {
      setError(null);
      setActionLoading("portal");
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (json.ok && json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error?.message || "Erreur lors de l'ouverture du portail");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  // Admin users
  if (role === "ADMIN") {
    return (
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "48px",
        textAlign: "center",
        maxWidth: "500px",
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          margin: "0 auto 16px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Shield size={28} color="#fff" />
        </div>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#111827",
          margin: "0 0 8px",
        }}>
          Compte Administrateur
        </h2>
        <p style={{
          fontSize: "14px",
          color: "#6B7280",
          margin: 0,
        }}>
          Les comptes administrateurs ont un accès complet sans abonnement.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "300px",
      }}>
        <Loader2 size={40} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const isActive = status?.status === "ACTIVE" || status?.status === "TRIALING";
  const isPro = status?.plan === "PRO";
  const isStarter = status?.plan === "STARTER";
  const isPaid = isPro || isStarter;
  const statusInfo = STATUS_LABELS[status?.status ?? ""] || { label: status?.status || "Inconnu", color: "#9CA3AF" };
  const planName = status?.plan === "PRO" ? "Pro" : status?.plan === "STARTER" ? "Starter" : "Gratuit";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Error Banner */}
      {error && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px",
          borderRadius: "12px",
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          color: "#EF4444",
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#EF4444",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Current Status Card */}
      {status && (
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          padding: "24px",
        }}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: isPaid
                  ? (isPro ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)")
                  : "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {isPro ? (
                  <Crown size={28} color="#fff" />
                ) : isStarter ? (
                  <Sparkles size={28} color="#fff" />
                ) : (
                  <Rocket size={28} color="#9CA3AF" />
                )}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}>
                    Plan {planName}
                  </h2>
                  {status.hasSubscription && (
                    <span style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: statusInfo.color,
                    }}>
                      • {statusInfo.label}
                      {status.trialDaysLeft !== null && status.trialDaysLeft > 0 && (
                        <> ({status.trialDaysLeft} jour{status.trialDaysLeft > 1 ? "s" : ""} restant{status.trialDaysLeft > 1 ? "s" : ""})</>
                      )}
                    </span>
                  )}
                </div>
                {status.status === "TRIALING" && status.trialEnd && (
                  <p style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#3B82F6",
                    margin: "4px 0 0",
                  }}>
                    <Gift size={14} />
                    Essai gratuit jusqu'au {formatDate(status.trialEnd)}
                  </p>
                )}
                {status.currentPeriodEnd && isActive && status.status !== "TRIALING" && (
                  <p style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#6B7280",
                    margin: "4px 0 0",
                  }}>
                    <Calendar size={14} />
                    Renouvellement le {formatDate(status.currentPeriodEnd)}
                  </p>
                )}
                {!status.hasSubscription && (
                  <p style={{
                    fontSize: "14px",
                    color: "#6B7280",
                    margin: "4px 0 0",
                  }}>
                    Passez à un plan payant pour débloquer toutes les fonctionnalités
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {status.canManageBilling && (
                <button
                  type="button"
                  onClick={handlePortal}
                  disabled={!!actionLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "10px",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    opacity: actionLoading ? 0.5 : 1,
                  }}
                >
                  {actionLoading === "portal" ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  Gérer l'abonnement
                </button>
              )}
              <button
                type="button"
                onClick={() => void loadStatus()}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                <RefreshCw size={16} color="#6B7280" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      {(!isPaid || !isActive) && (
        <>
          <h2 style={{
            textAlign: "center",
            fontSize: "20px",
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}>
            Choisissez votre formule
          </h2>

          {/* Billing Period Toggle */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}>
            <button
              onClick={() => setBillingPeriod("monthly")}
              style={{
                padding: "10px 16px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                background: billingPeriod === "monthly" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6",
                color: billingPeriod === "monthly" ? "#fff" : "#6B7280",
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                background: billingPeriod === "yearly" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6",
                color: billingPeriod === "yearly" ? "#fff" : "#6B7280",
              }}
            >
              Annuel
              <span style={{
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                background: "#10B981",
                color: "#fff",
              }}>
                -17%
              </span>
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
          }}>
            {/* FREE CARD */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}>
                <Rocket size={24} color="#9CA3AF" />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Gratuit</h3>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>Pour démarrer</p>
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "32px", fontWeight: 700, color: "#111827" }}>0€</span>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>/mois</span>
              </div>
              <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                <FeatureItem text="5 véhicules max" />
                <FeatureItem text="10 interventions/mois" />
                <FeatureItem text="Export PDF basique" />
                <FeatureItem text="Support email" />
              </ul>
              <button type="button" disabled style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#6B7280",
                background: "#F3F4F6",
                border: "none",
                borderRadius: "12px",
                cursor: "not-allowed",
              }}>
                {status?.plan === "FREE" ? "Plan actuel" : "Plan de base"}
              </button>
            </div>

            {/* STARTER CARD */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}>
                <Sparkles size={24} color="#fff" />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Starter</h3>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>Pour les indépendants</p>
              <div style={{ marginBottom: "16px" }}>
                {billingPeriod === "monthly" ? (
                  <>
                    <span style={{ fontSize: "32px", fontWeight: 700, color: "#111827" }}>49€</span>
                    <span style={{ fontSize: "14px", color: "#6B7280" }}>/mois</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "32px", fontWeight: 700, color: "#111827" }}>490€</span>
                    <span style={{ fontSize: "14px", color: "#6B7280" }}>/an</span>
                    <p style={{ fontSize: "14px", color: "#10B981", margin: "4px 0 0" }}>Soit 40€/mois</p>
                  </>
                )}
              </div>
              <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                <FeatureItem text="50 véhicules" color="#3B82F6" />
                <FeatureItem text="Interventions illimitées" color="#3B82F6" />
                <FeatureItem text="Statistiques de base" icon={Zap} color="#3B82F6" />
                <FeatureItem text="14 jours d'essai" icon={Gift} color="#3B82F6" />
              </ul>
              <button
                type="button"
                onClick={() => handleCheckout(billingPeriod === "monthly" ? "STARTER_MONTHLY" : "STARTER_YEARLY")}
                disabled={!!actionLoading}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#374151",
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading === "STARTER_MONTHLY" || actionLoading === "STARTER_YEARLY" ? 0.5 : 1,
                }}
              >
                {actionLoading === "STARTER_MONTHLY" || actionLoading === "STARTER_YEARLY" ? (
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  "S'abonner"
                )}
              </button>
            </div>

            {/* PRO CARD */}
            <div style={{
              position: "relative",
              background: "linear-gradient(to bottom right, #EEF2FF, rgba(139, 92, 246, 0.1))",
              borderRadius: "16px",
              border: "2px solid #6366F1",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
              }}>
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  color: "#fff",
                }}>
                  <Star size={12} />
                  Recommandé
                </span>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}>
                <Crown size={24} color="#fff" />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Pro</h3>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>Pour les professionnels</p>
              <div style={{ marginBottom: "16px" }}>
                {billingPeriod === "monthly" ? (
                  <>
                    <span style={{ fontSize: "32px", fontWeight: 700, color: "#111827" }}>129€</span>
                    <span style={{ fontSize: "14px", color: "#6B7280" }}>/mois</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "32px", fontWeight: 700, color: "#111827" }}>1290€</span>
                    <span style={{ fontSize: "14px", color: "#6B7280" }}>/an</span>
                    <p style={{ fontSize: "14px", color: "#10B981", margin: "4px 0 0" }}>Soit 107€/mois</p>
                  </>
                )}
              </div>
              <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                <FeatureItem text="Véhicules illimités" color="#6366F1" />
                <FeatureItem text="Interventions illimitées" color="#6366F1" />
                <FeatureItem text="Statistiques avancées" icon={Zap} color="#6366F1" />
                <FeatureItem text="Multi-utilisateurs" icon={Users} color="#6366F1" />
                <FeatureItem text="14 jours d'essai" icon={Gift} color="#6366F1" />
              </ul>
              <button
                type="button"
                onClick={() => handleCheckout(billingPeriod === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY")}
                disabled={!!actionLoading || (status?.plan === "PRO" && isActive)}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#fff",
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  border: "none",
                  borderRadius: "12px",
                  cursor: (actionLoading || (status?.plan === "PRO" && isActive)) ? "not-allowed" : "pointer",
                  opacity: actionLoading === "PRO_MONTHLY" || actionLoading === "PRO_YEARLY" ? 0.5 : 1,
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                }}
              >
                {actionLoading === "PRO_MONTHLY" || actionLoading === "PRO_YEARLY" ? (
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                ) : status?.plan === "PRO" && isActive ? (
                  "Plan actuel"
                ) : (
                  "S'abonner"
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Trust Badges */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        fontSize: "14px",
        color: "#6B7280",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Shield size={18} color="#10B981" />
          Paiement sécurisé Stripe
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Zap size={18} color="#F59E0B" />
          Activation instantanée
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle size={18} color="#10B981" />
          Annulation en 1 clic
        </span>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{
          textAlign: "center",
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          margin: "0 0 16px",
        }}>
          Questions fréquentes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            {
              q: "Puis-je annuler à tout moment ?",
              a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis le portail Stripe. Aucun engagement.",
            },
            {
              q: "L'essai gratuit est-il vraiment gratuit ?",
              a: "Absolument ! Vous avez 14 jours pour tester toutes les fonctionnalités sans aucun paiement.",
            },
            {
              q: "Quelle est la différence entre Starter et Pro ?",
              a: "Starter est limité à 50 véhicules et offre des statistiques de base. Pro offre un accès illimité, les statistiques avancées, le multi-utilisateurs et un support prioritaire.",
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              padding: "16px",
            }}>
              <h3 style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#111827",
                margin: 0,
              }}>
                {item.q}
              </h3>
              <p style={{
                fontSize: "14px",
                color: "#6B7280",
                margin: "8px 0 0",
              }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

function FeatureItem({
  text,
  icon: Icon = CheckCircle,
  color = "#10B981",
}: {
  text: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
}) {
  return (
    <li style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      color: "#6B7280",
    }}>
      <Icon size={16} color={color} />
      {text}
    </li>
  );
}
