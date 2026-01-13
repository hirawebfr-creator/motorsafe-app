"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Loader2, ArrowRight, CreditCard } from "lucide-react";

type BillingStatus = {
  plan: string;
  status: string | null;
  hasSubscription: boolean;
};

function BillingSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      const json = await res.json();
      if (json.ok && json.data) {
        setStatus(json.data);
        // Stop polling if subscription is active
        if (json.data.status === "ACTIVE" || json.data.status === "TRIALING") {
          setLoading(false);
          return true;
        }
      }
    } catch (e) {
      console.error("Failed to load status:", e);
    }
    return false;
  }, []);

  useEffect(() => {
    // Poll status every 2 seconds for up to 30 seconds
    const poll = async () => {
      const done = await loadStatus();
      if (!done && pollCount < 15) {
        setPollCount((c) => c + 1);
        setTimeout(poll, 2000);
      } else {
        setLoading(false);
      }
    };
    void poll();
  }, [loadStatus, pollCount]);

  const isActive = status?.status === "ACTIVE" || status?.status === "TRIALING";

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-green-50 to-white">
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <div className="text-center">
          {loading ? (
            <Loader2 size={64} className="mx-auto mb-6 animate-spin text-indigo-600" />
          ) : (
            <CheckCircle size={64} className="mx-auto mb-6 text-green-500" />
          )}

          <h1 className="text-3xl font-bold tracking-tight">
            {loading ? "Validation en cours…" : "Paiement confirmé !"}
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            {loading
              ? "Nous attendons la confirmation de Stripe…"
              : "Merci pour votre confiance. Votre abonnement est maintenant actif."}
          </p>
        </div>

        <Card className="mt-10 p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-4">
              <Loader2 size={20} className="animate-spin text-indigo-600" />
              <span className="text-gray-600">
                Synchronisation avec Stripe en cours...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-indigo-600">
                  {status?.plan === "PRO" ? "Pro" : status?.plan || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-gray-600">Statut</span>
                <span className={`font-semibold ${isActive ? "text-green-600" : "text-gray-600"}`}>
                  {isActive ? "Actif" : status?.status || "En attente"}
                </span>
              </div>
              {sessionId && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Session</span>
                  <span className="font-mono text-xs text-gray-400">
                    {sessionId.slice(0, 20)}...
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/billing">
            <Button>
              <CreditCard size={18} />
              Voir mon abonnement
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">
              <ArrowRight size={18} />
              Aller au dashboard
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Le statut est synchronisé automatiquement via les webhooks Stripe.
          <br />
          Si le statut n'est pas mis à jour, veuillez patienter quelques secondes.
        </p>
      </div>
    </main>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-white">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
        </main>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
