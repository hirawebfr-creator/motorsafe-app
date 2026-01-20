"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";

type MePayload = {
  user: { email: string; role: string; garageId: number | null };
  organisation: unknown;
  plan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | Date | null;
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) {
          const msg = typeof json?.error === "string" ? json.error : json?.error?.message;
          throw new Error(msg || "Erreur serveur.");
        }
        if (!cancelled) setMe(json.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = async () => {
    setError(null);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      const msg = typeof json?.error === "string" ? json.error : json?.error?.message;
      throw new Error(msg || "Erreur checkout");
    }
    window.location.href = json.data.url;
  };

  const openPortal = async () => {
    setError(null);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      const msg = typeof json?.error === "string" ? json.error : json?.error?.message;
      throw new Error(msg || "Erreur portal");
    }
    window.location.href = json.data.url;
  };

  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
        <p className="mt-2 text-sm text-muted2">Gérez votre plan MotorSafe.</p>

        <Card className="mt-6 p-6">
          {loading ? (
            <p className="text-sm text-muted2">Chargement…</p>
          ) : error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : !me ? (
            <p className="text-sm text-muted2">Non connecté.</p>
          ) : (
            <div className="grid gap-3">
              <div className="text-sm">
                <div>
                  <span className="text-muted2">Email:</span> {me.user.email}
                </div>
                <div>
                  <span className="text-muted2">Plan:</span> {me.plan}
                </div>
                <div>
                  <span className="text-muted2">Statut:</span> {me.subscriptionStatus ?? "-"}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-3">
                <Button onClick={() => startCheckout().catch((e) => setError(e.message))}>
                  Passer Pro
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => openPortal().catch((e) => setError(e.message))}
                >
                  Gérer abonnement
                </Button>
              </div>

              <p className="text-xs text-muted2">
                Le statut est mis à jour par les webhooks Stripe (source de vérité).
              </p>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
