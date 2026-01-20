"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Crown,
  Rocket,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Star,
  Users,
  TrendingUp,
  Headphones,
  Gift,
  CreditCard,
  Calendar,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Info,
  Car,
  Brain,
  FileSignature,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user-context";

type QuotaUsage = {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
};

type BillingStatus = {
  plan: "FREE" | "STARTER" | "PRO" | "ADMIN";
  status: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  trialDaysLeft: number | null;
  hasPaymentMethod: boolean;
  hasSubscription: boolean;
  canManageBilling: boolean;
  referralRewardMonths: number;
  pendingReferralMonthsApplied: number | null;
  // Quotas
  quotaUsage?: Record<string, QuotaUsage>;
  limits?: {
    clients: number | null;
    vehicules: number | null;
    interventionsPerWeek: number | null;
    users: number;
  };
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Actif", color: "text-green-600" },
  TRIALING: { label: "Période d'essai", color: "text-blue-600" },
  PAST_DUE: { label: "Paiement en retard", color: "text-orange-600" },
  CANCELED: { label: "Annulé", color: "text-red-600" },
  UNPAID: { label: "Impayé", color: "text-red-600" },
  INCOMPLETE: { label: "Incomplet", color: "text-gray-600" },
  INCOMPLETE_EXPIRED: { label: "Expiré", color: "text-gray-600" },
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

type BillingPeriod = "monthly" | "yearly";

// Component to display quota usage with progress bar
function QuotaProgress({ 
  label, 
  icon: Icon,
  usage 
}: { 
  label: string; 
  icon: React.ComponentType<{ size?: number; className?: string }>;
  usage?: QuotaUsage;
}) {
  if (!usage) return null;
  
  const { used, limit, remaining, unlimited } = usage;
  
  // Calculate percentage (cap at 100%)
  const percentage = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  
  // Determine color based on usage
  let colorClass = "bg-green-500";
  if (!unlimited) {
    if (percentage >= 90) colorClass = "bg-red-500";
    else if (percentage >= 70) colorClass = "bg-orange-500";
    else if (percentage >= 50) colorClass = "bg-yellow-500";
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon size={16} className="text-muted2" />
          {label}
        </div>
        <span className="text-sm text-muted2">
          {unlimited ? (
            <span className="text-green-600">Illimité</span>
          ) : (
            <>
              <span className="font-medium text-foreground">{used}</span>
              <span className="text-muted2"> / {limit}</span>
              <span className="ml-2 text-xs">
                ({remaining} restant{remaining > 1 ? "s" : ""})
              </span>
            </>
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const user = useUser();
  const searchParams = useSearchParams();
  const upgradeRequired = searchParams.get("upgrade") === "required";
  const fromPage = searchParams.get("from");
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUpgradeNotice, setShowUpgradeNotice] = useState(upgradeRequired);
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

  // Admin users see a special message
  if (user.role === "ADMIN") {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <SectionHeader
          title="Facturation"
          description="Gestion des abonnements"
        />
        <Card className="p-8 text-center">
          <Shield size={48} className="mx-auto mb-4 text-indigo-600" />
          <h2 className="text-xl font-semibold">Compte Administrateur</h2>
          <p className="mt-2 text-muted2">
            Les comptes administrateurs ont un accès complet sans abonnement.
          </p>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const isActive = status?.status === "ACTIVE" || status?.status === "TRIALING";
  const isPro = status?.plan === "PRO";
  const isStarter = status?.plan === "STARTER";
  const isPaid = isPro || isStarter;
  const statusInfo = STATUS_LABELS[status?.status ?? ""] || { label: status?.status || "Inconnu", color: "text-gray-600" };
  
  // Nom du plan pour l'affichage
  const planName = status?.plan === "PRO" ? "Pro" : status?.plan === "STARTER" ? "Starter" : "Gratuit";

  return (
    <div className="mx-auto max-w-6xl py-8">
      <SectionHeader
        title="Facturation"
        description="Gérez votre abonnement SafeMotor"
        action={
          status?.canManageBilling ? (
            <Button
              variant="secondary"
              onClick={handlePortal}
              disabled={actionLoading === "portal"}
            >
              {actionLoading === "portal" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ExternalLink size={16} />
              )}
              Portail Stripe
            </Button>
          ) : null
        }
      />

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upgrade Required Banner */}
      {showUpgradeNotice && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-indigo-700">
          <Info size={20} />
          <div className="flex-1">
            <p className="font-medium">Abonnement requis</p>
            <p className="text-sm text-indigo-600">
              Pour accéder à {fromPage ? `"${fromPage}"` : "cette fonctionnalité"}, vous devez passer à un plan payant.
            </p>
          </div>
          <button
            onClick={() => setShowUpgradeNotice(false)}
            className="text-indigo-500 hover:text-indigo-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Referral Reward Banner */}
      {status && status.referralRewardMonths > 0 && !status.pendingReferralMonthsApplied && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          <Gift size={20} />
          <div className="flex-1">
            <p className="font-medium">
              🎁 Vous avez {status.referralRewardMonths} mois offert{status.referralRewardMonths > 1 ? "s" : ""} !
            </p>
            <p className="text-sm text-green-600">
              Récompense de parrainage — Elle sera appliquée automatiquement lors de votre prochain abonnement.
            </p>
          </div>
        </div>
      )}

      {/* Pending Coupon Banner */}
      {status && status.pendingReferralMonthsApplied && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
          <Gift size={20} />
          <div className="flex-1">
            <p className="font-medium">
              Remise en attente d&apos;activation
            </p>
            <p className="text-sm text-amber-600">
              {status.pendingReferralMonthsApplied} mois offert{status.pendingReferralMonthsApplied > 1 ? "s" : ""} sera appliqué{status.pendingReferralMonthsApplied > 1 ? "s" : ""} dès la confirmation de votre abonnement.
            </p>
          </div>
        </div>
      )}

      {/* Current Status Card */}
      {status && (
        <Card className="mb-8 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${isPaid ? (isPro ? "bg-gradient-to-br from-indigo-500 to-purple-500" : "bg-gradient-to-br from-blue-400 to-blue-600") : "bg-gray-100"}`}>
                {isPro ? (
                  <Crown size={28} className="text-white" />
                ) : isStarter ? (
                  <Sparkles size={28} className="text-white" />
                ) : (
                  <Rocket size={28} className="text-gray-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">
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
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted2">
                    <Calendar size={14} />
                    Renouvellement le {formatDate(status.currentPeriodEnd)}
                  </p>
                )}
                {!status.hasSubscription && (
                  <p className="mt-1 text-sm text-muted2">
                    Passez à un plan payant pour débloquer toutes les fonctionnalités
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {status.canManageBilling && (
                <Button
                  variant="secondary"
                  onClick={handlePortal}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "portal" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  Gérer l'abonnement
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => void loadStatus()}
                disabled={loading}
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quota Usage Section - Always show if we have status */}
      {status && status.quotaUsage && (
        <Card className="mb-8 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <TrendingUp size={20} className="text-indigo-600" />
            Consommation du mois
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <QuotaProgress
              label="Recherches plaques"
              icon={Car}
              usage={status.quotaUsage.vehicleLookupPerMonth}
            />
            <QuotaProgress
              label="Assistants IA"
              icon={Brain}
              usage={status.quotaUsage.aiRequestsPerMonth}
            />
            <QuotaProgress
              label="Signatures électroniques"
              icon={FileSignature}
              usage={status.quotaUsage.signaturesPerMonth}
            />
          </div>
          <p className="mt-4 text-xs text-muted2">
            Les quotas sont réinitialisés le 1er de chaque mois.
          </p>
        </Card>
      )}

      {/* Pricing Section - Show if not paid or not active */}
      {(!isPaid || !isActive) && (
        <>
          <h2 className="mb-4 text-center text-2xl font-bold">Choisissez votre formule</h2>
          
          {/* Billing Period Toggle */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                billingPeriod === "yearly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Annuel
              <span className="rounded bg-green-500 px-2 py-0.5 text-xs text-white">
                -17%
              </span>
            </button>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* FREE CARD */}
            <Card className="flex flex-col p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <Rocket size={24} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-bold">Gratuit</h3>
              <p className="mt-1 text-sm text-muted2">Pour démarrer</p>
              <div className="my-4">
                <span className="text-3xl font-bold">0€</span>
                <span className="text-muted2">/mois</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />5 véhicules max
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />10 interventions/mois
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />Export PDF basique
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />Support email
                </li>
              </ul>
              <Button variant="secondary" disabled>
                {status?.plan === "FREE" ? "Plan actuel" : "Plan de base"}
              </Button>
            </Card>

            {/* STARTER CARD */}
            <Card className="flex flex-col p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600">
                <Sparkles size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Starter</h3>
              <p className="mt-1 text-sm text-muted2">Pour les indépendants</p>
              <div className="my-4">
                {billingPeriod === "monthly" ? (
                  <>
                    <span className="text-3xl font-bold">49€</span>
                    <span className="text-muted2">/mois</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold">490€</span>
                    <span className="text-muted2">/an</span>
                    <p className="text-sm text-green-600">Soit 40€/mois</p>
                  </>
                )}
              </div>
              <ul className="mb-6 flex-1 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-blue-600" />50 véhicules
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-blue-600" />Interventions illimitées
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />Statistiques de base
                </li>
                <li className="flex items-center gap-2">
                  <Gift size={16} className="text-blue-600" />14 jours d'essai
                </li>
              </ul>
              <Button
                variant="secondary"
                onClick={() => handleCheckout(billingPeriod === "monthly" ? "STARTER_MONTHLY" : "STARTER_YEARLY")}
                disabled={!!actionLoading}
              >
                {actionLoading === "STARTER_MONTHLY" || actionLoading === "STARTER_YEARLY" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "S'abonner"
                )}
              </Button>
            </Card>

            {/* PRO CARD */}
            <Card className="relative flex flex-col border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold text-white">
                  <Star size={12} />
                  Recommandé
                </span>
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <Crown size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Pro</h3>
              <p className="mt-1 text-sm text-muted2">Pour les professionnels</p>
              <div className="my-4">
                {billingPeriod === "monthly" ? (
                  <>
                    <span className="text-3xl font-bold">129€</span>
                    <span className="text-muted2">/mois</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold">1290€</span>
                    <span className="text-muted2">/an</span>
                    <p className="text-sm text-green-600">Soit 107€/mois</p>
                  </>
                )}
              </div>
              <ul className="mb-6 flex-1 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-indigo-600" />Véhicules illimités
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-indigo-600" />Interventions illimitées
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-600" />Statistiques avancées
                </li>
                <li className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />Multi-utilisateurs
                </li>
                <li className="flex items-center gap-2">
                  <Headphones size={16} className="text-indigo-600" />Support prioritaire
                </li>
                <li className="flex items-center gap-2">
                  <Gift size={16} className="text-indigo-600" />14 jours d'essai
                </li>
              </ul>
              <Button
                onClick={() => handleCheckout(billingPeriod === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY")}
                disabled={!!actionLoading || (status?.plan === "PRO" && isActive)}
              >
                {actionLoading === "PRO_MONTHLY" || actionLoading === "PRO_YEARLY" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : status?.plan === "PRO" && isActive ? (
                  "Plan actuel"
                ) : (
                  "S'abonner"
                )}
              </Button>
            </Card>
          </div>
        </>
      )}

      {/* Trust Badges */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted2">
        <span className="flex items-center gap-2">
          <Shield size={18} className="text-green-500" />
          Paiement sécurisé Stripe
        </span>
        <span className="flex items-center gap-2">
          <Zap size={18} className="text-yellow-500" />
          Activation instantanée
        </span>
        <span className="flex items-center gap-2">
          <Check size={18} className="text-green-500" />
          Annulation en 1 clic
        </span>
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-6 text-center text-xl font-bold">Questions fréquentes</h2>
        <div className="space-y-4">
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
            {
              q: "Mes données sont-elles sécurisées ?",
              a: "Vos données sont chiffrées et sauvegardées automatiquement. Nous utilisons les mêmes standards que les banques.",
            },
          ].map((item, i) => (
            <Card key={i} className="p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm text-muted2">{item.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
