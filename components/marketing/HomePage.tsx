"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  FileText,
  Lock,
  Search,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: d, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted2">
          <Sparkles size={14} className="text-primary2" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted2 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[var(--r)] border border-border/70 bg-surface/70 p-6 shadow-sm backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
              <span className="text-sm font-extrabold tracking-tight text-primary2">
                MS
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text">MotorSafe</div>
              <div className="text-xs text-muted2">SaaS pour garages</div>
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
                S’inscrire <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary2/10 blur-3xl" />
          <div className="absolute left-1/2 top-56 h-72 w-72 -translate-x-1/2 rounded-full bg-surface2/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div initial="hidden" animate="show" variants={stagger} className="relative">
              <motion.div variants={fadeUp} custom={0}>
                <Badge variant="accent" className="inline-flex">
                  <BadgeCheck size={14} />
                  Panel premium pour garages & préparateurs
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={0.06}
                className="mt-5 text-3xl font-extrabold tracking-tight text-text sm:text-5xl"
              >
                La gestion <span className="text-primary2">clients</span>,{" "}
                <span className="text-primary2">véhicules</span> &{" "}
                <span className="text-primary2">interventions</span>
                <br className="hidden sm:block" />
                enfin claire, rapide et pro.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={0.12}
                className="mt-5 max-w-xl text-sm leading-relaxed text-muted2 sm:text-base"
              >
                Centralisez vos dossiers, retrouvez une plaque en 2 secondes, générez vos PDFs et gardez une traçabilité
                propre. MotorSafe est conçu pour inspirer confiance à vos clients et vous faire gagner du temps au
                quotidien.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={0.18}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link href="/pro/inscription" className="inline-flex">
                  <Button variant="primary" size="lg">
                    Créer mon compte <ArrowRight size={16} />
                  </Button>
                </Link>

                <Link href="/auth/login" className="inline-flex">
                  <Button variant="secondary" size="lg">
                    J’ai déjà un compte
                  </Button>
                </Link>

                <div className="text-xs text-muted2">
                  Mise en place rapide • Interface premium • Évolutif
                </div>
              </motion.div>

              <motion.div variants={fadeUp} custom={0.24} className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Search, title: "Recherche instantanée", desc: "Plaque, client, dossier…" },
                  { icon: FileText, title: "PDF & preuves", desc: "Génération simple, propre." },
                  { icon: Lock, title: "Traçabilité", desc: "Conformité & historique." },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="rounded-[var(--r)] border border-border/70 bg-surface/70 p-4 backdrop-blur"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-2xl border border-border bg-surface2">
                        <f.icon size={18} className="text-primary2" />
                      </span>
                      <div className="text-sm font-semibold">{f.title}</div>
                    </div>
                    <div className="mt-2 text-xs text-muted2">{f.desc}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.12 }}
              className="relative"
            >
              <div className="rounded-[calc(var(--r)+8px)] border border-border bg-surface/70 p-3 shadow-sm backdrop-blur">
                <div className="rounded-[var(--r)] border border-border/70 bg-bg p-2">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--r)] border border-border/70 bg-surface2">
                    <Image
                      src="/screenshots/home.png"
                      alt="Aperçu de l’interface MotorSafe"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-6 -left-6 hidden h-20 w-48 rounded-[var(--r)] border border-border bg-surface/70 p-4 backdrop-blur lg:block">
                <div className="text-xs font-semibold text-text">Temps gagné</div>
                <div className="mt-1 text-2xl font-extrabold text-primary2">+30%</div>
                <div className="mt-1 text-xs text-muted2">sur les recherches & dossiers</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-surface/30">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-text">Pensé pour les garages qui veulent un rendu pro.</p>
            <p className="text-sm text-muted2">Dossiers clairs • PDFs propres • Historique traçable</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <GlassCard>
              <div className="flex items-center gap-3">
                <Users className="text-primary2" size={20} />
                <div className="text-sm font-semibold">Clients & historique</div>
              </div>
              <p className="mt-2 text-sm text-muted2">Une fiche client propre, lisible, avec tout l’historique.</p>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-3">
                <Car className="text-primary2" size={20} />
                <div className="text-sm font-semibold">Parc véhicules</div>
              </div>
              <p className="mt-2 text-sm text-muted2">Recherchez, filtrez, retrouvez une plaque en un instant.</p>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-3">
                <Wrench className="text-primary2" size={20} />
                <div className="text-sm font-semibold">Interventions</div>
              </div>
              <p className="mt-2 text-sm text-muted2">Une structure claire pour votre suivi et vos preuves.</p>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle
          eyebrow="Tout est pensé pour aller vite"
          title="Une interface premium, simple à prendre en main."
          subtitle="Moins de clics, plus de clarté. Une UX moderne qui donne confiance au client final."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            {
              icon: Search,
              title: "Recherche globale",
              desc: "Tapez une plaque, un nom, un dossier. Accès direct à l’info.",
            },
            {
              icon: FileText,
              title: "PDF propres",
              desc: "Générez des documents clairs, lisibles, et partageables.",
            },
            {
              icon: Lock,
              title: "Traçabilité",
              desc: "Historique et preuves : vous travaillez plus sereinement.",
            },
            {
              icon: Car,
              title: "Gestion véhicules",
              desc: "Parc structuré, fiches propres, accès rapide aux interventions.",
            },
            {
              icon: Users,
              title: "Gestion clients",
              desc: "Une base saine, claire, et exploitable sans chaos.",
            },
            {
              icon: Wrench,
              title: "Interventions structurées",
              desc: "Des champs utiles, une lecture rapide, et un dossier cohérent.",
            },
          ].map((f) => (
            <motion.div key={f.title} variants={fadeUp} custom={0}>
              <GlassCard className="h-full">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
                    <f.icon size={18} className="text-primary2" />
                  </span>
                  <div className="text-sm font-semibold">{f.title}</div>
                </div>
                <p className="mt-3 text-sm text-muted2">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="border-y border-border/70 bg-surface/30">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
          <SectionTitle eyebrow="Simple & efficace" title="Comment ça marche" subtitle="3 étapes. Un dossier clair. Un rendu pro." />

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                n: "01",
                t: "Créez le client",
                d: "Nom, infos, garage. Tout est prêt pour travailler proprement.",
              },
              {
                n: "02",
                t: "Ajoutez le véhicule",
                d: "Plaque, VIN, carburant, modèle. La fiche est complète et lisible.",
              },
              {
                n: "03",
                t: "Suivez l’intervention",
                d: "Détails, date, kilométrage, ECU… et génération de documents si besoin.",
              },
            ].map((s) => (
              <GlassCard key={s.n}>
                <div className="text-xs font-semibold text-muted2">{s.n}</div>
                <div className="mt-2 text-lg font-extrabold">{s.t}</div>
                <p className="mt-2 text-sm text-muted2">{s.d}</p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 rounded-[var(--r)] border border-border bg-bg/50 p-6 backdrop-blur sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-semibold">Prêt à tester MotorSafe ?</div>
              <div className="mt-1 text-sm text-muted2">Crée ton compte pro et commence à structurer tes dossiers.</div>
            </div>
            <Link href="/pro/inscription">
              <Button variant="primary" size="lg">
                S’inscrire <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <SectionTitle
          eyebrow="Questions fréquentes"
          title="Tout ce qu’il faut savoir"
          subtitle="Si tu veux, on peut ensuite ajouter des témoignages réels de garages testeurs."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {[
            {
              q: "Est-ce que je peux retrouver un dossier rapidement ?",
              a: "Oui. Recherche par plaque, client ou mots-clés. L’objectif : 2 secondes pour retrouver l’info.",
            },
            {
              q: "La génération PDF est incluse ?",
              a: "Oui, MotorSafe est pensé pour produire des documents propres et partageables selon les modules activés.",
            },
            {
              q: "Est-ce adapté à plusieurs utilisateurs ?",
              a: "Oui, on structure pour évoluer : rôles, accès, et organisation selon l’atelier.",
            },
            {
              q: "C’est fait pour un rendu vraiment pro ?",
              a: "Oui : lisible, premium, cohérent. Le but est aussi de renforcer la confiance client.",
            },
          ].map((item) => (
            <GlassCard key={item.q}>
              <details className="group">
                <summary className="cursor-pointer list-none text-sm font-semibold">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-muted2 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted2">{item.a}</p>
              </details>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="border-t border-border/70 bg-surface/30">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
          <div className="grid gap-6 rounded-[var(--r)] border border-border bg-bg/50 p-8 backdrop-blur lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Passe un cap : dossiers clairs, rendu premium.
              </div>
              <p className="mt-3 text-sm text-muted2 sm:text-base">
                MotorSafe est pensé pour les pros qui veulent une gestion propre, rapide et crédible. Commence maintenant.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
              <Link href="/pro/inscription" className="inline-flex">
                <Button variant="primary" size="lg">
                  S’inscrire <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/auth/login" className="inline-flex">
                <Button variant="secondary" size="lg">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>

          <footer className="mt-10 flex flex-col gap-2 text-xs text-muted2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} MotorSafe. Tous droits réservés.</div>
            <div className="flex gap-4">
              <Link href="/legal" className="hover:text-text">
                Mentions légales
              </Link>
              <Link href="/pro/inscription" className="hover:text-text">
                Inscription pro
              </Link>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
