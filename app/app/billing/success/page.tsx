"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";

function BillingSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [message, setMessage] = useState<string>("Validation en cours…");

  useEffect(() => {
    // Webhook-first: we just prompt the user to refresh status.
    // Optionally we could poll /api/me.
    const t = setTimeout(() => {
      setMessage("Paiement confirmé. Le statut se mettra à jour après réception du webhook Stripe.");
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Succès</h1>
        <p className="mt-2 text-sm text-muted2">Session: {sessionId || "-"}</p>

        <Card className="mt-6 p-6">
          <p className="text-sm">{message}</p>
          <p className="mt-2 text-xs text-muted2">
            Retournez sur la page Abonnement pour voir le statut.
          </p>
        </Card>
      </div>
    </main>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full bg-bg text-text" />}>
      <BillingSuccessContent />
    </Suspense>
  );
}
