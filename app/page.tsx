import Head from "next/head";
import Link from "next/link";
import ResponsiveSidebar from "@/components/layout/responsive/ResponsiveSidebar";

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>MotorSafe Pro – Gestion de garages et interventions</title>
        <meta name="description" content="La plateforme SaaS tout-en-un pour les garages, pros et flottes. Gérez clients, véhicules, interventions, documents et conformité. Inspiré des leaders SaaS mondiaux." />
        <meta name="keywords" content="garage, SaaS, gestion, flotte, automobile, interventions, pros, MotorSafe, logiciel garage, cloud, maintenance, conformité, CRM, ERP" />
        <meta property="og:title" content="MotorSafe Pro – Gestion de garages et interventions" />
        <meta property="og:description" content="La plateforme SaaS tout-en-un pour les garages, pros et flottes. Gérez clients, véhicules, interventions, documents et conformité. Inspiré des leaders SaaS mondiaux." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://motorsafe.fr" />
        <meta property="og:image" content="/og-motorsafe.png" />
        <link rel="canonical" href="https://motorsafe.fr" />
      </Head>
      <div className="hidden md:flex min-h-screen w-full">
        <ResponsiveSidebar>
          <></>
        </ResponsiveSidebar>
        <main className="flex-1 w-full bg-gradient-to-br from-[#1a1a2e] to-[#23234b] text-white flex flex-col items-center justify-center px-4">
          <header className="w-full max-w-5xl mx-auto flex flex-col items-center py-16">
            <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-6 tracking-tight">MotorSafe Pro</h1>
            <p className="text-xl md:text-2xl text-center max-w-2xl mb-8">La plateforme SaaS inspirée des meilleurs outils mondiaux (ex: Revolut, Notion, Stripe) pour gérer votre garage, vos clients, vos véhicules et vos interventions, en toute simplicité et conformité.</p>
            <Link href="/auth/login" className="inline-block px-8 py-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-lg shadow-lg hover:scale-105 transition">Démarrer maintenant</Link>
          </header>
          <section className="w-full max-w-5xl mx-auto grid md:grid-cols-3 gap-8 py-12">
            <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center text-center shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Gestion complète</h2>
              <p>Clients, véhicules, interventions, documents, conformité : tout est centralisé, accessible partout.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center text-center shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Expérience premium</h2>
              <p>Interface inspirée de Revolut, Notion, Stripe : rapide, fluide, responsive, dark mode, accessible.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center text-center shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Sécurité & conformité</h2>
              <p>Données chiffrées, conformité RGPD, accès multi-profils, audit trail, hébergement France/EU.</p>
            </div>
          </section>
          <section className="w-full max-w-5xl mx-auto py-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Pourquoi choisir MotorSafe ?</h2>
            <ul className="grid md:grid-cols-2 gap-6 text-lg">
              <li>✔️ Inspiré des leaders SaaS mondiaux (Revolut, Notion, Stripe, Salesforce, Zendesk)</li>
              <li>✔️ 100% cloud, aucune installation, accès sécurisé partout</li>
              <li>✔️ Support réactif, évolutif, API ouverte</li>
              <li>✔️ Optimisé SEO, rapide, mobile-first, PWA</li>
              <li>✔️ Mises à jour automatiques, conformité légale</li>
              <li>✔️ Essai gratuit, sans engagement</li>
            </ul>
          </section>
          <footer className="w-full max-w-5xl mx-auto py-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} MotorSafe. Plateforme SaaS pour garages et pros. Inspiré par les meilleurs outils du monde.
          </footer>
        </main>
      </div>
      {/* Mobile layout : landing page sans sidebar */}
      <main className="flex flex-col md:hidden min-h-screen w-full bg-gradient-to-br from-[#1a1a2e] to-[#23234b] text-white items-center justify-center px-4">
        <header className="w-full max-w-5xl mx-auto flex flex-col items-center py-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-6 tracking-tight">MotorSafe Pro</h1>
          <p className="text-xl md:text-2xl text-center max-w-2xl mb-8">La plateforme SaaS inspirée des meilleurs outils mondiaux (ex: Revolut, Notion, Stripe) pour gérer votre garage, vos clients, vos véhicules et vos interventions, en toute simplicité et conformité.</p>
          <Link href="/auth/login" className="inline-block px-8 py-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-lg shadow-lg hover:scale-105 transition">Démarrer maintenant</Link>
        </header>
        <section className="w-full max-w-5xl mx-auto grid md:grid-cols-3 gap-8 py-12">
          <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Gestion complète</h2>
            <p>Clients, véhicules, interventions, documents, conformité : tout est centralisé, accessible partout.</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Expérience premium</h2>
            <p>Interface inspirée de Revolut, Notion, Stripe : rapide, fluide, responsive, dark mode, accessible.</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Sécurité & conformité</h2>
            <p>Données chiffrées, conformité RGPD, accès multi-profils, audit trail, hébergement France/EU.</p>
          </div>
        </section>
        <section className="w-full max-w-5xl mx-auto py-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Pourquoi choisir MotorSafe ?</h2>
          <ul className="grid md:grid-cols-2 gap-6 text-lg">
            <li>✔️ Inspiré des leaders SaaS mondiaux (Revolut, Notion, Stripe, Salesforce, Zendesk)</li>
            <li>✔️ 100% cloud, aucune installation, accès sécurisé partout</li>
            <li>✔️ Support réactif, évolutif, API ouverte</li>
            <li>✔️ Optimisé SEO, rapide, mobile-first, PWA</li>
            <li>✔️ Mises à jour automatiques, conformité légale</li>
            <li>✔️ Essai gratuit, sans engagement</li>
          </ul>
        </section>
        <footer className="w-full max-w-5xl mx-auto py-8 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} MotorSafe. Plateforme SaaS pour garages et pros. Inspiré par les meilleurs outils du monde.
        </footer>
      </main>
    </>
  );
}
