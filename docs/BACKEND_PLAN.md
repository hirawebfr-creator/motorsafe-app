# MotorSafe — Backend Plan (prod-ready)

Date: 2026-01-06

## 0) Audit rapide (état actuel)

### Stack
- Next.js App Router (routes backend via `app/api/**/route.ts`)
- Prisma + SQLite (dev) via `prisma/schema.prisma`
- Auth “maison” via cookie `ms_session` + table `Session` (voir `lib/auth.ts`)
- Rôles actuels: `ADMIN` / `GARAGE`
- Tenant actuel: `Garage` (les modèles `Client`, `Vehicle`, `Intervention` ont un `garageId`)

### API existantes (déjà en place)
- Auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/register-pro`, `/api/auth/me`
- CRUD partiel: `/api/clients`, `/api/clients/[id]`, `/api/vehicules`, `/api/vehicules/[id]`, `/api/interventions`, `/api/interventions/[id]`
- PDF: `/api/interventions/[id]/pdf` (génération PDFKit à la volée)
- Admin: `/api/admin/garages/*` (validation)

### Patterns existants à respecter
- Réponses API: `{ ok: true, data }` et `{ ok: false, error, details? }` via `lib/api.ts`
- Front fetcher attend `json.ok === true` (voir `lib/fetcher.ts`)

## 1) Décisions (pour respecter “ne pas casser l’UI”)

### Multi-tenant
- On conserve `Garage` comme entité tenant (car l’UI + routes existent déjà), mais on l’aligne fonctionnellement sur “Organisation”:
  - Ajout de champs billing + slug + plan + statut d’abonnement dans `Garage`.
  - Ajout de helpers backend nommés “tenant/organisation” qui utilisent `garageId` en DB.

### Erreurs API
- On fait évoluer le format vers:
  - `{ ok: false, error: { code, message, details? } }`
- Et on garde une compatibilité avec l’UI existante:
  - `error` peut encore être une string dans certains cas, et `lib/fetcher.ts` acceptera les 2.

### RBAC
- Extension des rôles sans casser l’existant:
  - `ADMIN`, `OWNER`, `STAFF`, et on conserve `GARAGE` comme alias legacy (mêmes droits que `OWNER`).

### Stripe “webhook-first”
- Source of truth = événements Stripe.
- Ajout d’une table d’idempotence (ex: `StripeEvent`) pour éviter les doubles traitements.

## 2) Roadmap d’implémentation (phases)

### Phase 1 — Prisma (multi-tenant + billing + soft-delete)
- Étendre `Garage` (tenant) avec:
  - `slug`, `plan`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, `currentPeriodEnd`, timestamps
- Étendre `Client` / `Vehicle` / `Intervention` avec:
  - `updatedAt`, `deletedAt` + champs manquants (email/tel/notes…) et index
  - Uniques tenant-scopés (ex: plate+garageId) si possible sans casser la DB
- Ajouter modèles:
  - `Document`, `Notification`, `AuditLog`, `StripeEvent`
- Ajouter un seed dev (JS) compatible sans `ts-node`

### Phase 2 — Guards (auth + tenant + RBAC + subscription)
- `requireUser(req)` → 401 si non authentifié
- `requireTenant(user)` → renvoie `garageId`
- `requireRole(user, roles)` → 403
- `requireActiveSubscription(user)` → 402/403 selon design

### Phase 3 — CRUD API (Zod + pagination + search + tri + soft-delete)
- Harmoniser/étendre les routes existantes sans casser l’UI.
- Standard pagination: `page`, `pageSize`, `total`.
- Toujours filtrer par tenant (garageId) et refuser cross-tenant.
- Ajouter `AuditLog` sur create/update/delete.

### Phase 4 — Uploads + PDF
- `/api/uploads/presign`:
  - DEV: écrit local `./uploads` (gitignored) avec URL locale
  - PROD: S3/R2 avec presign (si env présents)
- `/api/interventions/[id]/pdf`:
  - conserver PDFKit existant, et créer un `Document` en DB (métadonnées)
  - gating optionnel via subscription (FREE vs PRO)

### Phase 5 — Stripe billing
- `/api/billing/checkout` + `/api/billing/portal`
- `/api/webhooks/stripe`:
  - vérif signature
  - traite events clés (checkout.session.completed, customer.subscription.*)
  - met à jour `Garage`

### Phase 6 — Pages minimales
- `/app/billing` et `/app/billing/success`

### Phase 7 — Tests + Docs
- Tests basiques (scripts) : auth guard 401, isolation tenant, webhook smoke.
- README: env, setup, Stripe CLI webhook.
