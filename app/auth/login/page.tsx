"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          window.location.href = "/pro/pending";
          return;
        }
        throw new Error(json?.error || "Erreur serveur.");
      }
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg">
        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Connexion</p>
          <h1 className="text-3xl font-semibold">Acces garage</h1>
          <p className="text-sm text-[var(--muted)]">
            Connectez-vous pour acceder a votre dashboard securise.
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
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <Link href="/auth/register-pro" className="text-[var(--accent-2)]">
            Creer un compte pro
          </Link>
          <Link href="/" className="text-[var(--accent-2)]">
            Retour site
          </Link>
        </div>
      </Card>
    </main>
  );
}
