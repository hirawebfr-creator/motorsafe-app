import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Démo SafeMotor — La preuve en 2 minutes",
  description:
    "Découvrez comment SafeMotor protège votre garage : client, intervention, signature mobile, dossier complet, export assurance. Parcours en 6 étapes.",
};

const STEPS = [
  {
    num: 1,
    title: "Client + Véhicule",
    desc: "Créez la fiche client et ajoutez le véhicule (plaque, VIN, marque). Recherche par plaque en un clic.",
    icon: "👤",
  },
  {
    num: 2,
    title: "Intervention",
    desc: "Créez l'intervention (E85, reprog, diag, entretien…). Ajoutez notes, photos, tags.",
    icon: "🔧",
  },
  {
    num: 3,
    title: "Document + Clauses",
    desc: "Générez l'Ordre de Réparation avec les clauses légales adaptées (assurance, homologation, garantie).",
    icon: "📄",
  },
  {
    num: 4,
    title: "Signature mobile (QR)",
    desc: "Le client scanne le QR, lit les clauses et signe sur son téléphone. Vous recevez le document signé.",
    icon: "✍️",
  },
  {
    num: 5,
    title: "Dossier complet",
    desc: "OR signé, PV de restitution, photos, dossier incident si besoin. Tout est tracé et horodaté.",
    icon: "📁",
  },
  {
    num: 6,
    title: "Export assurance/justice",
    desc: "Exportez un ZIP contenant toutes les preuves : documents signés, hash, audit trail, historique.",
    icon: "📦",
  },
];

const PROOF_POINTS = [
  {
    title: "Hash SHA256",
    desc: "Chaque document signé est hashé. Toute modification est détectable.",
  },
  {
    title: "Audit Trail",
    desc: "Chaque action est tracée : date, heure, IP, user-agent.",
  },
  {
    title: "Evidence Chain",
    desc: "Chaîne de preuves immutable pour les litiges et disputes.",
  },
  {
    title: "Rétention légale",
    desc: "Preuves 10 ans • Compta 10 ans • Opérationnel 12 mois",
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-text">
            SafeMotor
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pro/inscription">
              <Button size="sm">Essai gratuit</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-surface to-bg py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">
            Démonstration
          </p>
          <h1 className="text-4xl font-bold text-text md:text-5xl">
            La preuve, en 2 minutes
          </h1>
          <p className="mt-4 text-lg text-muted2">
            Protégez votre garage avec un parcours simple : client → intervention → signature → dossier → export.
          </p>
        </div>
      </section>

      {/* 6 Steps */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-2xl font-semibold text-text">
            Le parcours en 6 étapes
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <Card key={step.num} className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
                    {step.icon}
                  </span>
                  <span className="text-sm font-medium text-muted2">
                    Étape {step.num}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text">
                  {step.title}
                </h3>
                <p className="text-sm text-muted2">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots placeholder */}
      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-2xl font-semibold text-text">
            En images
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { src: "/screenshots/home.png", alt: "Dashboard SafeMotor", caption: "Dashboard" },
              { src: "/screenshots/intervention.svg", alt: "Intervention + Signature", caption: "Intervention & Signature" },
              { src: "/screenshots/export.svg", alt: "Export ZIP", caption: "Export assurance" },
            ].map((img) => (
              <div key={img.src} className="overflow-hidden rounded-xl border border-border bg-bg">
                <div className="relative aspect-video bg-surface2">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Fallback text shown behind image */}
                  <span className="absolute inset-0 flex items-center justify-center text-sm text-muted2">
                    {img.caption}
                  </span>
                </div>
                <div className="p-3 text-center text-sm text-muted2">
                  {img.caption}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted2">
            Captures d&apos;écran de l&apos;application SafeMotor
          </p>
        </div>
      </section>

      {/* Proof Points */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-center text-2xl font-semibold text-text">
            Ce qui fait la différence
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PROOF_POINTS.map((point) => (
              <div
                key={point.title}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <h3 className="mb-1 font-semibold text-text">{point.title}</h3>
                <p className="text-sm text-muted2">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-2xl font-semibold text-text">
            Prêt à protéger votre garage ?
          </h2>
          <p className="mb-8 text-muted2">
            Essai gratuit, sans engagement. Configuration en 5 minutes.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/pro/inscription">
              <Button size="lg">Démarrer l&apos;essai gratuit</Button>
            </Link>
            <Link href="/#tarifs">
              <Button variant="secondary" size="lg">
                Voir les tarifs
              </Button>
            </Link>
            <Link href="/objections">
              <Button variant="ghost" size="lg">
                Questions fréquentes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted2">
          <p>© 2026 SafeMotor. Tous droits réservés.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/legal" className="hover:text-text">
              Mentions légales
            </Link>
            <Link href="/objections" className="hover:text-text">
              FAQ
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
