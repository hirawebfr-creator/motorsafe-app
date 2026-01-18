"use client";

import Link from "next/link";

export default function OnepagerProtectionPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 print:bg-white">
      {/* Print-friendly A4 layout */}
      <div className="mx-auto max-w-[210mm] p-8 print:p-0">
        {/* Header */}
        <header className="mb-8 border-b-2 border-blue-600 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">SafeMotor</h1>
              <p className="text-sm text-gray-600">La protection du garage auto</p>
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
            Protégez votre garage des litiges
          </h2>
          <p className="text-gray-600">
            Un client de mauvaise foi, une assurance qui se retourne contre vous, 
            une panne après intervention... SafeMotor vous donne les preuves pour vous défendre.
          </p>
        </section>

        {/* 3 columns */}
        <section className="mb-8 grid grid-cols-3 gap-6">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 text-2xl">📄</div>
            <h3 className="mb-1 font-semibold text-gray-900">Documents signés</h3>
            <p className="text-sm text-gray-600">
              Ordre de réparation, PV de restitution, devis. 
              Signés sur mobile par le client, horodatés.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 text-2xl">🔐</div>
            <h3 className="mb-1 font-semibold text-gray-900">Preuves inviolables</h3>
            <p className="text-sm text-gray-600">
              Hash SHA256, audit trail, chaîne de preuves. 
              Toute modification est détectable.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 text-2xl">📦</div>
            <h3 className="mb-1 font-semibold text-gray-900">Export assurance</h3>
            <p className="text-sm text-gray-600">
              Un ZIP contenant tout : documents, photos, historique. 
              Prêt pour l&apos;expert ou l&apos;avocat.
            </p>
          </div>
        </section>

        {/* Key points */}
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Ce qui fait la différence
          </h3>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Signature mobile (QR code) — pas de papier perdu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Date, heure, IP enregistrés — preuve opposable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Clauses légales intégrées (assurance, homologation)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Rétention 10 ans — conforme aux obligations légales</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Dossier incident pour les cas complexes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Mode dispute — verrouillage anti-modification</span>
            </li>
          </ul>
        </section>

        {/* Quote */}
        <section className="mb-8 rounded-lg bg-blue-50 p-6">
          <blockquote className="italic text-gray-700">
            &ldquo;Un seul litige mal géré peut coûter des milliers d&apos;euros et des mois de stress. 
            Avec SafeMotor, le jour où on vous cherche, vous avez tout.&rdquo;
          </blockquote>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="mb-2 font-semibold text-gray-900">
            Essai gratuit — Configuration en 5 minutes
          </p>
          <p className="text-sm text-gray-600">
            safemotor.fr/pro/inscription
          </p>
        </section>

        {/* Print button (hidden in print) */}
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
