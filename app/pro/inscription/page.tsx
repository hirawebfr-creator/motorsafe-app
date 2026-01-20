"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";

// PARTNER-PROGRAM-01: Cookie utilities for ref tracking
const REF_COOKIE_NAME = "sm_ref";
const REF_COOKIE_DAYS = 30;

function setRefCookie(refCode: string) {
  const expires = new Date();
  expires.setDate(expires.getDate() + REF_COOKIE_DAYS);
  document.cookie = `${REF_COOKIE_NAME}=${encodeURIComponent(refCode)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  // Also store in localStorage as fallback
  try {
    localStorage.setItem(REF_COOKIE_NAME, refCode);
  } catch {
    // Ignore localStorage errors
  }
}

function getRefCode(): string | null {
  // Try cookie first
  const match = document.cookie.match(new RegExp(`${REF_COOKIE_NAME}=([^;]+)`));
  if (match) return decodeURIComponent(match[1]);
  // Fallback to localStorage
  try {
    return localStorage.getItem(REF_COOKIE_NAME);
  } catch {
    return null;
  }
}

function ProInscriptionContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    garageName: "",
    garageEmail: "",
    phone: "",
    address: "",
    siret: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerRef, setPartnerRef] = useState<string | null>(null);
  const toast = useToast();

  // PARTNER-PROGRAM-01: Capture ref from URL and store in cookie
  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    if (refFromUrl) {
      setRefCookie(refFromUrl.toUpperCase());
      setPartnerRef(refFromUrl.toUpperCase());
    } else {
      // Check if we already have a ref stored
      const storedRef = getRefCode();
      if (storedRef) {
        setPartnerRef(storedRef);
      }
    }
  }, [searchParams]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Include partnerRef in the request
      const res = await fetch("/api/auth/register-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...form,
          partnerRef: partnerRef || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const message =
          typeof json?.error === "string"
            ? json.error
            : json?.error?.message || "Erreur serveur.";
        throw new Error(message);
      }
      toast.push({
        title: "Demande envoyée",
        description: "Votre compte pro est en attente de validation.",
        variant: "success",
      });
      window.location.href = "/pro/en-attente";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_520px] lg:items-start">
        <div className="hidden lg:flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-primary to-primary2 text-white shadow-sm">
              <span className="text-sm font-semibold">MS</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">MotorSafe</div>
              <div className="text-xs text-muted2">Accès pro</div>
            </div>
          </Link>

          <div>
            <p className="ms-kicker">Inscription</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Demandez votre accès MotorSafe</h1>
            <p className="mt-3 text-base text-muted2">
              L&apos;équipe MotorSafe valide les comptes pour garantir une communauté professionnelle fiable.
            </p>
          </div>

          <Card className="p-4">
            <p className="ms-kicker">Process</p>
            <ol className="mt-3 grid gap-2 text-sm text-muted2">
              <li>1. Déposez vos informations atelier.</li>
              <li>2. Vérification administrative rapide.</li>
              <li>3. Activation et accès au dashboard.</li>
            </ol>
          </Card>

          <Card className="p-4">
            <p className="ms-kicker">Support</p>
            <p className="mt-2 text-sm font-semibold">Un accompagnement dédié</p>
            <p className="mt-1 text-xs text-muted2">
              Nos équipes répondent en moins de 24h pour les demandes urgentes.
            </p>
          </Card>
        </div>

        <Card className="w-full p-8">
          <div className="grid gap-3">
            <p className="ms-kicker">Inscription</p>
            <h1 className="text-2xl font-semibold tracking-tight text-text">Créer un compte pro</h1>
            <p className="text-sm text-muted2">
              Renseignez vos informations, nous reviendrons vers vous rapidement.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Nom du garage"
                value={form.garageName}
                onChange={(event) => setForm((prev) => ({ ...prev, garageName: event.target.value }))}
                placeholder="Garage Horizon"
                required
              />
              <Input
                label="Email garage"
                type="email"
                value={form.garageEmail}
                onChange={(event) => setForm((prev) => ({ ...prev, garageEmail: event.target.value }))}
                placeholder="garage@horizon.fr"
                required
              />
              <Input
                label="Téléphone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+33 6 00 00 00 00"
              />
              <Input
                label="Adresse"
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="12 rue des Ateliers, Lyon"
              />
              <Input
                label="SIRET"
                value={form.siret}
                onChange={(event) => setForm((prev) => ({ ...prev, siret: event.target.value }))}
                placeholder="123 456 789 00010"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Email responsable"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="responsable@garage.fr"
                required
              />
              <Input
                label="Mot de passe"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="********"
                required
              />
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer la demande"}
              </Button>
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-primary hover:text-primaryHover"
              >
                Déjà un compte ? Connexion
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function ProInscriptionPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen w-full bg-bg text-text flex items-center justify-center">
        <p className="text-muted2">Chargement...</p>
      </main>
    }>
      <ProInscriptionContent />
    </Suspense>
  );
}
