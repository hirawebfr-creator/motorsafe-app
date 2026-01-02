import Head from "next/head";
import Link from "next/link";
import ResponsiveSidebar from "@/components/layout/responsive/ResponsiveSidebar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>MotorSafe Pro – Gestion de garages et interventions</title>
        <meta name="description" content="La plateforme SaaS tout-en-un pour les garages, pros et flottes. Gérez clients, véhicules, interventions, documents et conformité. Inspiré des leaders SaaS mondiaux." />
        <meta name="keywords" content="garage, SaaS, gestion, flotte, automobile, interventions, pros, MotorSafe, logiciel garage, cloud, maintenance, conformité, CRM, ERP" />
        <meta property="og:title" content="MotorSafe Pro – Gestion de garages et interventions" />
        <meta property="og:description" content="La plateforme SaaS tout-en-un pour les garages, pros et flottes. Gérez clients, véhicules, interventions, documents et conformité. Inspiré des leaders SaaS mondiaux." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://motorsafe.fr" />
        <meta property="og:image" content="/og-motorsafe.png" />
        <link rel="canonical" href="https://motorsafe.fr" />
      </Head>
      <div className="hidden md:flex min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]">
        <ResponsiveSidebar>
          <></>
        </ResponsiveSidebar>
        <main className="flex-1 w-full px-4">
          <div className="mx-auto w-full max-w-5xl py-16">
            <header className="grid gap-6">
              <div className="grid gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">MotorSafe</p>
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">MotorSafe Pro</h1>
                <p className="text-base md:text-lg text-[color:var(--textMuted)] max-w-2xl">
                  La plateforme SaaS tout-en-un pour gérer votre garage, vos clients, vos véhicules et vos interventions, en toute simplicité et conformité.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/auth/login">
                  <Button size="lg">Démarrer</Button>
                </Link>
                <Link href="/pro/inscription">
                  <Button size="lg" variant="secondary">Demander un accès</Button>
                </Link>
              </div>
            </header>

            <section className="mt-12 grid gap-6 md:grid-cols-3">
              <Card className="text-center">
                <h2 className="text-lg font-semibold">Gestion complète</h2>
                <p className="mt-2 text-sm text-[color:var(--textMuted)]">
                  Clients, véhicules, interventions, documents, conformité : tout est centralisé.
                </p>
              </Card>
              <Card className="text-center">
                <h2 className="text-lg font-semibold">Expérience premium</h2>
                <p className="mt-2 text-sm text-[color:var(--textMuted)]">
                  Interface rapide, sobre, responsive et lisible, orientée productivité.
                </p>
              </Card>
              <Card className="text-center">
                <h2 className="text-lg font-semibold">Sécurité & conformité</h2>
                <p className="mt-2 text-sm text-[color:var(--textMuted)]">
                  Traçabilité, preuves, contrôle d’accès et génération de dossiers PDF.
                </p>
              </Card>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-center">Pourquoi choisir MotorSafe ?</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2 text-sm text-[color:var(--textMuted)]">
                <Card>
                  <p>Outil cloud, sécurisé, accessible partout.</p>
                </Card>
                <Card>
                  <p>Workflow simple : clients → véhicules → interventions → PDF.</p>
                </Card>
                <Card>
                  <p>Suivi des révisions et traçabilité des preuves.</p>
                </Card>
                <Card>
                  <p>Interface claire, mobile-first, pensée pour les pros.</p>
                </Card>
              </div>
            </section>

            <footer className="mt-12 text-center text-xs text-[color:var(--textMuted)]">
              © {new Date().getFullYear()} MotorSafe. Plateforme SaaS pour garages et pros.
            </footer>
          </div>
        </main>
      </div>
      {/* Mobile layout : landing page sans sidebar */}
      <main className="md:hidden min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)] px-4">
        <div className="mx-auto w-full max-w-5xl py-16">
          <header className="grid gap-6">
            <div className="grid gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">MotorSafe</p>
              <h1 className="text-4xl font-semibold tracking-tight">MotorSafe Pro</h1>
              <p className="text-base text-[color:var(--textMuted)] max-w-2xl">
                La plateforme SaaS tout-en-un pour gérer votre garage, vos clients, vos véhicules et vos interventions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/auth/login">
                <Button size="lg">Démarrer</Button>
              </Link>
              <Link href="/pro/inscription">
                <Button size="lg" variant="secondary">Demander un accès</Button>
              </Link>
            </div>
          </header>

          <section className="mt-12 grid gap-6">
            <Card className="text-center">
              <h2 className="text-lg font-semibold">Gestion complète</h2>
              <p className="mt-2 text-sm text-[color:var(--textMuted)]">
                Clients, véhicules, interventions, documents, conformité : tout est centralisé.
              </p>
            </Card>
            <Card className="text-center">
              <h2 className="text-lg font-semibold">Expérience premium</h2>
              <p className="mt-2 text-sm text-[color:var(--textMuted)]">
                Interface rapide, sobre, responsive et lisible.
              </p>
            </Card>
            <Card className="text-center">
              <h2 className="text-lg font-semibold">Sécurité & conformité</h2>
              <p className="mt-2 text-sm text-[color:var(--textMuted)]">
                Traçabilité et génération de dossiers PDF.
              </p>
            </Card>
          </section>

          <footer className="mt-12 text-center text-xs text-[color:var(--textMuted)]">
            © {new Date().getFullYear()} MotorSafe.
          </footer>
        </div>
      </main>
    </>
  );
}
