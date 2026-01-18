"use client";

import Link from "next/link";

export default function OnepagerTarifsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 print:bg-white">
      {/* Print-friendly A4 layout */}
      <div className="mx-auto max-w-[210mm] p-8 print:p-0">
        {/* Header */}
        <header className="mb-8 border-b-2 border-blue-600 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">SafeMotor</h1>
              <p className="text-sm text-gray-600">Tarifs & fonctionnalités</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>safemotor.fr</p>
              <p>contact@safemotor.fr</p>
            </div>
          </div>
        </header>

        {/* Plans */}
        <section className="mb-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Choisissez votre formule
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Free */}
            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900">Gratuit</h3>
              <p className="mb-4 text-3xl font-bold text-gray-900">
                0€<span className="text-sm font-normal text-gray-500">/mois</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>5 véhicules max</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Clients illimités</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Interventions illimitées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>PDF de base</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400">
                  <span>✗</span>
                  <span>Signature électronique</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400">
                  <span>✗</span>
                  <span>Export assurance</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-gray-500">
                Pour tester l&apos;outil
              </p>
            </div>

            {/* Pro */}
            <div className="rounded-lg border-2 border-blue-600 bg-blue-50 p-5">
              <div className="mb-2 text-xs font-semibold uppercase text-blue-600">
                Populaire
              </div>
              <h3 className="text-lg font-bold text-gray-900">Pro</h3>
              <p className="mb-4 text-3xl font-bold text-gray-900">
                29€<span className="text-sm font-normal text-gray-500">/mois</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span><strong>Véhicules illimités</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Clients illimités</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span><strong>Signature électronique</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>PDF personnalisés (logo)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span><strong>Export ZIP assurance</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Dossier incident</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>2 utilisateurs inclus</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-gray-500">
                Pour les garages actifs
              </p>
            </div>

            {/* Business */}
            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900">Business</h3>
              <p className="mb-4 text-3xl font-bold text-gray-900">
                79€<span className="text-sm font-normal text-gray-500">/mois</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Tout Pro +</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span><strong>10 utilisateurs</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Rôles & permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Planning RDV</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Devis & Facturation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>API (sur demande)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Support prioritaire</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-gray-500">
                Pour les équipes
              </p>
            </div>
          </div>
        </section>

        {/* What's included in all plans */}
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Inclus dans toutes les formules
          </h3>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-gray-200 p-3 text-center">
              <p className="font-semibold">🔐</p>
              <p className="text-gray-600">Données chiffrées</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-center">
              <p className="font-semibold">🇪🇺</p>
              <p className="text-gray-600">Hébergement EU</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-center">
              <p className="font-semibold">📱</p>
              <p className="text-gray-600">Mobile-friendly</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-center">
              <p className="font-semibold">✅</p>
              <p className="text-gray-600">RGPD conforme</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Questions fréquentes
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900">Engagement ?</p>
              <p className="text-gray-600">Aucun. Mensuel, résiliable à tout moment.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Essai gratuit ?</p>
              <p className="text-gray-600">Oui, 14 jours sur Pro/Business.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Paiement ?</p>
              <p className="text-gray-600">Carte bancaire, prélèvement Stripe.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Migration ?</p>
              <p className="text-gray-600">Import CSV de vos clients/véhicules.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-lg bg-blue-600 p-6 text-center text-white">
          <p className="text-xl font-bold">Essai gratuit 14 jours</p>
          <p className="mt-1 text-blue-100">
            safemotor.fr/pro/inscription — Sans engagement, sans CB
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
            Tarifs TTC. Peuvent évoluer. Consultez le site pour les tarifs en vigueur.
          </p>
        </footer>
      </div>
    </main>
  );
}
