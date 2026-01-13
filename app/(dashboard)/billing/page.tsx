"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Crown,
  Rocket,
  Briefcase,
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
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/components/user-context";

type BillingStatus = {
  plan: "FREE" | "PRO" | "ADMIN";
  status: string | null;
  currentPeriodEnd: string | null;
  hasPaymentMethod: boolean;
  hasSubscription: boolean;
  canManageBilling: boolean;
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

  const handleCheckout = async (plan: string) => {
    try {
      setError(null);
      setActionLoading("checkout");
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
  const statusInfo = STATUS_LABELS[status?.status ?? ""] || { label: status?.status || "Inconnu", color: "text-gray-600" };

  return (
    <div className="mx-auto max-w-6xl py-8">
      <SectionHeader
        title="Facturation"
        description="Gérez votre abonnement MotorSafe"
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
              Pour accéder à {fromPage ? `"${fromPage}"` : "cette fonctionnalité"}, vous devez passer à un plan Pro.
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

      {/* Current Status Card */}
      {status && (
        <Card className="mb-8 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${isPro ? "bg-gradient-to-br from-indigo-500 to-purple-500" : "bg-gray-100"}`}>
                {isPro ? (
                  <Crown size={28} className="text-white" />
                ) : (
                  <Rocket size={28} className="text-gray-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">
                    Plan {status.plan === "PRO" ? "Pro" : "Gratuit"}
                  </h2>
                  {status.hasSubscription && (
                    <span className={`text-sm font-medium ${statusInfo.color}`}>
                      • {statusInfo.label}
                    </span>
                  )}
                </div>
                {status.currentPeriodEnd && isActive && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted2">
                    <Calendar size={14} />
                    Renouvellement le {formatDate(status.currentPeriodEnd)}
                  </p>
                )}
                {!status.hasSubscription && (
                  <p className="mt-1 text-sm text-muted2">
                    Passez à Pro pour débloquer toutes les fonctionnalités
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isPro && (
                <Button
                  onClick={() => handleCheckout("PRO")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "checkout" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  Passer à Pro
                </Button>
              )}
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

      {/* Pricing Cards - Only show if not Pro */}
      {(!isPro || !isActive) && (
        <>
          <h2 className="mb-8 text-center text-2xl font-bold">Nos offres</h2>
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
              <p className="mt-1 text-sm text-muted2">Pour les pros</p>
              <div className="my-4">
                <span className="text-3xl font-bold">49€</span>
                <span className="text-muted2">/mois</span>
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
                  <Gift size={16} className="text-indigo-600" />14 jours d'essai
                </li>
              </ul>
              <Button
                onClick={() => handleCheckout("PRO")}
                disabled={!!actionLoading || (status?.plan === "PRO" && isActive)}
              >
                {actionLoading === "checkout" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : status?.plan === "PRO" && isActive ? (
                  "Plan actuel"
                ) : (
                  "S'abonner"
                )}
              </Button>
            </Card>

            {/* BUSINESS CARD */}
            <Card className="flex flex-col border-2 border-teal-400 bg-gradient-to-br from-teal-50 to-blue-50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-blue-500">
                <Briefcase size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Business</h3>
              <p className="mt-1 text-sm text-muted2">Pour les exigeants</p>
              <div className="my-4">
                <span className="text-3xl font-bold">99€</span>
                <span className="text-muted2">/mois</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-teal-600" />Tout Pro +
                </li>
                <li className="flex items-center gap-2">
                  <Headphones size={16} className="text-teal-600" />Support prioritaire
                </li>
                <li className="flex items-center gap-2">
                  <Shield size={16} className="text-teal-600" />Sauvegarde avancée
                </li>
                <li className="flex items-center gap-2">
                  <Zap size={16} className="text-teal-600" />Activation instantanée
                </li>
              </ul>
              <Button
                variant="secondary"
                onClick={() => handleCheckout("BUSINESS")}
                disabled={!!actionLoading}
              >
                {actionLoading === "checkout" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Contacter"
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
              a: "Absolument ! Vous avez 14 jours pour tester toutes les fonctionnalités Pro sans aucun paiement.",
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
