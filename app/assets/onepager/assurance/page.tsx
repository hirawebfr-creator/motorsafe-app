"use client";

import Link from "next/link";

export default function OnepagerAssurancePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 print:bg-white">
      {/* Print-friendly A4 layout */}
      <div className="mx-auto max-w-[210mm] p-8 print:p-0">
        {/* Header */}
        <header className="mb-8 border-b-2 border-blue-600 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">SafeMotor</h1>
              <p className="text-sm text-gray-600">Dossier assurance-ready</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>safemotor.fr</p>
              <p>contact@safemotor.fr</p>
            </div>
          </div>
        </header>

        {/* Title */}
        <section className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Le dossier prêt pour l&apos;assurance ou l&apos;expert
          </h2>
          <p className="text-gray-600">
            En un clic, exportez un ZIP contenant toutes les preuves : 
            documents signés, photos, historique complet, hash de vérification.
          </p>
        </section>

        {/* What's included */}
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Contenu du dossier export
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-900">📄 Documents</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Ordre de Réparation signé</li>
                <li>• PV de restitution signé</li>
                <li>• Devis / Facture</li>
                <li>• Fiche véhicule</li>
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-900">📷 Photos</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Photos d&apos;entrée (état initial)</li>
                <li>• Photos de sortie (travaux finis)</li>
                <li>• Photos incident (si applicable)</li>
                <li>• Horodatées automatiquement</li>
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-900">📋 Historique</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Timeline complète</li>
                <li>• Toutes les actions tracées</li>
                <li>• Dates et heures exactes</li>
                <li>• Utilisateur responsable</li>
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-900">🔐 Preuves</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Hash SHA256 de chaque document</li>
                <li>• Chaîne de preuves (evidence chain)</li>
                <li>• IP et user-agent des signatures</li>
                <li>• Fichier de vérification</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Quand l&apos;utiliser
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-red-50 p-4">
              <p className="font-semibold text-red-800">🚨 Litige client</p>
              <p className="mt-1 text-gray-600">
                Le client conteste les travaux ou refuse de payer.
              </p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="font-semibold text-orange-800">🔍 Expertise</p>
              <p className="mt-1 text-gray-600">
                Un expert demande les preuves de l&apos;intervention.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="font-semibold text-blue-800">📩 Assurance</p>
              <p className="mt-1 text-gray-600">
                L&apos;assureur veut un dossier complet.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Comment ça marche
          </h3>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="mb-2 text-2xl">1️⃣</div>
              <p className="text-sm text-gray-600">
                Ouvrez l&apos;intervention
              </p>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 text-center">
              <div className="mb-2 text-2xl">2️⃣</div>
              <p className="text-sm text-gray-600">
                Cliquez &ldquo;Export ZIP&rdquo;
              </p>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 text-center">
              <div className="mb-2 text-2xl">3️⃣</div>
              <p className="text-sm text-gray-600">
                Téléchargez le dossier
              </p>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 text-center">
              <div className="mb-2 text-2xl">4️⃣</div>
              <p className="text-sm text-gray-600">
                Envoyez à l&apos;assurance
              </p>
            </div>
          </div>
        </section>

        {/* Key stat */}
        <section className="mb-8 rounded-lg bg-green-50 p-6 text-center">
          <p className="text-3xl font-bold text-green-700">10 ans</p>
          <p className="text-gray-600">
            Durée de conservation des preuves signées (conforme aux obligations légales)
          </p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="mb-2 font-semibold text-gray-900">
            Essai gratuit — safemotor.fr/pro/inscription
          </p>
        </section>

        {/* Print button */}
        <div className="mt-8 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Imprimer / Enregistrer en PDF
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Ctrl+P → &ldquo;Enregistrer en PDF&rdquo;
          </p>
          <div className="mt-4">
            <Link href="/demo" className="text-sm text-blue-600 hover:underline">
              ← Retour à la démo
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          <p>© 2026 SafeMotor — safemotor.fr</p>
          <p className="mt-1">
            Document à titre informatif. Ne constitue pas un conseil juridique.
          </p>
        </footer>
      </div>
    </main>
  );
}
