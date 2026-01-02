"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (res.status === 403) {
          window.location.href = "/pro/en-attente";
          return;
        }
        throw new Error(json?.error || "Erreur serveur.");
      }
      toast.push({ title: "Connexion réussie", description: "Bienvenue sur votre panel.", variant: "success" });
      window.location.href = "/dashboard";
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
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="hidden lg:flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-primary to-primary2 text-white shadow-sm">
              <span className="text-sm font-semibold">MS</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">MotorSafe</div>
              <div className="text-xs text-muted2">Espace pro</div>
            </div>
          </Link>

          <div>
            <p className="ms-kicker">Connexion</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Accédez à votre atelier</h1>
            <p className="mt-3 text-base text-muted2">
              Retrouvez vos dossiers, vos interventions et vos documents en un seul endroit sécurisé.
            </p>
          </div>

          <div className="grid gap-4">
            <Card className="p-4">
              <p className="ms-kicker">Sécurité</p>
              <p className="mt-2 text-sm font-semibold">Accès sécurisé et conformité intégrée</p>
              <p className="mt-1 text-xs text-muted2">
                Chaque action est tracée pour garantir la qualité de vos dossiers.
              </p>
            </Card>
            <Card className="p-4">
              <p className="ms-kicker">Performance</p>
              <p className="mt-2 text-sm font-semibold">Une interface rapide, pensée terrain</p>
              <p className="mt-1 text-xs text-muted2">
                Pas de surcharge : juste l&apos;essentiel pour l&apos;atelier.
              </p>
            </Card>
          </div>
        </div>

        <Card className="w-full p-8">
          <div className="grid gap-3">
            <p className="ms-kicker">Connexion</p>
            <h1 className="text-2xl font-semibold tracking-tight text-text">Accès garage</h1>
            <p className="text-sm text-muted2">
              Connectez-vous pour accéder à votre dashboard sécurisé.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="contact@garage.fr"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted2">
            <Link
              href="/auth/register-pro"
              className="font-semibold text-primary hover:text-primaryHover"
            >
              Créer un compte pro
            </Link>
            <Link href="/" className="font-semibold text-primary hover:text-primaryHover">
              Retour site
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
