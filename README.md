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
```

En production, adaptez `DATABASE_URL` vers le chemin de la base (ex: `/var/lib/motorsafe/prod.db`).

## Installation locale

```
npm install
npx prisma migrate dev -n init-multi-tenant
npm run backfill:garage
ADMIN_EMAIL="admin@domain.fr" ADMIN_PASSWORD="motdepassefort" npm run create:admin
npm run dev

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
