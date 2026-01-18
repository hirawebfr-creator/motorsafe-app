import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PROCESSING_REGISTRY, DPA_TEMPLATE, GDPR_RIGHTS } from "@/content/gdpr";

export const metadata = {
  title: "Informations légales - SafeMotor",
  description: "Mentions légales, politique de confidentialité et registre RGPD",
};

function LawfulBasisBadge({ basis }: { basis: string }) {
  const colors: Record<string, string> = {
    contract: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    legal_obligation: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    consent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    legitimate_interest: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };
  const labels: Record<string, string> = {
    contract: "Contrat",
    legal_obligation: "Obligation légale",
    consent: "Consentement",
    legitimate_interest: "Intérêt légitime",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[basis] || "bg-gray-100 text-gray-800"}`}>
      {labels[basis] || basis}
    </span>
  );
}

export default function LegalPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="ms-kicker">Légal</p>
          <h1 className="mt-3 text-3xl font-semibold text-text">Informations légales</h1>
          <p className="mt-2 text-sm text-muted2">
            Mentions légales, politique de confidentialité et conformité RGPD
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          <a href="#mentions" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface2 transition-colors">
            Mentions légales
          </a>
          <a href="#registre" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface2 transition-colors">
            Registre des traitements
          </a>
          <a href="#droits" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface2 transition-colors">
            Vos droits
          </a>
          <a href="#dpa" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface2 transition-colors">
            DPA
          </a>
        </div>

        {/* Mentions légales */}
        <section id="mentions" className="mb-12">
          <Card className="p-0 overflow-hidden">
            <div className="ms-cardHeader">
              <h2 className="text-xl font-semibold">Mentions légales</h2>
            </div>
            <div className="ms-cardBody prose prose-sm dark:prose-invert max-w-none">
              <h3>Éditeur</h3>
              <p>
                SafeMotor est un service édité par :<br />
                <strong>SAS SafeMotor</strong><br />
                Capital social : 1 000 €<br />
                Siège social : [À compléter]<br />
                SIRET : [À compléter]<br />
                RCS : [À compléter]
              </p>
              <p>
                Directeur de la publication : [À compléter]<br />
                Contact : contact@safemotor.fr
              </p>

              <h3>Hébergement</h3>
              <p>
                Ce site est hébergé par :<br />
                <strong>Vercel Inc.</strong><br />
                440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
                https://vercel.com
              </p>

              <h3>Propriété intellectuelle</h3>
              <p>
                L&apos;ensemble du contenu de ce site (textes, images, logos, code source) est protégé 
                par le droit d&apos;auteur. Toute reproduction sans autorisation est interdite.
              </p>
            </div>
          </Card>
        </section>

        {/* Registre des traitements RGPD */}
        <section id="registre" className="mb-12">
          <Card className="p-0 overflow-hidden">
            <div className="ms-cardHeader">
              <h2 className="text-xl font-semibold">Registre des traitements de données</h2>
              <p className="mt-1 text-sm text-muted2">Article 30 du RGPD</p>
            </div>
            <div className="ms-cardBody">
              <div className="space-y-6">
                {PROCESSING_REGISTRY.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border/60 bg-surface2/50 p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-medium text-text">{entry.purpose}</h3>
                      <LawfulBasisBadge basis={entry.lawfulBasis} />
                    </div>
                    
                    <div className="grid gap-3 text-sm">
                      <div>
                        <span className="text-muted2">Base légale :</span>{" "}
                        <span className="text-text">{entry.lawfulBasisDetail}</span>
                      </div>
                      
                      <div>
                        <span className="text-muted2">Catégories de données :</span>
                        <ul className="mt-1 list-disc list-inside text-text">
                          {entry.dataCategories.map((cat) => (
                            <li key={cat}>{cat}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <span className="text-muted2">Destinataires :</span>{" "}
                        <span className="text-text">{entry.recipients.join(", ")}</span>
                      </div>
                      
                      <div>
                        <span className="text-muted2">Conservation :</span>{" "}
                        <span className="text-text">{entry.retentionPeriod}</span>
                      </div>
                      
                      {entry.thirdCountryTransfers && (
                        <div>
                          <span className="text-muted2">Transferts hors UE :</span>{" "}
                          <span className="text-text">{entry.thirdCountryTransfers}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Droits des personnes */}
        <section id="droits" className="mb-12">
          <Card className="p-0 overflow-hidden">
            <div className="ms-cardHeader">
              <h2 className="text-xl font-semibold">{GDPR_RIGHTS.title}</h2>
              <p className="mt-1 text-sm text-muted2">{GDPR_RIGHTS.intro}</p>
            </div>
            <div className="ms-cardBody">
              <div className="grid gap-4 sm:grid-cols-2">
                {GDPR_RIGHTS.rights.map((right) => (
                  <div key={right.name} className="rounded-xl border border-border/60 bg-surface2/50 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-text">{right.name}</h3>
                      <span className="text-xs text-muted2">{right.article}</span>
                    </div>
                    <p className="text-sm text-muted2 mb-2">{right.description}</p>
                    <p className="text-sm text-text">
                      <span className="text-muted2">Comment exercer :</span> {right.howTo}
                    </p>
                    {right.limitations && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ {right.limitations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* DPA Template */}
        <section id="dpa" className="mb-12">
          <Card className="p-0 overflow-hidden">
            <div className="ms-cardHeader">
              <h2 className="text-xl font-semibold">{DPA_TEMPLATE.title}</h2>
              <p className="mt-1 text-sm text-muted2">
                Version {DPA_TEMPLATE.version} - Dernière mise à jour : {DPA_TEMPLATE.lastUpdated}
              </p>
            </div>
            <div className="ms-cardBody prose prose-sm dark:prose-invert max-w-none">
              {DPA_TEMPLATE.sections.map((section) => (
                <div key={section.heading} className="mb-6">
                  <h3>{section.heading}</h3>
                  <p className="whitespace-pre-line">{section.content}</p>
                </div>
              ))}
            </div>
            <div className="ms-cardFooter">
              <p className="text-xs text-muted2">
                Ce document est fourni à titre indicatif. Pour un DPA personnalisé, 
                contactez-nous à contact@safemotor.fr
              </p>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="secondary" size="sm">Retour au site</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
