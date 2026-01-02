import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
    <main className="relative min-h-screen w-full overflow-hidden bg-bg text-text">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 md:px-8 md:py-16">
        <header className="flex flex-col gap-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-primary to-primary2 text-white shadow-sm">
                <span className="text-sm font-semibold">MS</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">MotorSafe</div>
                <div className="text-xs text-muted2">SaaS pour garages & pros</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/pro/inscription">
                <Button size="sm">Demander une démo</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="grid gap-6">
              <div className="flex items-center gap-3">
                <p className="ms-kicker">MotorSafe Pro</p>
                <Badge variant="accent">Nouveau</Badge>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Pilotez chaque atelier avec la précision d&apos;un tableau de bord premium.
              </h1>
              <p className="max-w-xl text-base text-muted2 md:text-lg">
                Clients, véhicules, interventions, documents et conformité réunis dans une expérience claire,
                rapide et pensée pour les équipes terrain.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/pro/inscription">
                  <Button size="lg">Demander une démo</Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="secondary">
                    Accès pro
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Flux centralisé",
                    desc: "Une chaîne simple : clients → véhicules → interventions → PDF.",
                  },
                  {
                    title: "Lisible partout",
                    desc: "Interface fluide sur mobile, tablette et desktop.",
                  },
                  {
                    title: "Conformité active",
                    desc: "Traçabilité et références légales intégrées.",
                  },
                ].map((item) => (
                  <Card key={item.title} className="p-4">
                    <p className="ms-kicker">Pilotage</p>
                    <p className="mt-2 text-sm font-semibold text-text">{item.title}</p>
                    <p className="mt-1 text-xs text-muted2">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="ms-fade-up p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Tableau atelier</p>
                    <p className="text-xs text-muted2">Synthèse temps réel</p>
                  </div>
                  <Badge variant="success">Actif</Badge>
                </div>

                <div className="mt-6 grid gap-5">
                  <div className="grid gap-3">
                    <p className="text-xs text-muted2">Aujourd&apos;hui</p>
                    {[
                      { plate: "AB-458-CD", client: "Garage Horizon", type: "E85" },
                      { plate: "FG-902-TR", client: "Auto Lumen", type: "Diag" },
                    ].map((row) => (
                      <div
                        key={row.plate}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-surface2/80 px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">{row.plate}</p>
                          <p className="text-xs text-muted2">{row.client}</p>
                        </div>
                        <Badge variant="accent">{row.type}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <p className="text-xs text-muted2">Indicateurs</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Clients actifs", value: "238" },
                        { label: "Interventions 7j", value: "47" },
                        { label: "PDF générés", value: "182" },
                        { label: "Temps moyen", value: "12m" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-border/60 bg-surface px-3 py-3">
                          <p className="text-xs text-muted2">{stat.label}</p>
                          <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="ms-fade-up ms-delay-2 absolute -bottom-6 -left-6 hidden w-56 p-4 sm:block">
                <p className="ms-kicker">Conformité</p>
                <p className="mt-2 text-sm font-semibold">PDF automatique & traçabilité</p>
                <p className="mt-1 text-xs text-muted2">
                  Chaque intervention est archivée avec preuves et références.
                </p>
              </Card>
            </div>
          </div>
        </header>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Gestion complète",
              desc: "Clients, véhicules, interventions, documents et conformité au même endroit.",
            },
            {
              title: "Process rapide",
              desc: "Moins de clics, plus d&apos;action : votre équipe gagne du temps.",
            },
            {
              title: "Sécurisé",
              desc: "Accès, preuves, historique : votre conformité sans friction.",
            },
          ].map((item, index) => (
            <Card key={item.title} className={`ms-fade-up p-6 ${index === 1 ? "ms-delay-1" : index === 2 ? "ms-delay-2" : ""}`}>
              <p className="ms-kicker">Module</p>
              <h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted2">{item.desc}</p>
            </Card>
          ))}
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <p className="ms-kicker">Workflow</p>
            <h2 className="mt-3 text-xl font-semibold">Un flux clair pour toute l&apos;équipe</h2>
            <p className="mt-2 text-sm text-muted2">
              Des étapes simples qui s&apos;adaptent à la réalité de l&apos;atelier.
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-muted2">
              {[
                "Créez un client et associez un véhicule.",
                "Documentez chaque intervention avec notes et preuves.",
                "Générez automatiquement les dossiers PDF.",
                "Assurez la conformité avec les références intégrées.",
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <p className="ms-kicker">Performance</p>
            <h2 className="mt-3 text-xl font-semibold">Pensé pour les pros exigeants</h2>
            <p className="mt-2 text-sm text-muted2">
              Une interface moderne et rapide, conçue pour les garages qui veulent suivre leur activité avec précision.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Temps de réponse", value: "< 250 ms" },
                { label: "Disponibilité", value: "99,9%" },
                { label: "Support", value: "Équipe dédiée" },
                { label: "Sécurité", value: "Chiffrement" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/60 bg-surface2/80 p-4">
                  <p className="text-xs text-muted2">{stat.label}</p>
                  <p className="mt-2 text-base font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card className="mt-16 flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="ms-kicker">Prêt à moderniser l&apos;atelier ?</p>
            <h2 className="mt-3 text-2xl font-semibold">Passez à MotorSafe Pro</h2>
            <p className="mt-2 text-sm text-muted2">
              Découvrez un panel premium pour piloter vos interventions et clients.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/pro/inscription">
              <Button size="lg">Demander une démo</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="secondary">
                Accès pro
              </Button>
            </Link>
          </div>
        </Card>

        <footer className="mt-16 border-t border-border/60 pt-6 text-center text-xs text-muted2">
          © {new Date().getFullYear()} MotorSafe.
        </footer>
      </div>
    </main>
  );
}
