# MotorSafe

Panel Next.js (App Router) + Prisma + SQLite avec dashboard pro, multi-garages et validation admin.

## Fonctionnalités

- UI dashboard moderne (sidebar, topbar, cards, tables).
- Multi-garages (chaque garage voit ses donnees).
- Demande de compte pro + validation admin.
- PDF dossier intervention (hash + historique revisions).
- Scripts utilitaires (creation admin, backfill garage).

## Prérequis

- Node.js 22 LTS (ou 20)
- npm
- SQLite (dev) ou DB configurable via Prisma

## Variables d'environnement

Créer un fichier `.env` à la racine :

```
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
ADMIN_KEY="votre-cle-secrete"

# Billing / Stripe (mode test)
APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."

# Limites FREE (optionnel)
FREE_CLIENT_LIMIT="10"
FREE_VEHICLE_LIMIT="10"

# Uploads S3/R2 (optionnel)
S3_BUCKET=""
S3_REGION=""
S3_ENDPOINT=""          # ex: https://<accountid>.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE="0" # mettre 1 pour certains endpoints

# Vehicle Lookup API (optionnel - apiplaqueimmatriculation.com)
APIPLAQUE_TOKEN=""      # Token API pour lookup par plaque
```

En production, adaptez `DATABASE_URL` vers le chemin de la base (ex: `/var/lib/motorsafe/prod.db`).

## Installation locale

```
npm install
npx prisma migrate dev -n init-multi-tenant
npx prisma db seed
npm run backfill:garage
ADMIN_EMAIL="admin@domain.fr" ADMIN_PASSWORD="motdepassefort" npm run create:admin
npm run dev

## Devis / Factures

Docs: `docs/QUOTE_INVOICE_SPEC.md`

API settings:
- `GET/PUT /api/settings/tax`
- `GET/PUT /api/settings/numbering`

API devis:
- `GET/POST /api/quotes`
- `POST /api/quotes/[id]/send|accept|reject|convert`
- `GET /api/quotes/[id]/pdf`

API factures:
- `GET/POST /api/invoices`
- `POST /api/invoices/[id]/issue|mark-paid`
- `GET /api/invoices/[id]/pdf`

Tests:
- `npm run test:quote-invoice`

## Stripe (webhook-first)

Écouter les webhooks Stripe en local :

```
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Puis allez sur:
- `/app/billing` pour lancer un checkout PRO et ouvrir le Customer Portal

Notes:
- Le statut d'abonnement est mis à jour **uniquement** via webhooks (source de vérité).
- Le PDF `/api/interventions/[id]/pdf` est protégé par abonnement actif (PRO).

## Développement (Windows / VS Code)

- `npm run dev` lance Next **webpack** via un wrapper qui neutralise `NODE_OPTIONS` (utile quand l'environnement injecte des flags invalides).
- Si ton terminal/runner coupe les process longs (ou si tu veux le lancer en arrière-plan):
	- `npm run dev:daemon` (logs dans `.dev.log`)
	- `npm run dev:stop`

## Note Windows (Turbopack)

Sur Windows, `next dev` (Turbopack) peut tenter de creer des symlinks (ex: vers `@prisma/client`) et echouer avec `os error 1314` si les droits symlink ne sont pas disponibles.

- Par defaut, `npm run dev` lance **webpack** (compatible sans droits symlink).
- Si vous voulez essayer Turbopack: activez le mode Developpeur Windows ou lancez VS Code en admin, puis utilisez `npm run dev:turbo`.
```

## Deploiement VPS (resume)

```
git pull --ff-only
npm ci
npx prisma migrate deploy
npm run backfill:garage
ADMIN_EMAIL="admin@domain.fr" ADMIN_PASSWORD="motdepassefort" npm run create:admin
npm run build
pm2 restart motorsafe --update-env
```

## Pages

- `/` : landing
- `/auth/login` : connexion
- `/auth/register-pro` : demande compte pro
- `/pro` : raccourci pro
- `/dashboard` : KPIs
- `/clients` : gestion clients
- `/vehicules` : parc vehicules
- `/interventions` : interventions
- `/documents` : PDFs
- `/settings` : infos garage
- `/admin` : validation garages

## Scripts utiles

- `npm run backfill:garage` : associe un garage par defaut a l'existant.
- `npm run create:admin` : cree un admin (ADMIN_EMAIL/ADMIN_PASSWORD).

## Notes

- Les endpoints renvoient toujours `{ ok: true, data }` ou `{ ok: false, error, details }`.
- Les routes admin acceptent une cle via header `x-admin-key` si `ADMIN_KEY` est defini.
