import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";

export default function ProLandingPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <header className="border-b border-border bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
              <span className="text-sm font-extrabold tracking-tight text-primary2">MS</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text">MotorSafe</div>
              <div className="text-xs text-muted2">Espace pro</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button>Connexion</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Garages & pros</Badge>
            <Badge variant="warning">Comptes validés</Badge>
          </div>

          <div>
            <p className="ms-kicker">Espace pro</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text">
              Un accès dédié pour les garages et pros de l&apos;auto
            </h1>
            <p className="mt-3 text-base text-muted2">
              Connectez-vous ou demandez un compte pro. Chaque demande est validée par l&apos;administration.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/auth/login">
              <Button>Connexion pro</Button>
            </Link>
            <Link href="/pro/inscription">
              <Button variant="secondary">Demander un compte</Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "Validation", desc: "Dossier vérifié avant activation." },
              { title: "Dossiers", desc: "Clients, véhicules, interventions." },
              { title: "PDF", desc: "Documents générés et accessibles." },
            ].map((item) => (
              <Card key={item.title} className="p-4">
                <p className="text-sm font-semibold text-text">{item.title}</p>
                <p className="mt-1 text-xs text-muted2">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-8">
          <p className="ms-kicker">Onboarding</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">Process simple</h2>
          <p className="mt-2 text-sm text-muted2">Trois étapes, sans friction.</p>

          <ol className="mt-5 grid gap-3 text-sm text-muted2">
            <li className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3">1. Informations atelier</li>
            <li className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3">2. Validation</li>
            <li className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3">3. Accès dashboard</li>
          </ol>

          <div className="mt-6 grid gap-3">
            <Link href="/pro/inscription">
              <Button className="w-full">Créer un compte pro</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" className="w-full">Déjà un compte ? Connexion</Button>
            </Link>
            <Link href="/" className="text-center text-sm font-semibold text-primary hover:text-primaryHover">
              Retour site
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
