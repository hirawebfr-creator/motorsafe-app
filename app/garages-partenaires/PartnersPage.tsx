"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Phone, Globe, Building2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================
// Types
// ============================================================

type Partner = {
  id: number;
  name: string;
  city: string | null;
  postalCode: string | null;
  department: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
};

type ApiResponse = {
  ok: boolean;
  data: Partner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// French departments list (simplified for MVP)
const DEPARTMENTS = [
  { code: "", label: "Tous les départements" },
  { code: "01", label: "01 - Ain" },
  { code: "02", label: "02 - Aisne" },
  { code: "03", label: "03 - Allier" },
  { code: "04", label: "04 - Alpes-de-Haute-Provence" },
  { code: "05", label: "05 - Hautes-Alpes" },
  { code: "06", label: "06 - Alpes-Maritimes" },
  { code: "07", label: "07 - Ardèche" },
  { code: "08", label: "08 - Ardennes" },
  { code: "09", label: "09 - Ariège" },
  { code: "10", label: "10 - Aube" },
  { code: "11", label: "11 - Aude" },
  { code: "12", label: "12 - Aveyron" },
  { code: "13", label: "13 - Bouches-du-Rhône" },
  { code: "14", label: "14 - Calvados" },
  { code: "15", label: "15 - Cantal" },
  { code: "16", label: "16 - Charente" },
  { code: "17", label: "17 - Charente-Maritime" },
  { code: "18", label: "18 - Cher" },
  { code: "19", label: "19 - Corrèze" },
  { code: "2A", label: "2A - Corse-du-Sud" },
  { code: "2B", label: "2B - Haute-Corse" },
  { code: "21", label: "21 - Côte-d'Or" },
  { code: "22", label: "22 - Côtes-d'Armor" },
  { code: "23", label: "23 - Creuse" },
  { code: "24", label: "24 - Dordogne" },
  { code: "25", label: "25 - Doubs" },
  { code: "26", label: "26 - Drôme" },
  { code: "27", label: "27 - Eure" },
  { code: "28", label: "28 - Eure-et-Loir" },
  { code: "29", label: "29 - Finistère" },
  { code: "30", label: "30 - Gard" },
  { code: "31", label: "31 - Haute-Garonne" },
  { code: "32", label: "32 - Gers" },
  { code: "33", label: "33 - Gironde" },
  { code: "34", label: "34 - Hérault" },
  { code: "35", label: "35 - Ille-et-Vilaine" },
  { code: "36", label: "36 - Indre" },
  { code: "37", label: "37 - Indre-et-Loire" },
  { code: "38", label: "38 - Isère" },
  { code: "39", label: "39 - Jura" },
  { code: "40", label: "40 - Landes" },
  { code: "41", label: "41 - Loir-et-Cher" },
  { code: "42", label: "42 - Loire" },
  { code: "43", label: "43 - Haute-Loire" },
  { code: "44", label: "44 - Loire-Atlantique" },
  { code: "45", label: "45 - Loiret" },
  { code: "46", label: "46 - Lot" },
  { code: "47", label: "47 - Lot-et-Garonne" },
  { code: "48", label: "48 - Lozère" },
  { code: "49", label: "49 - Maine-et-Loire" },
  { code: "50", label: "50 - Manche" },
  { code: "51", label: "51 - Marne" },
  { code: "52", label: "52 - Haute-Marne" },
  { code: "53", label: "53 - Mayenne" },
  { code: "54", label: "54 - Meurthe-et-Moselle" },
  { code: "55", label: "55 - Meuse" },
  { code: "56", label: "56 - Morbihan" },
  { code: "57", label: "57 - Moselle" },
  { code: "58", label: "58 - Nièvre" },
  { code: "59", label: "59 - Nord" },
  { code: "60", label: "60 - Oise" },
  { code: "61", label: "61 - Orne" },
  { code: "62", label: "62 - Pas-de-Calais" },
  { code: "63", label: "63 - Puy-de-Dôme" },
  { code: "64", label: "64 - Pyrénées-Atlantiques" },
  { code: "65", label: "65 - Hautes-Pyrénées" },
  { code: "66", label: "66 - Pyrénées-Orientales" },
  { code: "67", label: "67 - Bas-Rhin" },
  { code: "68", label: "68 - Haut-Rhin" },
  { code: "69", label: "69 - Rhône" },
  { code: "70", label: "70 - Haute-Saône" },
  { code: "71", label: "71 - Saône-et-Loire" },
  { code: "72", label: "72 - Sarthe" },
  { code: "73", label: "73 - Savoie" },
  { code: "74", label: "74 - Haute-Savoie" },
  { code: "75", label: "75 - Paris" },
  { code: "76", label: "76 - Seine-Maritime" },
  { code: "77", label: "77 - Seine-et-Marne" },
  { code: "78", label: "78 - Yvelines" },
  { code: "79", label: "79 - Deux-Sèvres" },
  { code: "80", label: "80 - Somme" },
  { code: "81", label: "81 - Tarn" },
  { code: "82", label: "82 - Tarn-et-Garonne" },
  { code: "83", label: "83 - Var" },
  { code: "84", label: "84 - Vaucluse" },
  { code: "85", label: "85 - Vendée" },
  { code: "86", label: "86 - Vienne" },
  { code: "87", label: "87 - Haute-Vienne" },
  { code: "88", label: "88 - Vosges" },
  { code: "89", label: "89 - Yonne" },
  { code: "90", label: "90 - Territoire de Belfort" },
  { code: "91", label: "91 - Essonne" },
  { code: "92", label: "92 - Hauts-de-Seine" },
  { code: "93", label: "93 - Seine-Saint-Denis" },
  { code: "94", label: "94 - Val-de-Marne" },
  { code: "95", label: "95 - Val-d'Oise" },
  { code: "971", label: "971 - Guadeloupe" },
  { code: "972", label: "972 - Martinique" },
  { code: "973", label: "973 - Guyane" },
  { code: "974", label: "974 - La Réunion" },
  { code: "976", label: "976 - Mayotte" },
];

// ============================================================
// Component
// ============================================================

export default function PartnersPage() {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch partners
  useEffect(() => {
    async function fetchPartners() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("query", debouncedQuery);
        if (selectedDept) params.set("dept", selectedDept);
        params.set("limit", "100");

        const res = await fetch(`/api/public/partners?${params.toString()}`);
        const json: ApiResponse = await res.json();

        if (json.ok) {
          setPartners(json.data);
        }
      } catch (err) {
        console.error("Error fetching partners:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPartners();
  }, [debouncedQuery, selectedDept]);

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
              <span className="text-sm font-extrabold tracking-tight text-primary2">
                SM
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text">SafeMotor</div>
              <div className="text-xs text-muted2">Garages partenaires</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="secondary" size="md">
                Se connecter
              </Button>
            </Link>
            <Link href="/pro/inscription">
              <Button variant="primary" size="md">
                Rejoindre <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary2/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted2">
              <Building2 size={14} className="text-primary2" />
              Réseau de confiance
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
              Trouvez un <span className="text-primary2">garage partenaire</span> près de chez vous
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted2 sm:text-base">
              Les garages partenaires SafeMotor sont des professionnels de confiance qui utilisent notre plateforme
              pour vous offrir un service transparent et de qualité.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="border-b border-border/50 bg-surface/50">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, ville ou code postal..."
                className="w-full rounded-xl border border-border bg-bg py-3 pl-10 pr-4 text-sm outline-none focus:border-primary2 focus:ring-2 focus:ring-primary2/20"
              />
            </div>

            {/* Department filter */}
            <div className="sm:w-64">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg py-3 px-4 text-sm outline-none focus:border-primary2 focus:ring-2 focus:ring-primary2/20"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Partners List */}
      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary2" />
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={48} className="mx-auto mb-4 text-muted2/50" />
            <h2 className="text-xl font-semibold text-text mb-2">
              Aucun garage partenaire trouvé
            </h2>
            <p className="text-sm text-muted2 mb-6">
              {debouncedQuery || selectedDept
                ? "Essayez de modifier vos critères de recherche."
                : "Nos premiers garages partenaires arrivent bientôt !"}
            </p>
            <Link href="/pro/inscription">
              <Button variant="primary" size="md">
                Vous êtes un garage ? Rejoignez-nous <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-muted2">
              {partners.length} garage{partners.length > 1 ? "s" : ""} partenaire
              {partners.length > 1 ? "s" : ""} trouvé{partners.length > 1 ? "s" : ""}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-bg">
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <Building2 size={24} className="text-muted2" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text truncate">
                        {partner.name}
                      </h3>
                      {(partner.city || partner.postalCode) && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted2">
                          <MapPin size={14} className="flex-shrink-0" />
                          <span className="truncate">
                            {partner.city}
                            {partner.postalCode ? ` (${partner.postalCode})` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact links */}
                  {(partner.phone || partner.website) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {partner.phone && (
                        <a
                          href={`tel:${partner.phone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface2"
                        >
                          <Phone size={12} />
                          {partner.phone}
                        </a>
                      )}
                      {partner.website && (
                        <a
                          href={
                            partner.website.startsWith("http")
                              ? partner.website
                              : `https://${partner.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-medium text-primary2 transition-colors hover:bg-surface2"
                        >
                          <Globe size={12} />
                          Site web
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 bg-surface/50">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-text mb-3">
            Vous êtes un garage professionnel ?
          </h2>
          <p className="text-sm text-muted2 mb-6 max-w-xl mx-auto">
            Rejoignez le réseau SafeMotor et bénéficiez d&apos;une visibilité accrue,
            d&apos;outils de gestion performants et de la confiance de nos utilisateurs.
          </p>
          <Link href="/pro/inscription">
            <Button variant="primary" size="lg">
              Devenir partenaire SafeMotor <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* SEO Content */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <div className="prose prose-sm max-w-none text-muted2">
            <h2 className="text-lg font-semibold text-text mb-4">
              Pourquoi choisir un garage partenaire SafeMotor ?
            </h2>
            <p>
              Les garages partenaires SafeMotor sont des professionnels de l&apos;automobile qui ont fait le choix
              d&apos;utiliser notre plateforme de gestion pour vous offrir un service de qualité supérieure.
              En choisissant un garage partenaire, vous bénéficiez d&apos;une traçabilité complète de vos interventions,
              de documents clairs et professionnels, et d&apos;une communication transparente.
            </p>
            <p>
              Notre réseau de garages partenaires couvre l&apos;ensemble du territoire français : des grandes
              métropoles comme Paris, Lyon, Marseille, Toulouse, Bordeaux, aux villes moyennes et zones rurales.
              Que vous cherchiez un garage pour l&apos;entretien courant de votre véhicule, une réparation
              mécanique, un diagnostic électronique ou une préparation au contrôle technique, nos partenaires
              sont là pour vous accompagner.
            </p>
            <p>
              Chaque garage partenaire s&apos;engage à respecter les standards de qualité SafeMotor : devis
              détaillés avant intervention, ordres de réparation conformes à la réglementation, factures claires
              et conservation de l&apos;historique de vos véhicules. La transparence est au cœur de notre
              démarche pour renforcer la confiance entre les professionnels et leurs clients.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-surface2/50">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-sm text-muted2">
              © {new Date().getFullYear()} SafeMotor. Tous droits réservés.
            </div>
            <div className="flex gap-4 text-sm text-muted2">
              <Link href="/legal" className="hover:text-text">
                Mentions légales
              </Link>
              <Link href="/" className="hover:text-text">
                Accueil
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
