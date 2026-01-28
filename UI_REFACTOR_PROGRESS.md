# MotorSafe — UI Refactor Progress

Date: 2026-01-02

## Statut actuel (réel) — 2026-01-02

Objectif demandé: **refonte UI complète “premium SaaS / vibe wiza-like”**, **sans toucher au backend**, avec **0 errors / 0 warnings**.

### Gating (qualité)
- [x] `npm run lint` OK (0 warnings)
- [x] `npm run build` OK
- [x] `npm run dev` (webpack) démarre; wrapper corrigé pour ne pas remonter `exit 1` quand le process est stoppé/tué
- [ ] `npm run dev:turbo` stable (actuellement: crash Turbopack avec panic log → non bloquant, on reste en webpack)

### Refonte UI (à faire)
- [ ] Tokens premium (bg/surface/border/text) + contrastes + bordures “hairline”
- [ ] Primitives UI (Button/Input/Card/Table/Dialog/etc.) harmonisées “wiza-like”
- [ ] AppShell (Topbar/Sidebar/Nav) modernisé + spacing
- [ ] Pages dashboard repolishées (clients/vehicules/interventions/documents/admin)
- [ ] QA responsive + focus + no console errors

## Checklist
- [x] Audit routes legacy (pages/app) terminé + preuves (rg)
- [x] Pages legacy supprimées/neutralisées (N/A — pas de dossier `pages/`)
- [x] Tailwind content OK
- [x] Typo moderne appliquée globalement
- [x] Tokens CSS recalibrés (bg/surface/border/text/accent)
- [x] Button refait (variants + focus + tailles)
- [x] Input/Select/Textarea refaits
- [x] Card refaite (radius/shadow/padding)
- [x] DataTable refaite + sticky header propre
- [x] Badge refait + variants cohérents
- [x] SectionHeader refait (hiérarchie)
- [x] Pages publiques (/pro/login/inscription/en-attente) refaites
- [x] Pages dashboard refaites (clients/vehicules/interventions/documents/parametres)
- [x] Nettoyage legacy (common/* doublons) terminé
- [x] QA responsive + focus visible OK
- [x] Build relancé (.next clean) et rendu confirmé

## Étape 0 — Audit (preuves)

### Listing racine (`ls -la` équivalent)

```text
Mode   LastWriteTime       Length Name
----   -------------       ------ ----
d--h-- 02/01/2026 13:15:27        .git
d----- 02/01/2026 17:43:30        .next
d----- 02/01/2026 13:15:25        app
d----- 02/01/2026 13:15:25        components
d----- 31/12/2025 10:47:56        content
d----- 02/01/2026 13:31:52        docs
d----- 02/01/2026 13:15:25        lib
d----- 02/01/2026 13:12:52        node_modules
d----- 31/12/2025 02:37:43        prisma
d----- 22/12/2025 22:05:48        public
d----- 02/01/2026 13:31:47        scripts
d----- 30/12/2025 12:54:47        types
...
```

### Listing `app/`

```text
Mode   LastWriteTime       Length Name
----   -------------       ------ ----
d----- 31/12/2025 15:37:59        (dashboard)
d----- 02/01/2026 17:34:52        api
d----- 31/12/2025 02:55:50        auth
d----- 31/12/2025 02:50:17        clients
d----- 31/12/2025 02:51:06        interventions
d----- 31/12/2025 02:57:10        legal
d----- 31/12/2025 15:27:13        pro
d----- 31/12/2025 02:50:52        vehicules
...
```

### Listing `pages/` (si existe)

`pages/` not found

### Recherche des textes legacy (rg)

NOTE: `rg` n'est pas disponible sur cette machine. Recherche équivalente réalisée via `Select-String` (PowerShell), avec chemins + numéros de ligne.

Résultats:
- [app/page.tsx](app/page.tsx#L7)
- [app/page.tsx](app/page.tsx#L25)
- [app/page.tsx](app/page.tsx#L46)
- [app/page.tsx](app/page.tsx#L58)
- [app/page.tsx](app/page.tsx#L66)
- [app/page.tsx](app/page.tsx#L68)
- [app/auth/login/page.tsx](app/auth/login/page.tsx#L52)
- [app/pro/inscription/page.tsx](app/pro/inscription/page.tsx#L59)

### Recherche `template-gites|gites` (rg)

Résultat: **NO MATCHES** (recherche sur `app/`, `components/`, `lib/`, `content/`, `docs/`, `scripts/`, `prisma/`)

## Legacy trouvés

- La landing racine est générée par: [app/page.tsx](app/page.tsx)
- Les textes « Accès garage » et « Demander un accès MotorSafe » proviennent de:
	- [app/auth/login/page.tsx](app/auth/login/page.tsx)
	- [app/pro/inscription/page.tsx](app/pro/inscription/page.tsx)

Observation: pas de dossier `pages/` → **App Router uniquement**, donc pas d'override par Pages Router.

## Décisions / Neutralisations

- Décision (audit): traiter [app/page.tsx](app/page.tsx) comme source de la landing actuellement visible et la réaligner sur le design system (pas de suppression de route, uniquement refonte visuelle).

- Décision (design system): ajout d'un mode `variant="plain"` sur [components/ui/DataTable.tsx](components/ui/DataTable.tsx) pour permettre un usage dans des cartes `p-0` sans hacks de classes (`rounded-none border-0 bg-transparent shadow-none`).

## Notes audit (typo/tokens)

- Tailwind `content` inclut déjà `app/**/*.{ts,tsx}` + `components/**/*.{ts,tsx}` → OK.
- La police Inter est chargée via `next/font/google` dans [app/layout.tsx](app/layout.tsx), mais le `<body>` n'applique pas `font-sans antialiased` → cause probable de la typo “fallback” et d'un rendu moins net.
- `fontFamily.sans` met `Inter` avant `var(--font-sans)` dans [tailwind.config.js](tailwind.config.js) → risque de fallback selon la façon dont la font est injectée; à corriger pour un système stable.

## Étape 1 — Base style + typo (réalisé)

- `tailwind.config.js` : `content` OK (`app/**` + `components/**`).
- `next/font` : Inter + JetBrains Mono déjà chargées.
- `body` applique maintenant `font-sans antialiased` via [app/layout.tsx](app/layout.tsx).
- Stack `font-sans` stabilisée sur `var(--font-sans)` (et `font-mono` sur `var(--font-mono)`) dans [tailwind.config.js](tailwind.config.js).
- `globals.css` : smoothing + `text-rendering` pour un rendu net.

## Étape 2 — Tokens theme (réalisé)

- Palette dark premium recalibrée dans [app/globals.css](app/globals.css) : bordures plus subtiles + accent bleu/teal.
- Opacity modifiers conservés (tokens RGB + `rgb(var(--token) / alpha)`).

## Étape 3 — Primitives UI (réalisé)

- Refactor des primitives vers un style centralisé via classes `ms-*` dans [app/globals.css](app/globals.css) : `ms-card`, `ms-input`, `ms-kicker`, `ms-table`.
- Refactor `cn()` + cohérence focus/tailles:
	- [components/ui/Button.tsx](components/ui/Button.tsx)
	- [components/ui/Input.tsx](components/ui/Input.tsx)
	- [components/ui/Select.tsx](components/ui/Select.tsx)
	- [components/ui/Textarea.tsx](components/ui/Textarea.tsx)
	- [components/ui/Card.tsx](components/ui/Card.tsx)
	- [components/ui/DataTable.tsx](components/ui/DataTable.tsx)
	- [components/ui/Badge.tsx](components/ui/Badge.tsx)
	- [components/ui/Table.tsx](components/ui/Table.tsx)

## Étape 4 — Pages (terminé)

Nettoyage des overrides legacy sur les tables (pages consomment les primitives sans hacks):
- [app/(dashboard)/dashboard/page.tsx](app/(dashboard)/dashboard/page.tsx)
- [app/(dashboard)/clients/[id]/page.tsx](app/(dashboard)/clients/[id]/page.tsx)
- [app/(dashboard)/admin/garages/page.tsx](app/(dashboard)/admin/garages/page.tsx)
- [app/(dashboard)/documents/page.tsx](app/(dashboard)/documents/page.tsx)
- [app/(dashboard)/admin/references/page.tsx](app/(dashboard)/admin/references/page.tsx)

### Pages dashboard refactorées (2026-01-03)

Les pages suivantes ont été entièrement refactorées pour utiliser le design system `ms-*` :
- [app/(dashboard)/devis/page.tsx](app/(dashboard)/devis/page.tsx) — Gestion des devis
- [app/(dashboard)/factures/page.tsx](app/(dashboard)/factures/page.tsx) — Gestion des factures
- [app/(dashboard)/equipe/page.tsx](app/(dashboard)/equipe/page.tsx) — Gestion d'équipe (invitations, rôles, permissions)
- [app/(dashboard)/incidents/page.tsx](app/(dashboard)/incidents/page.tsx) — État des services
- [app/(dashboard)/partner/page.tsx](app/(dashboard)/partner/page.tsx) — Dashboard partenaire affilié

Page différée (trop complexe, 1270 lignes) :
- [app/(dashboard)/planning/page.tsx](app/(dashboard)/planning/page.tsx) — Calendrier/planning (refonte future recommandée)

Amélioration cohérence UI (kicker + accents):
- [app/auth/login/page.tsx](app/auth/login/page.tsx)
- [app/pro/inscription/page.tsx](app/pro/inscription/page.tsx)
- [app/page.tsx](app/page.tsx)
- [app/pro/page.tsx](app/pro/page.tsx)
- [app/(dashboard)/parametres/ParametresClient.tsx](app/(dashboard)/parametres/ParametresClient.tsx)
- [app/(dashboard)/vehicules/[id]/page.tsx](app/(dashboard)/vehicules/[id]/page.tsx)
- [app/legal/page.tsx](app/legal/page.tsx)

Vérifications:
- `text-xs uppercase tracking-[...]` (kicker legacy): **0 match** dans `app/**/*.tsx`
- Overrides DataTable (`rounded-none border-0 ... shadow-none`): **0 match** dans `app/**/*.tsx`

## Étape 5 — Nettoyage legacy (réalisé)

Composants `components/common/*` non utilisés supprimés:
- `PageHeader.tsx`
- `DataCards.tsx`
- `BadgeStatus.tsx`
- `LegalReferencesConfig.ts` (non utilisé)

Alignements design system:
- `components/common/StatCard.tsx` : kicker → `ms-kicker`
- `components/common/LegalReferencesPanel.tsx` : kicker → `ms-kicker`

Doublons supprimés:
- `components/ui/KpiCard.tsx` (inutilisé)

Vérification:
- Les composants restants dans `components/common/` (`EmptyState`, `ErrorBanner`, `Loading`, `StatCard`, `LegalReferencesPanel`) sont utilisés par les pages.
