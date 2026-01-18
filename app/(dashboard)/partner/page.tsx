"use client";

/**
 * PARTNER-PROGRAM-01: Partner Dashboard
 * 
 * Shows partner stats, conversions, and commission info.
 * Accessible only to users with PARTNER role.
 */

import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  CreditCard,
  Copy,
  CheckCircle2,
  RefreshCw,
  Link as LinkIcon,
  Euro,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/Toast";

interface PartnerStats {
  refCode: string;
  commissionPercent: number;
  stats: {
    signups: number;
    trials: number;
    paid: number;
    commissionTotal: number;
    commissionDue: number;
    commissionPaid: number;
  };
  conversions: Array<{
    id: string;
    city: string;
    plan: string;
    status: string;
    subscriptionStatus: string;
    signupDate: string;
  }>;
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PartnerDashboardPage() {
  const user = useUser();
  const toast = useToast();
  const [data, setData] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPartner = user?.role === "PARTNER" || user?.role === "ADMIN";

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher<PartnerStats>("/api/partner/stats");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPartner) {
      fetchStats();
    }
  }, [isPartner]);

  const copyLink = () => {
    if (!data) return;
    const link = `https://app.safemotor.fr/pro/inscription?ref=${data.refCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.push({ title: "Lien copié", variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isPartner) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Accès réservé aux partenaires
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Dashboard Partenaire
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Suivez vos performances et commissions
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {data && (
        <>
          {/* Affiliate Link */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-xl border border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-600 rounded-xl">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900">Votre lien affilié</h3>
                  <p className="text-sm text-primary-700 font-mono">
                    https://app.safemotor.fr/pro/inscription?ref={data.refCode}
                  </p>
                </div>
              </div>
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
            <p className="mt-4 text-sm text-primary-700">
              Commission : <strong>{data.commissionPercent}%</strong> sur le 1er mois de chaque abonnement
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{data.stats.signups}</div>
                  <div className="text-sm text-gray-500">Inscriptions</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{data.stats.trials}</div>
                  <div className="text-sm text-gray-500">En essai</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{data.stats.paid}</div>
                  <div className="text-sm text-gray-500">Abonnés payants</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Euro className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCents(data.stats.commissionDue)}
                  </div>
                  <div className="text-sm text-gray-500">Commission due</div>
                </div>
              </div>
            </div>
          </div>

          {/* Commission Summary */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-4">Résumé des commissions</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCents(data.stats.commissionTotal)}
                </div>
                <div className="text-sm text-gray-500">Total généré</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {formatCents(data.stats.commissionPaid)}
                </div>
                <div className="text-sm text-gray-500">Déjà versé</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {formatCents(data.stats.commissionDue)}
                </div>
                <div className="text-sm text-gray-500">En attente</div>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500 text-center">
              Seuil de versement : 50€ • Versement mensuel par virement
            </p>
          </div>

          {/* Conversions Table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold">Mes conversions</h3>
              <p className="text-sm text-gray-500">Liste anonymisée des garages inscrits via votre lien</p>
            </div>
            
            {data.conversions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Aucune conversion pour le moment
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.conversions.map((conv) => (
                    <tr key={conv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{conv.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{conv.city}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          conv.plan === "PRO" ? "bg-purple-100 text-purple-700" :
                          conv.plan === "STARTER" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {conv.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          conv.subscriptionStatus === "ACTIVE" ? "bg-green-100 text-green-700" :
                          conv.subscriptionStatus === "TRIALING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {conv.subscriptionStatus === "ACTIVE" ? "Payant" :
                           conv.subscriptionStatus === "TRIALING" ? "Essai" : "En attente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(conv.signupDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
