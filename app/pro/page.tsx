import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProLandingPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-16">
        <Card className="grid w-full gap-8 p-10 text-left md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="grid gap-4">
            <p className="ms-kicker">Espace pro</p>
            <h1 className="text-3xl font-semibold tracking-tight text-text md:text-4xl">
              Un accès dédié pour les garages et pros de l&apos;auto
            </h1>
            <p className="text-sm text-muted2 md:text-base">
              Connectez-vous ou demandez un compte pro. Chaque demande est validée par l&apos;administration.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/login">
                <Button>Connexion Pro</Button>
              </Link>
              <Link href="/pro/inscription">
                <Button variant="secondary">Créer compte pro</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { title: "Validation rapide", desc: "Nous confirmons votre dossier sous 24h." },
              { title: "Dossier complet", desc: "Interventions, véhicules, clients et documents PDF." },
              { title: "Conformité intégrée", desc: "Traçabilité et références réglementaires." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border/60 bg-surface2/80 p-4">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted2">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
