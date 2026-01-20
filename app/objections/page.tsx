import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "FAQ & Objections — SafeMotor",
  description:
    "Réponses aux questions fréquentes sur SafeMotor : coût, assurance, RGPD, temps de mise en place, et plus.",
};

const OBJECTIONS = [
  {
    question: "Pourquoi je paierais ça ?",
    answer: `Parce qu'un seul litige mal géré peut te coûter des milliers d'euros + des mois de stress. 
SafeMotor te donne un dossier propre, signé, horodaté, exportable. 
Le jour où un client ou une assurance te cherche, tu as tout. 
Le coût ? Moins qu'une heure de main d'œuvre par mois.`,
  },
  {
    question: "Mon assureur s'en fiche",
    answer: `Ton assureur veut des preuves. Point. 
Un dossier avec OR signé, photos, hash, historique complet, c'est exactement ce qu'un expert ou un avocat demande. 
SafeMotor te permet de sortir un ZIP "assurance-ready" en un clic. 
Ça change tout quand il faut prouver que tu as bien fait ton travail.`,
  },
  {
    question: "Je fais déjà signer un papier",
    answer: `Un papier, ça se perd, ça se conteste ("c'est pas ma signature"), ça n'a pas de date certifiée. 
Avec SafeMotor : signature sur mobile, horodatée, hashée (SHA256), avec IP et user-agent enregistrés. 
C'est une preuve numérique opposable, pas un bout de papier dans un tiroir.`,
  },
  {
    question: "Et si le client dit qu'il n'a pas signé ?",
    answer: `Tu as : la date + heure exacte, l'adresse IP, le navigateur utilisé, le hash du document avant et après signature, et l'historique complet dans l'audit trail. 
C'est exactement ce qu'un tribunal ou un expert demande. 
Le client peut dire ce qu'il veut, les preuves sont là.`,
  },
  {
    question: "RGPD / données ?",
    answer: `SafeMotor est conforme RGPD. 
Données hébergées en Europe (Vercel/AWS), chiffrées au repos et en transit. 
Rétention : preuves 10 ans, compta 10 ans, opérationnel 12 mois (configurable). 
Tu peux exporter ou anonymiser les données client à tout moment. 
Registre des traitements disponible sur /legal.`,
  },
  {
    question: "Combien de temps ça prend ?",
    answer: `2 minutes par véhicule, max. 
Création client + véhicule : 30 sec (avec recherche par plaque). 
Intervention + OR : 1 min. 
Signature client : le temps qu'il scanne le QR. 
C'est plus rapide que de chercher un stylo et un carbone.`,
  },
  {
    question: "Et si internet tombe ?",
    answer: `Le lien de signature reste valide. Tu peux : 
• Copier le lien et l'envoyer par SMS/WhatsApp 
• Imprimer le QR code 
• Renvoyer le lien plus tard 
Une fois internet revenu, tout se synchronise. 
Et tes documents déjà signés sont stockés, pas perdus.`,
  },
  {
    question: "C'est compliqué à mettre en place ?",
    answer: `Non. Tu crées ton compte, tu configures ton garage (nom, adresse, logo), et tu es prêt. 
Pas d'installation, pas de logiciel à télécharger. 
Ça marche sur PC, tablette, mobile. 
Si tu sais utiliser un navigateur web, tu sais utiliser SafeMotor.`,
  },
];

export default function ObjectionsPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-text">
            SafeMotor
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/demo">
              <Button variant="ghost" size="sm">
                Voir la démo
              </Button>
            </Link>
            <Link href="/pro/inscription">
              <Button size="sm">Essai gratuit</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-surface to-bg py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">
            Questions fréquentes
          </p>
          <h1 className="text-3xl font-bold text-text md:text-4xl">
            Objections & Réponses
          </h1>
          <p className="mt-4 text-muted2">
            Les vraies questions que posent les garagistes. Nos vraies réponses.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-6">
            {OBJECTIONS.map((item, i) => (
              <Card key={i} className="p-0 overflow-hidden">
                <div className="border-b border-border bg-surface2/50 px-6 py-4">
                  <h2 className="text-lg font-semibold text-text">
                    &ldquo;{item.question}&rdquo;
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted2">
                    {item.answer}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-center text-xs text-muted2">
            <strong>Disclaimer :</strong> SafeMotor est un outil de gestion et de traçabilité. 
            Il ne constitue pas un conseil juridique. En cas de litige, consultez un avocat 
            ou votre assureur. Les durées de conservation mentionnées sont indicatives et 
            basées sur les obligations légales françaises en vigueur.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-text">
            Encore des questions ?
          </h2>
          <p className="mb-6 text-muted2">
            Contactez-nous ou testez par vous-même.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/pro/inscription">
              <Button size="lg">Essayer gratuitement</Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="lg">
                Voir la démo
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
            <Link href="/demo" className="hover:text-text">
              Démo
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
