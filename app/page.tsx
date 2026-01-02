import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "MotorSafe Pro – Gestion de garages et interventions",
  description:
    "La plateforme SaaS tout-en-un pour les garages, pros et flottes. Gérez clients, véhicules, interventions, documents et conformité.",
  keywords: [
    "garage",
    "SaaS",
    "gestion",
    "flotte",
    "automobile",
    "interventions",
    "MotorSafe",
    "logiciel garage",
    "cloud",
    "maintenance",
    "conformité",
  ],
  alternates: { canonical: "https://motorsafe.fr" },
  openGraph: {
    title: "MotorSafe Pro – Gestion de garages et interventions",
    description:
      "La plateforme SaaS tout-en-un pour les garages, pros et flottes. Gérez clients, véhicules, interventions, documents et conformité.",
    url: "https://motorsafe.fr",
    type: "website",
    images: ["/og-motorsafe.png"],
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8">
        <header className="flex flex-col gap-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface2)]">
                <span className="text-sm font-semibold text-[color:var(--accent)]">MS</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">MotorSafe</div>
                <div className="text-xs text-[color:var(--textMuted)]">SaaS pour garages & pros</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="secondary" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/pro/inscription">
                <Button variant="primary" size="sm">
                  Demander un accès
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr] md:items-start">
            <div className="grid gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">MotorSafe Pro</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Une interface premium pour piloter votre activité.
              </h1>
              <p className="max-w-2xl text-base text-[color:var(--textSecondary)] md:text-lg">
                Clients, véhicules, interventions, documents et conformité : tout est centralisé dans un panel clair, rapide et
                responsive.
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Link href="/auth/login">
                  <Button size="lg">Démarrer</Button>
                </Link>
                <Link href="/legal">
                  <Button size="lg" variant="ghost">
                    Mentions légales
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">En bref</p>
              <ul className="mt-3 grid gap-2 text-sm text-[color:var(--textSecondary)]">
                <li>• Workflow simple : clients → véhicules → interventions → PDF</li>
                <li>• Traçabilité et conformité intégrées</li>
                <li>• Mobile, tablette, desktop</li>
              </ul>
            </Card>
          </div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Gestion complète</h2>
            <p className="mt-2 text-sm text-[color:var(--textSecondary)]">
              Clients, véhicules, interventions, documents et conformité : tout est au même endroit.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Lisible & cohérent</h2>
            <p className="mt-2 text-sm text-[color:var(--textSecondary)]">
              Surfaces nettes, typographie claire, espace : une UI sobre, premium et productive.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Sécurisé</h2>
            <p className="mt-2 text-sm text-[color:var(--textSecondary)]">
              Accès, preuves et historique : la conformité sans complexité.
            </p>
          </Card>
        </section>

        <footer className="mt-14 border-t border-[color:var(--border)] pt-8 text-center text-xs text-[color:var(--textMuted)]">
          © {new Date().getFullYear()} MotorSafe.
        </footer>
      </div>
    </main>
  );
}
