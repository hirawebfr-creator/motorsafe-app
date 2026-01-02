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
      toast.push({ title: "Connexion reussie", description: "Bienvenue sur votre panel.", variant: "success" });
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg p-8">
        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Connexion</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Accès garage</h1>
          <p className="text-sm text-[color:var(--textMuted)]">
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
          {error ? <p className="text-sm text-[color:var(--danger)]">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--textMuted)]">
          <Link
            href="/auth/register-pro"
            className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
          >
            Créer un compte pro
          </Link>
          <Link href="/" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
            Retour site
          </Link>
        </div>
      </Card>
    </main>
  );
}
