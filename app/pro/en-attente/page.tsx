import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";

export default function ProPendingPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-16">
        <Card className="w-full max-w-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Badge variant="warning">Validation en cours</Badge>
            <h1 className="text-3xl font-semibold text-text">Compte en validation</h1>
            <p className="text-sm text-muted2">
              Votre dossier est en cours d&apos;analyse par MotorSafe. Nous revenons vers vous dès que la validation est
              terminée.
            </p>
          </div>

          <div className="mt-8 grid gap-3 text-left">
            {[
              "Vérification des informations atelier.",
              "Contrôle des justificatifs et du SIRET.",
              "Activation des accès au dashboard.",
            ].map((step) => (
              <div key={step} className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3 text-sm text-muted2">
                {step}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/auth/login">
              <Button variant="secondary" size="sm">
                Revenir à la connexion
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                Retour site
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
