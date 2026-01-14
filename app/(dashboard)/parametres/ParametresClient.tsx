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

type GarageInfo = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  status?: "PENDING" | "ACTIVE" | "REJECTED" | string | null;
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
}: {
  role: "ADMIN" | "GARAGE" | string;
  userEmail: string;
  garage: GarageInfo;
}) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabKey | null;
  const [tab, setTab] = useState<TabKey>(
    tabFromUrl && TABS.some((t) => t.key === tabFromUrl) ? tabFromUrl : "garage"
  );

  const roleLabel = role === "ADMIN" ? "Administrateur" : "Garage";

  const statusConfig = useMemo(() => {
    if (role === "ADMIN") return { label: "Administration", bg: "var(--ms-primary-light)", text: "var(--ms-primary)" };
    if (garage?.status === "ACTIVE") return { label: "Actif", bg: "var(--ms-success-light)", text: "var(--ms-success)" };
    if (garage?.status === "REJECTED") return { label: "Refusé", bg: "var(--ms-error-light)", text: "var(--ms-error)" };
    if (garage?.status === "PENDING") return { label: "En attente", bg: "var(--ms-warning-light)", text: "#B45309" };
    return { label: "—", bg: "var(--ms-bg-subtle)", text: "var(--ms-text-secondary)" };
  }, [garage?.status, role]);

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="ms-page-title">Paramètres</h1>
        <p className="ms-page-subtitle">
          Gérez les informations de votre garage et vos préférences
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="ms-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`ms-tab ${tab === key ? "ms-tab-active" : ""}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Garage Tab */}
      {tab === "garage" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <div className="ms-card">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
                  <Building2 size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-[var(--ms-text)]">
                      {role === "ADMIN" ? "Administration" : garage?.name ?? "Garage"}
                    </h2>
                    <span
                      className="ms-badge"
                      style={{ background: "var(--ms-primary-light)", color: "var(--ms-primary)" }}
                    >
                      {roleLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="ms-badge"
                      style={{ background: statusConfig.bg, color: statusConfig.text }}
                    >
                      <CheckCircle size={12} />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <InfoRow icon={Mail} label="Email" value={garage?.email ?? userEmail} />
                <InfoRow icon={Phone} label="Téléphone" value={garage?.phone || "Non renseigné"} />
                <InfoRow icon={MapPin} label="Adresse" value={garage?.address || "Non renseignée"} />
                <InfoRow icon={Settings} label="SIRET" value={garage?.siret || "Non renseigné"} mono />
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--ms-border-light)]">
                <button type="button" className="ms-btn ms-btn-secondary">
                  Modifier les informations
                </button>
              </div>
            </div>
          </div>

          {/* Compliance Summary */}
          <div className="ms-card">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
                  <Shield size={22} className="text-[var(--ms-success)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ms-text)]">Conformité</h3>
                  <p className="text-sm text-[var(--ms-text-secondary)]">
                    État de vos paramètres de sécurité
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--ms-success-light)] mb-4">
                <div className="flex items-center gap-2 text-[var(--ms-success)]">
                  <CheckCircle size={18} />
                  <span className="font-medium">Conformité active</span>
                </div>
                <p className="text-sm text-[var(--ms-text-secondary)] mt-2">
                  Vos paramètres de sécurité sont correctement configurés pour la
                  traçabilité et la génération de preuves.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTab("security")}
                className="ms-btn ms-btn-ghost w-full"
              >
                <Lock size={18} />
                Voir les paramètres de sécurité
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="ms-card">
          <div className="ms-empty py-12">
            <div className="ms-empty-icon">
              <Users size={28} />
            </div>
            <div className="ms-empty-title">Gestion des utilisateurs</div>
            <div className="ms-empty-text">
              Invitez des membres de votre équipe et gérez leurs accès.
              <br />
              Fonctionnalité disponible avec le plan Pro.
            </div>
            <button type="button" className="ms-btn ms-btn-primary mt-4">
              Passer à Pro
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="ms-card">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
                  <Shield size={22} className="text-[var(--ms-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ms-text)]">
                    Assurance & Traçabilité
                  </h3>
                  <p className="text-sm text-[var(--ms-text-secondary)]">
                    Paramètres de conformité
                  </p>
                </div>
              </div>

              <ComplianceToggles />

              <div className="mt-6 p-4 rounded-xl bg-[var(--ms-success-light)]">
                <div className="flex items-center gap-2 text-[var(--ms-success)]">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Conformité active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ms-card">
            <div className="p-6">
              <h3 className="font-semibold text-[var(--ms-text)] mb-4">
                Bonnes pratiques
              </h3>
              <div className="space-y-3">
                {[
                  "Conservez les preuves et révisions pour chaque dossier.",
                  "Générez un PDF après validation du client.",
                  "Activez les alertes pour les dossiers critiques.",
                  "Effectuez des sauvegardes régulières.",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--ms-primary)] shrink-0" />
                    <span className="text-[var(--ms-text-secondary)]">{tip}</span>
                  </div>
                ))}
              </div>
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <Icon size={18} className="text-[var(--ms-text-muted)] shrink-0" />
      <div className="flex-1 flex items-center justify-between gap-4">
        <span className="text-sm text-[var(--ms-text-secondary)]">{label}</span>
        <span
          className={`text-sm text-[var(--ms-text)] ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const [mailOnCritical, setMailOnCritical] = useState(true);
  const [mailOnPdf, setMailOnPdf] = useState(false);
  const [digest, setDigest] = useState(false);

  return (
    <div className="ms-card max-w-lg">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
            <Bell size={22} className="text-[var(--ms-primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--ms-text)]">
              Préférences email
            </h3>
            <p className="text-sm text-[var(--ms-text-secondary)]">
              Gérez vos notifications
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleRow
            checked={mailOnCritical}
            onChange={setMailOnCritical}
            label="Alertes sur dossier critique"
            description="Recevez une notification pour les dossiers urgents"
          />
          <ToggleRow
            checked={mailOnPdf}
            onChange={setMailOnPdf}
            label="Confirmation génération PDF"
            description="Email de confirmation après chaque PDF généré"
          />
          <ToggleRow
            checked={digest}
            onChange={setDigest}
            label="Récapitulatif hebdomadaire"
            description="Résumé de l'activité chaque lundi"
          />
        </div>

        <p className="mt-6 text-xs text-[var(--ms-text-muted)]">
          Ces préférences sont enregistrées localement pour le moment.
        </p>
      </div>
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
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-[var(--ms-surface-hover)] transition-colors">
      <div>
        <div className="text-sm font-medium text-[var(--ms-text)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--ms-text-muted)] mt-0.5">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`ms-toggle ${checked ? "ms-toggle-active" : ""}`}
      >
        <span className="ms-toggle-knob" />
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
  ACTIVE: { label: "Actif", color: "text-[var(--ms-success)]" },
  TRIALING: { label: "Période d'essai", color: "text-blue-600" },
  PAST_DUE: { label: "Paiement en retard", color: "text-orange-600" },
  CANCELED: { label: "Annulé", color: "text-[var(--ms-error)]" },
  UNPAID: { label: "Impayé", color: "text-[var(--ms-error)]" },
  INCOMPLETE: { label: "Incomplet", color: "text-[var(--ms-text-muted)]" },
  INCOMPLETE_EXPIRED: { label: "Expiré", color: "text-[var(--ms-text-muted)]" },
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
    } catch (e) {
      console.error("Failed to load billing status:", e);
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
      <div className="ms-card max-w-lg">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
            <Shield size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--ms-text)]">Compte Administrateur</h2>
          <p className="mt-2 text-[var(--ms-text-secondary)]">
            Les comptes administrateurs ont un accès complet sans abonnement.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[var(--ms-primary)]" />
      </div>
    );
  }

  const isActive = status?.status === "ACTIVE" || status?.status === "TRIALING";
  const isPro = status?.plan === "PRO";
  const isStarter = status?.plan === "STARTER";
  const isPaid = isPro || isStarter;
  const statusInfo = STATUS_LABELS[status?.status ?? ""] || { label: status?.status || "Inconnu", color: "text-[var(--ms-text-muted)]" };
  const planName = status?.plan === "PRO" ? "Pro" : status?.plan === "STARTER" ? "Starter" : "Gratuit";

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--ms-error-light)] bg-[var(--ms-error-light)] p-4 text-[var(--ms-error)]">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Current Status Card */}
      {status && (
        <div className="ms-card">
          <div className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isPaid ? (isPro ? "bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]" : "bg-gradient-to-br from-blue-400 to-blue-600") : "bg-[var(--ms-bg-subtle)]"}`}>
                  {isPro ? (
                    <Crown size={28} className="text-white" />
                  ) : isStarter ? (
                    <Sparkles size={28} className="text-white" />
                  ) : (
                    <Rocket size={28} className="text-[var(--ms-text-muted)]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--ms-text)]">
                      Plan {planName}
                    </h2>
                    {status.hasSubscription && (
                      <span className={`text-sm font-medium ${statusInfo.color}`}>
                        • {statusInfo.label}
                        {status.trialDaysLeft !== null && status.trialDaysLeft > 0 && (
                          <> ({status.trialDaysLeft} jour{status.trialDaysLeft > 1 ? "s" : ""} restant{status.trialDaysLeft > 1 ? "s" : ""})</>
                        )}
                      </span>
                    )}
                  </div>
                  {status.status === "TRIALING" && status.trialEnd && (
                    <p className="mt-1 flex items-center gap-2 text-sm text-blue-600">
                      <Gift size={14} />
                      Essai gratuit jusqu'au {formatDate(status.trialEnd)}
                    </p>
                  )}
                  {status.currentPeriodEnd && isActive && status.status !== "TRIALING" && (
                    <p className="mt-1 flex items-center gap-2 text-sm text-[var(--ms-text-secondary)]">
                      <Calendar size={14} />
                      Renouvellement le {formatDate(status.currentPeriodEnd)}
                    </p>
                  )}
                  {!status.hasSubscription && (
                    <p className="mt-1 text-sm text-[var(--ms-text-secondary)]">
                      Passez à un plan payant pour débloquer toutes les fonctionnalités
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {status.canManageBilling && (
                  <button
                    type="button"
                    onClick={handlePortal}
                    disabled={!!actionLoading}
                    className="ms-btn ms-btn-secondary"
                  >
                    {actionLoading === "portal" ? (
                      <Loader2 size={16} className="animate-spin" />
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
                  className="ms-btn ms-btn-ghost"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      {(!isPaid || !isActive) && (
        <>
          <h2 className="text-center text-xl font-bold text-[var(--ms-text)]">Choisissez votre formule</h2>
          
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-[var(--ms-primary)] text-white"
                  : "bg-[var(--ms-bg-subtle)] text-[var(--ms-text-secondary)] hover:bg-[var(--ms-surface-hover)]"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                billingPeriod === "yearly"
                  ? "bg-[var(--ms-primary)] text-white"
                  : "bg-[var(--ms-bg-subtle)] text-[var(--ms-text-secondary)] hover:bg-[var(--ms-surface-hover)]"
              }`}
            >
              Annuel
              <span className="rounded bg-[var(--ms-success)] px-2 py-0.5 text-xs text-white">
                -17%
              </span>
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* FREE CARD */}
            <div className="ms-card flex flex-col">
              <div className="p-6 flex-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-bg-subtle)]">
                  <Rocket size={24} className="text-[var(--ms-text-muted)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--ms-text)]">Gratuit</h3>
                <p className="mt-1 text-sm text-[var(--ms-text-secondary)]">Pour démarrer</p>
                <div className="my-4">
                  <span className="text-3xl font-bold text-[var(--ms-text)]">0€</span>
                  <span className="text-[var(--ms-text-secondary)]">/mois</span>
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <CheckCircle size={16} className="text-[var(--ms-success)]" />5 véhicules max
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <CheckCircle size={16} className="text-[var(--ms-success)]" />10 interventions/mois
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <CheckCircle size={16} className="text-[var(--ms-success)]" />Export PDF basique
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <CheckCircle size={16} className="text-[var(--ms-success)]" />Support email
                  </li>
                </ul>
              </div>
              <div className="p-6 pt-0">
                <button type="button" className="ms-btn ms-btn-secondary w-full" disabled>
                  {status?.plan === "FREE" ? "Plan actuel" : "Plan de base"}
                </button>
              </div>
            </div>

            {/* STARTER CARD */}
            <div className="ms-card flex flex-col">
              <div className="p-6 flex-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[var(--ms-text)]">Starter</h3>
                <p className="mt-1 text-sm text-[var(--ms-text-secondary)]">Pour les indépendants</p>
                <div className="my-4">
                  {billingPeriod === "monthly" ? (
                    <>
                      <span className="text-3xl font-bold text-[var(--ms-text)]">49€</span>
                      <span className="text-[var(--ms-text-secondary)]">/mois</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-[var(--ms-text)]">490€</span>
                      <span className="text-[var(--ms-text-secondary)]">/an</span>
                      <p className="text-sm text-[var(--ms-success)]">Soit 40€/mois</p>
                    </>
                  )}
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <CheckCircle size={16} className="text-blue-600" />50 véhicules
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <CheckCircle size={16} className="text-blue-600" />Interventions illimitées
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <Zap size={16} className="text-blue-600" />Statistiques de base
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <Gift size={16} className="text-blue-600" />14 jours d'essai
                  </li>
                </ul>
              </div>
              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleCheckout(billingPeriod === "monthly" ? "STARTER_MONTHLY" : "STARTER_YEARLY")}
                  disabled={!!actionLoading}
                  className="ms-btn ms-btn-secondary w-full"
                >
                  {actionLoading === "STARTER_MONTHLY" || actionLoading === "STARTER_YEARLY" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "S'abonner"
                  )}
                </button>
              </div>
            </div>

            {/* PRO CARD */}
            <div className="ms-card relative flex flex-col border-2 border-[var(--ms-primary)]" style={{ background: "linear-gradient(to bottom right, var(--ms-primary-light), rgba(139, 92, 246, 0.1))" }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 rounded-full bg-[var(--ms-primary)] px-3 py-1 text-xs font-bold text-white">
                  <Star size={12} />
                  Recommandé
                </span>
              </div>
              <div className="p-6 flex-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
                  <Crown size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[var(--ms-text)]">Pro</h3>
                <p className="mt-1 text-sm text-[var(--ms-text-secondary)]">Pour les professionnels</p>
                <div className="my-4">
                  {billingPeriod === "monthly" ? (
                    <>
                      <span className="text-3xl font-bold text-[var(--ms-text)]">129€</span>
                      <span className="text-[var(--ms-text-secondary)]">/mois</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-[var(--ms-text)]">1290€</span>
                      <span className="text-[var(--ms-text-secondary)]">/an</span>
                      <p className="text-sm text-[var(--ms-success)]">Soit 107€/mois</p>
                    </>
                  )}
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <CheckCircle size={16} className="text-[var(--ms-primary)]" />Véhicules illimités
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <CheckCircle size={16} className="text-[var(--ms-primary)]" />Interventions illimitées
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <Zap size={16} className="text-[var(--ms-primary)]" />Statistiques avancées
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <Users size={16} className="text-[var(--ms-primary)]" />Multi-utilisateurs
                  </li>
                  <li className="flex items-center gap-2 text-[var(--ms-text-secondary)]">
                    <Gift size={16} className="text-[var(--ms-primary)]" />14 jours d'essai
                  </li>
                </ul>
              </div>
              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleCheckout(billingPeriod === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY")}
                  disabled={!!actionLoading || (status?.plan === "PRO" && isActive)}
                  className="ms-btn ms-btn-primary w-full"
                >
                  {actionLoading === "PRO_MONTHLY" || actionLoading === "PRO_YEARLY" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : status?.plan === "PRO" && isActive ? (
                    "Plan actuel"
                  ) : (
                    "S'abonner"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--ms-text-secondary)]">
        <span className="flex items-center gap-2">
          <Shield size={18} className="text-[var(--ms-success)]" />
          Paiement sécurisé Stripe
        </span>
        <span className="flex items-center gap-2">
          <Zap size={18} className="text-yellow-500" />
          Activation instantanée
        </span>
        <span className="flex items-center gap-2">
          <CheckCircle size={18} className="text-[var(--ms-success)]" />
          Annulation en 1 clic
        </span>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-center text-lg font-bold text-[var(--ms-text)]">Questions fréquentes</h2>
        <div className="space-y-3">
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
            <div key={i} className="ms-card">
              <div className="p-4">
                <h3 className="font-semibold text-[var(--ms-text)]">{item.q}</h3>
                <p className="mt-2 text-sm text-[var(--ms-text-secondary)]">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
