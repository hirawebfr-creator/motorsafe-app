"use client";

/**
 * BILLING-PAGE: Complete subscription & credits management
 * 
 * Features:
 * - Current plan display with status
 * - Credits overview (SIV, Storage, AI)
 * - Subscription plans (PRO, EXPERT, PREMIUM)
 * - Credit packs purchase (SIV, Storage)
 * - Stripe portal access
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import {
  Crown,
  Loader2,
  Shield,
  Check,
  AlertTriangle,
  ExternalLink,
  Info,
  HardDrive,
  Car,
  Brain,
  Users,
  Package,
  ChevronRight,
  Gift,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { 
  SUBSCRIPTION_PLANS, 
  SIV_PACKS, 
  STORAGE_PACKS,
  type PlanType,
} from "@/lib/stripe-products";

// ============================================================================
// Types
// ============================================================================

type BillingPeriod = "monthly" | "yearly";

interface CreditsData {
  plan: string;
  effectivePlan: string;
  subscriptionStatus: string;
  siv: {
    includedInPlan: number;
    usedThisMonth: number;
    remainingFromPlan: number;
    extraCredits: number;
    totalRemaining: number;
    monthKey: string;
  };
  storage: {
    includedGB: number;
    extraGB: number;
    totalGB: number;
    usedGB: number;
    remainingGB: number;
    usedPercent: number;
  };
  ai: {
    includedPerMonth: number;
    usedThisMonth: number;
    remainingThisMonth: number;
  };
  users: {
    limit: number;
    unlimited: boolean;
  };
}

interface BillingStatus {
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  trialDaysLeft: number | null;
  hasSubscription: boolean;
  canManageBilling: boolean;
  referralRewardMonths: number;
}

// ============================================================================
// Components
// ============================================================================

function CreditCard2({ 
  icon: Icon, 
  label, 
  used, 
  total, 
  unit = "",
  color = "indigo",
  showBuyButton = false,
  onBuy,
}: { 
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  used: number;
  total: number;
  unit?: string;
  color?: "indigo" | "green" | "blue" | "purple";
  showBuyButton?: boolean;
  onBuy?: () => void;
}) {
  const remaining = Math.max(0, total - used);
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  
  const colorClasses = {
    indigo: { bg: "bg-indigo-500", light: "bg-indigo-100", text: "text-indigo-600" },
    green: { bg: "bg-green-500", light: "bg-green-100", text: "text-green-600" },
    blue: { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-600" },
    purple: { bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-600" },
  };
  
  const colors = colorClasses[color];
  
  return (
    <div className="ms-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.light} flex items-center justify-center`}>
            <Icon size={20} className={colors.text} />
          </div>
          <div>
            <div className="font-medium text-[var(--ms-text)]">{label}</div>
            <div className="text-sm text-[var(--ms-text-secondary)]">
              {remaining} {unit} restant{remaining !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        {showBuyButton && (
          <button
            onClick={onBuy}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Acheter plus
            <ChevronRight size={14} />
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--ms-text-muted)]">Utilisé: {used} {unit}</span>
          <span className="text-[var(--ms-text-muted)]">Total: {total} {unit}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--ms-bg-subtle)]">
          <div
            className={`h-full rounded-full transition-all ${colors.bg}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  config,
  period,
  isCurrentPlan,
  onSelect,
  loading,
}: {
  plan: PlanType;
  config: typeof SUBSCRIPTION_PLANS[PlanType];
  period: BillingPeriod;
  isCurrentPlan: boolean;
  onSelect: () => void;
  loading: boolean;
}) {
  const price = period === "monthly" ? config.monthlyPrice : config.yearlyPrice;
  const monthlyEquivalent = period === "yearly" ? Math.round(config.yearlyPrice / 12) : config.monthlyPrice;
  const savings = period === "yearly" ? (config.monthlyPrice * 12) - config.yearlyPrice : 0;
  
  return (
    <div className={`ms-card p-6 relative ${config.popular ? "ring-2 ring-indigo-500" : ""}`}>
      {config.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-medium">
          Populaire
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-[var(--ms-text)] mb-1">{config.name}</h3>
        <p className="text-sm text-[var(--ms-text-secondary)]">{config.description}</p>
      </div>
      
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-[var(--ms-text)]">
          {price}€
          <span className="text-base font-normal text-[var(--ms-text-muted)]">
            /{period === "monthly" ? "mois" : "an"}
          </span>
        </div>
        {period === "yearly" && (
          <div className="text-sm text-green-600 mt-1">
            Soit {monthlyEquivalent}€/mois — Économisez {savings}€
          </div>
        )}
      </div>
      
      <ul className="space-y-3 mb-6">
        {config.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
            <span className="text-[var(--ms-text-secondary)]">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={onSelect}
        disabled={loading || isCurrentPlan}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          isCurrentPlan
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : config.popular
            ? "ms-btn ms-btn-primary"
            : "ms-btn ms-btn-secondary"
        }`}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin mx-auto" />
        ) : isCurrentPlan ? (
          "Plan actuel"
        ) : (
          "Choisir ce plan"
        )}
      </button>
    </div>
  );
}

function PackCard({
  pack,
  onPurchase,
  loading,
}: {
  pack: typeof SIV_PACKS[0];
  onPurchase: () => void;
  loading: boolean;
}) {
  const isSiv = pack.type === "SIV";
  
  return (
    <div className={`ms-card p-5 ${pack.popular ? "ring-2 ring-indigo-500" : ""}`}>
      {pack.popular && (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-600 mb-2">
          Meilleur rapport
        </span>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSiv ? (
            <Car size={20} className="text-blue-500" />
          ) : (
            <HardDrive size={20} className="text-purple-500" />
          )}
          <span className="font-semibold text-[var(--ms-text)]">{pack.name}</span>
        </div>
        <div className="text-right">
          <div className="font-bold text-[var(--ms-text)]">{pack.price}€</div>
          <div className="text-xs text-[var(--ms-text-muted)]">
            {pack.pricePerUnit.toFixed(2)}€/{isSiv ? "recherche" : "Go"}
          </div>
        </div>
      </div>
      
      <button
        onClick={onPurchase}
        disabled={loading}
        className="w-full py-2 rounded-lg text-sm font-medium ms-btn ms-btn-secondary"
      >
        {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Acheter"}
      </button>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function BillingPage() {
  const user = useUser();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [activeTab, setActiveTab] = useState<"plans" | "packs">("plans");
  
  // Check for success/cancel messages
  const packSuccess = searchParams.get("pack_success") === "true";
  const packCancelled = searchParams.get("pack_cancelled") === "true";

  // Load credits data
  const loadCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/credits");
      const json = await res.json();
      if (json.ok) {
        setCredits(json);
      }
    } catch {
      toast.error("Erreur de chargement des crédits");
    }
  }, []);

  // Load billing status
  const loadBillingStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      const json = await res.json();
      if (json.ok && json.data) {
        setBillingStatus(json.data);
      }
    } catch {
      toast.error("Erreur de chargement du statut de facturation");
    }
  }, []);

  useEffect(() => {
    Promise.all([loadCredits(), loadBillingStatus()])
      .finally(() => setLoading(false));
  }, [loadCredits, loadBillingStatus]);

  // Handle subscription checkout
  const handleSubscribe = async (plan: PlanType) => {
    try {
      setError(null);
      const priceKey = `${plan}_${billingPeriod.toUpperCase()}`;
      setActionLoading(priceKey);
      
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          priceKey,
          productId: billingPeriod === "monthly" 
            ? SUBSCRIPTION_PLANS[plan].monthlyProductId 
            : SUBSCRIPTION_PLANS[plan].yearlyProductId,
        }),
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

  // Handle pack purchase
  const handlePurchasePack = async (packId: string) => {
    try {
      setError(null);
      setActionLoading(packId);
      
      const res = await fetch("/api/billing/purchase-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const json = await res.json();
      
      if (json.ok && json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error?.message || "Erreur lors de l'achat");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle portal access
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

  // Admin view
  if (user.role === "ADMIN") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="ms-card p-8 text-center">
          <Shield size={48} className="mx-auto mb-4 text-indigo-600" />
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const currentPlan = credits?.effectivePlan || "PRO";

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Facturation</h1>
          <p className="ms-page-subtitle">Gérez votre abonnement et vos crédits</p>
        </div>
        {billingStatus?.canManageBilling && (
          <button
            onClick={handlePortal}
            disabled={actionLoading === "portal"}
            className="ms-btn ms-btn-secondary"
          >
            {actionLoading === "portal" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ExternalLink size={16} />
            )}
            Portail Stripe
          </button>
        )}
      </div>

      {/* Error/Success Banners */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle size={20} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
      
      {packSuccess && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          <Check size={20} />
          <span className="flex-1">Votre pack a été ajouté avec succès !</span>
        </div>
      )}
      
      {packCancelled && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
          <Info size={20} />
          <span className="flex-1">Achat annulé. Vous pouvez réessayer quand vous le souhaitez.</span>
        </div>
      )}

      {/* Current Plan & Credits Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="ms-card p-6 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-lg text-[var(--ms-text)]">Plan {currentPlan}</div>
              <div className="text-sm text-green-600">
                {billingStatus?.status === "ACTIVE" ? "Actif" : 
                 billingStatus?.status === "TRIALING" ? `Essai (${billingStatus.trialDaysLeft}j restants)` :
                 billingStatus?.status || "—"}
              </div>
            </div>
          </div>
          
          {billingStatus?.currentPeriodEnd && (
            <p className="text-sm text-[var(--ms-text-muted)]">
              Renouvellement le {new Date(billingStatus.currentPeriodEnd).toLocaleDateString("fr-FR")}
            </p>
          )}
          
          {billingStatus && billingStatus.referralRewardMonths > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <Gift size={16} />
                <span className="text-sm font-medium">
                  {billingStatus.referralRewardMonths} mois offert{billingStatus.referralRewardMonths > 1 ? "s" : ""} (parrainage)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Credits Cards */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {credits && (
            <>
              <CreditCard2
                icon={Car}
                label="Recherches SIV"
                used={credits.siv.usedThisMonth}
                total={credits.siv.includedInPlan + credits.siv.extraCredits}
                color="blue"
                showBuyButton
                onBuy={() => setActiveTab("packs")}
              />
              <CreditCard2
                icon={HardDrive}
                label="Stockage"
                used={credits.storage.usedGB}
                total={credits.storage.totalGB}
                unit="Go"
                color="purple"
                showBuyButton
                onBuy={() => setActiveTab("packs")}
              />
              <CreditCard2
                icon={Brain}
                label="Requêtes IA"
                used={credits.ai.usedThisMonth}
                total={credits.ai.includedPerMonth}
                color="indigo"
              />
              <CreditCard2
                icon={Users}
                label="Utilisateurs"
                used={1}
                total={credits.users.unlimited ? 999 : credits.users.limit}
                color="green"
              />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-lg bg-[var(--ms-bg-subtle)] w-fit">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === "plans"
              ? "bg-[var(--ms-surface)] text-[var(--ms-text)] shadow-sm"
              : "text-[var(--ms-text-secondary)] hover:text-[var(--ms-text)]"
          }`}
        >
          <Crown size={16} className="inline mr-2" />
          Abonnements
        </button>
        <button
          onClick={() => setActiveTab("packs")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === "packs"
              ? "bg-[var(--ms-surface)] text-[var(--ms-text)] shadow-sm"
              : "text-[var(--ms-text-secondary)] hover:text-[var(--ms-text)]"
          }`}
        >
          <Package size={16} className="inline mr-2" />
          Packs de crédits
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-[var(--ms-text-secondary)] hover:text-[var(--ms-text)]"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                billingPeriod === "yearly"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-[var(--ms-text-secondary)] hover:text-[var(--ms-text)]"
              }`}
            >
              Annuel
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                -17%
              </span>
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {(Object.keys(SUBSCRIPTION_PLANS) as PlanType[]).map((planKey) => (
              <PlanCard
                key={planKey}
                plan={planKey}
                config={SUBSCRIPTION_PLANS[planKey]}
                period={billingPeriod}
                isCurrentPlan={currentPlan === planKey}
                onSelect={() => handleSubscribe(planKey)}
                loading={actionLoading === `${planKey}_${billingPeriod.toUpperCase()}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Packs Tab */}
      {activeTab === "packs" && (
        <div className="space-y-8">
          {/* SIV Packs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Car size={20} className="text-blue-500" />
              <h2 className="text-lg font-semibold text-[var(--ms-text)]">Packs Recherches SIV</h2>
            </div>
            <p className="text-sm text-[var(--ms-text-secondary)] mb-4">
              Crédits supplémentaires pour les recherches de plaque d&apos;immatriculation
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {SIV_PACKS.map((pack) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  onPurchase={() => handlePurchasePack(pack.id)}
                  loading={actionLoading === pack.id}
                />
              ))}
            </div>
          </div>

          {/* Storage Packs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HardDrive size={20} className="text-purple-500" />
              <h2 className="text-lg font-semibold text-[var(--ms-text)]">Packs Stockage</h2>
            </div>
            <p className="text-sm text-[var(--ms-text-secondary)] mb-4">
              Espace de stockage supplémentaire pour vos documents et photos
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {STORAGE_PACKS.map((pack) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  onPurchase={() => handlePurchasePack(pack.id)}
                  loading={actionLoading === pack.id}
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="ms-card p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Comment fonctionnent les packs ?</p>
                <ul className="list-disc pl-4 space-y-1 text-blue-600">
                  <li>Les crédits SIV s&apos;ajoutent à votre quota mensuel et n&apos;expirent pas</li>
                  <li>Le stockage supplémentaire est permanent tant que votre abonnement est actif</li>
                  <li>Les crédits sont utilisés en priorité (quota mensuel d&apos;abord, puis les packs)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="ms-card p-6">
        <h2 className="text-lg font-semibold text-[var(--ms-text)] mb-4">Questions fréquentes</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-[var(--ms-text)]">Puis-je changer de plan à tout moment ?</h3>
            <p className="text-sm text-[var(--ms-text-secondary)]">
              Oui, vous pouvez upgrader ou downgrader à tout moment. Le prorata sera calculé automatiquement.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-[var(--ms-text)]">Que se passe-t-il si je dépasse mes quotas ?</h3>
            <p className="text-sm text-[var(--ms-text-secondary)]">
              Vous recevrez une notification et pourrez acheter des packs supplémentaires. L&apos;accès n&apos;est jamais coupé brutalement.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-[var(--ms-text)]">Les crédits non utilisés sont-ils reportés ?</h3>
            <p className="text-sm text-[var(--ms-text-secondary)]">
              Le quota mensuel de votre plan est réinitialisé chaque mois. Les crédits achetés via les packs n&apos;expirent pas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
