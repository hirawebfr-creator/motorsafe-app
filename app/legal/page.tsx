import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function LegalPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
      <Card className="grid gap-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--textMuted)]">Légal</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text)]">Informations légales</h1>
        <p className="text-sm text-[color:var(--textMuted)]">
          Cette page sera completee avec les mentions legales, la politique de confidentialite et les
          conditions d'utilisation.
        </p>
        <Link href="/" className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
          Retour au site
        </Link>
      </Card>
    </main>
  );
}
