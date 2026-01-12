"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";

type BillingStatus = {
  plan: "FREE" | "PRO" | "BUSINESS" | "ADMIN";
  status: string;
  currentPeriodEnd: string | null;
  hasPaymentMethod: boolean;
  hasSubscription: boolean;
  canManageBilling: boolean;
};


export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [, setStatus] = useState<BillingStatus | null>(null);
  const [, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      const json = await res.json();
      if (json.ok && json.data) {
        setStatus(json.data);
      }
    } catch (e) {
      console.error("Failed to load billing status:", e);
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
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={40} className="mx-auto mb-4 animate-spin text-indigo-600" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // MODERN PRICING CARDS
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl py-12">
      {/* Header */}
      <div className="mb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-base font-bold text-white shadow-lg">
          <Sparkles size={18} />
          Abonnements MotorSafe
        </div>
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-gray-900">
          Choisissez votre plan
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Des fonctionnalités puissantes pour tous les garages. Essayez gratuitement, sans engagement.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="w-full flex flex-col md:flex-row md:gap-x-16 gap-y-12 justify-center overflow-x-auto py-8">
        {/* FREE CARD */}
        <div className="relative w-[340px] max-w-full flex-1 rounded-2xl bg-white border border-gray-200 shadow-lg p-8 flex flex-col items-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 shadow">
            <Rocket size={32} className="text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Gratuit</h3>
          <p className="text-gray-600 mb-6 text-center">Pour démarrer et tester MotorSafe</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-gray-900">0€</span>
            <span className="ml-2 text-gray-500">/mois</span>
          </div>
          <ul className="mb-8 space-y-3 text-left w-full max-w-xs mx-auto">
            <li className="flex items-center gap-3"><Check className="text-green-500" size={18} />5 véhicules max</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={18} />10 interventions/mois</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={18} />Export PDF basique</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={18} />Support email</li>
          </ul>
          <button disabled className="w-full rounded-xl bg-gray-200 py-3 font-bold text-gray-500 cursor-not-allowed">Plan actuel</button>
        </div>

        {/* PRO CARD - Highlighted */}
        <div className="relative w-[340px] max-w-full flex-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl p-8 flex flex-col items-center border-2 border-indigo-400">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-1.5 text-base font-bold text-gray-900 shadow">
              <Star size={18} className="text-yellow-600" />
              Recommandé
            </div>
          </div>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 shadow">
            <Crown size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-extrabold text-white mb-2">Pro</h3>
          <p className="text-pink-100 mb-6 text-center">Pour les garages ambitieux</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-white">49€</span>
            <span className="ml-2 text-pink-200">/mois</span>
          </div>
          <ul className="mb-8 space-y-3 text-left w-full max-w-xs mx-auto">
            <li className="flex items-center gap-3"><Check className="text-white bg-pink-500 rounded-full p-1" size={18} />Véhicules illimités</li>
            <li className="flex items-center gap-3"><Check className="text-white bg-pink-500 rounded-full p-1" size={18} />Interventions illimitées</li>
            <li className="flex items-center gap-3"><TrendingUp className="text-white bg-indigo-500 rounded-full p-1" size={18} />Statistiques avancées</li>
            <li className="flex items-center gap-3"><Users className="text-white bg-purple-500 rounded-full p-1" size={18} />Multi-utilisateurs</li>
            <li className="flex items-center gap-3"><Gift className="text-white bg-yellow-500 rounded-full p-1" size={18} />14 jours d'essai gratuit</li>
          </ul>
          <button onClick={() => handleCheckout("PRO")} className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-gray-900 shadow hover:bg-yellow-500 transition-all text-lg">S'inscrire</button>
        </div>

        {/* BUSINESS CARD */}
        <div className="relative w-[340px] max-w-full flex-1 rounded-2xl bg-gradient-to-br from-green-400 via-teal-400 to-blue-400 shadow-lg p-8 flex flex-col items-center border-2 border-green-300">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-400 shadow">
            <Briefcase size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-extrabold text-white mb-2">Business</h3>
          <p className="text-white/80 mb-6 text-center">Pour les garages exigeants</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-white">99€</span>
            <span className="ml-2 text-blue-100">/mois</span>
          </div>
          <ul className="mb-8 space-y-3 text-left w-full max-w-xs mx-auto">
            <li className="flex items-center gap-3"><Check className="text-white bg-blue-500 rounded-full p-1" size={18} />Tout Pro +</li>
            <li className="flex items-center gap-3"><Headphones className="text-white bg-green-500 rounded-full p-1" size={18} />Support prioritaire</li>
            <li className="flex items-center gap-3"><Shield className="text-white bg-teal-500 rounded-full p-1" size={18} />Sauvegarde avancée</li>
            <li className="flex items-center gap-3"><Zap className="text-white bg-yellow-400 rounded-full p-1" size={18} />Activation instantanée</li>
          </ul>
          <button onClick={() => handleCheckout("BUSINESS")} className="w-full rounded-xl bg-blue-500 py-3 font-bold text-white shadow hover:bg-blue-600 transition-all text-lg">S'inscrire</button>
        </div>
      </div>

      {/* Trust Badges & FAQ */}
      <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-base text-gray-500">
        <span className="flex items-center gap-2"><Shield size={20} className="text-emerald-500" />Paiement sécurisé Stripe</span>
        <span className="flex items-center gap-2"><Zap size={20} className="text-yellow-500" />Activation instantanée</span>
        <span className="flex items-center gap-2"><Check size={20} className="text-green-500" />Annulation en 1 clic</span>
      </div>
      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            {q: "Puis-je annuler à tout moment ?", a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace de gestion. Aucun engagement."},
            {q: "L'essai gratuit est-il vraiment gratuit ?", a: "Absolument ! Vous avez 14 jours pour tester toutes les fonctionnalités Pro sans aucun paiement."},
            {q: "Mes données sont-elles sécurisées ?", a: "Vos données sont chiffrées et sauvegardées automatiquement. Nous utilisons les mêmes standards que les banques."},
          ].map((item, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-2 font-semibold text-gray-900">{item.q}</h3>
              <p className="text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
