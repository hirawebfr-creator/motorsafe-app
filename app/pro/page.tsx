import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProLandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
      <Card className="grid gap-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Espace pro</p>
          <h1 className="mt-3 text-3xl font-semibold">Connexion garages</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Connectez-vous ou demandez un compte pro. Chaque demande est validee par l'administration.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/auth/login">
            <Button>Connexion Pro</Button>
          </Link>
          <Link href="/pro/inscription">
            <Button variant="secondary">Creer compte pro</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
