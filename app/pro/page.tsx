import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProLandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
      <Card className="grid gap-6 text-center p-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Espace pro</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Connexion garages</h1>
          <p className="text-sm text-[color:var(--textMuted)]">
            Connectez-vous ou demandez un compte pro. Chaque demande est validée par l'administration.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/auth/login">
            <Button>Connexion Pro</Button>
          </Link>
          <Link href="/pro/inscription">
            <Button variant="secondary">Créer compte pro</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
