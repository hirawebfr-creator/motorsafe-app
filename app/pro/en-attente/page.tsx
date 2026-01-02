import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ProPendingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-xl text-center p-8">
        <Badge variant="warning">Validation en cours</Badge>
        <h1 className="mt-4 text-3xl font-semibold text-[color:var(--text)]">Compte en validation</h1>
        <p className="mt-3 text-sm text-[color:var(--textMuted)]">
          Votre dossier est en cours d'analyse par MotorSafe. Nous revenons vers vous dès que la
          validation est terminée.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/auth/login" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
            Revenir à la connexion
          </Link>
          <Link href="/" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
            Retour site
          </Link>
        </div>
      </Card>
    </main>
  );
}
