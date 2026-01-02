"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function ProInscriptionPage() {
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
  const toast = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Erreur serveur.");
      }
      toast.push({
        title: "Demande envoyee",
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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-3xl p-8">
        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Inscription</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Demander un accès MotorSafe</h1>
          <p className="text-sm text-[color:var(--textMuted)]">
            Remplissez votre dossier, l'équipe MotorSafe valide les comptes avant activation.
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
              label="Telephone"
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

          {error ? <p className="text-sm text-[color:var(--danger)]">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer la demande"}
            </Button>
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
            >
              Déjà un compte ? Connexion
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
