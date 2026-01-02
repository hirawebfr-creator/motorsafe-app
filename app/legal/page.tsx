import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function LegalPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-6 py-16">
        <Card className="grid gap-6 p-8">
          <div>
            <p className="ms-kicker">Légal</p>
            <h1 className="mt-3 text-3xl font-semibold text-text">Informations légales</h1>
            <p className="mt-2 text-sm text-muted2">
              Cette page sera complétée avec les mentions légales, la politique de confidentialité et les conditions d&apos;utilisation.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-muted2">
            {[
              "Mentions légales et identité de l&apos;éditeur.",
              "Politique de confidentialité et gestion des données.",
              "Conditions générales d&apos;utilisation.",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3">
                {item}
              </div>
            ))}
          </div>

          <Link href="/" className="text-sm font-semibold text-primary hover:text-primaryHover">
            Retour au site
          </Link>
        </Card>
      </div>
    </main>
  );
}
