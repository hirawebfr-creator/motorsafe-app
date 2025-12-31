import Link from "next/link";
import { ShieldCheck, Sparkles, Wrench, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(139,92,246,0.2)] text-xl font-bold text-[var(--accent)] shadow-[0_18px_40px_rgba(139,92,246,0.35)]">
            M
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">MotorSafe</p>
            <p className="text-lg font-semibold">Panel garages</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-[var(--radius-sm)] border border-[rgba(31,41,55,0.7)] px-5 py-2 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)]"
          >
            Connexion
          </Link>
          <Link
            href="/auth/register-pro"
            className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(139,92,246,0.35)] hover:bg-[var(--accent-2)]"
          >
            Creer compte pro
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <Badge variant="accent">Plateforme garages B2B</Badge>
          <h1 className="text-balance text-4xl font-semibold leading-tight lg:text-5xl">
            MotorSafe pilote vos interventions avec une traceabilite digne des grandes fintechs.
          </h1>
          <p className="text-balance text-base text-[var(--muted)]">
            Un dashboard inspire Revolut pour suivre vos clients, vehicules et dossiers PDF. Multi-garages,
            validations admin, preuves hash et historique revisions.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/auth/register-pro"
              className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(139,92,246,0.35)] hover:bg-[var(--accent-2)]"
            >
              Demander un compte <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(31,41,55,0.7)] px-6 py-3 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)]"
            >
              Se connecter
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Performance atelier</p>
              <Sparkles size={18} className="text-[var(--accent)]" />
            </div>
            <p className="text-2xl font-semibold">Temps reel, zero friction</p>
            <p className="text-sm text-[var(--muted)]">
              Un flux unifie pour verifier vos vehicules, signer les interventions, generer les PDFs.
            </p>
          </Card>
          <Card className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Traceabilite</p>
              <ShieldCheck size={18} className="text-[var(--accent)]" />
            </div>
            <p className="text-2xl font-semibold">Preuves hash integrees</p>
            <p className="text-sm text-[var(--muted)]">
              Chaque dossier conserve l'historique des revisions et les preuves de signature.
            </p>
          </Card>
          <Card className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Equipe pro</p>
              <Wrench size={18} className="text-[var(--accent)]" />
            </div>
            <p className="text-2xl font-semibold">Multi-garages securise</p>
            <p className="text-sm text-[var(--muted)]">
              Chaque garage voit uniquement ses donnees. L'admin valide les comptes avant activation.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-20">
        <Card className="grid gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Conformite & confiance</p>
          <h2 className="text-2xl font-semibold">Traceabilite sans surcouche</h2>
          <p className="text-sm text-[var(--muted)]">
            MotorSafe structure vos donnees: interventions, revisions, preuves hash et journaux de creation.
            Vos dossiers restent exploitables en cas de litige, audit ou assurance.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
            <span>Audit interne rapide</span>
            <span>Historique immuable</span>
            <span>Responsabilite atelier</span>
          </div>
        </Card>
      </section>
    </main>
  );
}
