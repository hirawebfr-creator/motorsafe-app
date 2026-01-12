# Nomenclature SafeMotor (format branche)

Arborescence du repo (hors `node_modules`, `.next`, `.git`, etc.).

```text
motorsafe/
├─ .vscode/
│  └─ tasks.json
├─ app/
│  ├─ _ui-debug/
│  │  └─ page.tsx
│  ├─ (dashboard)/
│  │  ├─ admin/
│  │  │  ├─ garages/
│  │  │  │  └─ page.tsx
│  │  │  ├─ pro-demandes/
│  │  │  │  └─ page.tsx
│  │  │  ├─ references/
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ clients/
│  │  │  ├─ [id]/
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ dashboard/
│  │  │  └─ page.tsx
│  │  ├─ documents/
│  │  │  └─ page.tsx
│  │  ├─ interventions/
│  │  │  ├─ [id]/
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ parametres/
│  │  │  ├─ page.tsx
│  │  │  └─ ParametresClient.tsx
│  │  ├─ settings/
│  │  │  └─ page.tsx
│  │  ├─ vehicules/
│  │  │  ├─ [id]/
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ api/
│  │  ├─ admin/
│  │  │  └─ garages/
│  │  │     ├─ [id]/
│  │  │     │  ├─ approve/
│  │  │     │  └─ reject/
│  │  │     └─ route.ts
│  │  ├─ auth/
│  │  │  ├─ login/
│  │  │  │  └─ route.ts
│  │  │  ├─ logout/
│  │  │  │  └─ route.ts
│  │  │  ├─ me/
│  │  │  │  └─ route.ts
│  │  │  └─ register-pro/
│  │  │     └─ route.ts
│  │  ├─ billing/
│  │  │  ├─ checkout/
│  │  │  │  └─ route.ts
│  │  │  └─ portal/
│  │  │     └─ route.ts
│  │  ├─ clients/
│  │  │  ├─ [id]/
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ documents/
│  │  │  ├─ [id]/
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ health/
│  │  │  └─ route.ts
│  │  ├─ interventions/
│  │  │  ├─ [id]/
│  │  │  │  ├─ pdf/
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ invoices/
│  │  │  ├─ [id]/
│  │  │  │  ├─ issue/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ mark-paid/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ pdf/
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ me/
│  │  │  └─ route.ts
│  │  ├─ quotes/
│  │  │  ├─ [id]/
│  │  │  │  ├─ accept/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ convert/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ pdf/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ reject/
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ send/
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ settings/
│  │  │  ├─ numbering/
│  │  │  │  └─ route.ts
│  │  │  └─ tax/
│  │  │     └─ route.ts
│  │  ├─ uploads/
│  │  │  ├─ file/
│  │  │  │  └─ [...key]/
│  │  │  │     └─ route.ts
│  │  │  ├─ local/
│  │  │  │  └─ route.ts
│  │  │  └─ presign/
│  │  │     └─ route.ts
│  │  ├─ vehicules/
│  │  │  ├─ [id]/
│  │  │  │  └─ route.ts
│  │  │  ├─ interventions/
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  └─ webhooks/
│  │     └─ stripe/
│  │        └─ route.ts
│  ├─ app/
│  │  └─ billing/
│  │     ├─ success/
│  │     │  └─ page.tsx
│  │     └─ page.tsx
│  ├─ auth/
│  │  ├─ login/
│  │  │  └─ page.tsx
│  │  ├─ pending/
│  │  │  └─ page.tsx
│  │  └─ register-pro/
│  │     └─ page.tsx
│  ├─ clients/
│  │  └─ [id]/
│  ├─ interventions/
│  │  └─ [id]/
│  ├─ legal/
│  │  └─ page.tsx
│  ├─ pro/
│  │  ├─ en-attente/
│  │  │  └─ page.tsx
│  │  ├─ inscription/
│  │  │  └─ page.tsx
│  │  ├─ pending/
│  │  │  └─ page.tsx
│  │  ├─ signup/
│  │  │  └─ page.tsx
│  │  └─ page.tsx
│  ├─ ui-debug/
│  │  └─ page.tsx
│  ├─ vehicules/
│  │  └─ [id]/
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ common/
│  │  ├─ DevOriginBanner.tsx
│  │  ├─ DevOverlay.tsx
│  │  ├─ DevTools.tsx
│  │  ├─ EmptyState.tsx
│  │  ├─ ErrorBanner.tsx
│  │  ├─ LegalReferencesConfig.ts
│  │  ├─ LegalReferencesPanel.tsx
│  │  ├─ Loading.tsx
│  │  └─ StatCard.tsx
│  ├─ layout/
│  │  ├─ responsive/
│  │  ├─ AppShell.tsx
│  │  ├─ DesktopSidebar.tsx
│  │  ├─ nav-config.ts
│  │  └─ Topbar.tsx
│  ├─ marketing/
│  │  └─ HomePage.tsx
│  ├─ parametres/
│  │  └─ ComplianceToggles.tsx
│  ├─ ui/
│  │  ├─ container/
│  │  │  └─ Container.tsx
│  │  ├─ navigation/
│  │  │  └─ Drawer.tsx
│  │  ├─ Badge.tsx
│  │  ├─ Button.tsx
│  │  ├─ Card.tsx
│  │  ├─ DataTable.tsx
│  │  ├─ Dialog.tsx
│  │  ├─ DropdownMenu.tsx
│  │  ├─ Input.tsx
│  │  ├─ SectionHeader.tsx
│  │  ├─ Select.tsx
│  │  ├─ Skeleton.tsx
│  │  ├─ Table.tsx
│  │  ├─ Textarea.tsx
│  │  ├─ Toast.tsx
│  │  ├─ Toggle.tsx
│  │  └─ Tooltip.tsx
│  ├─ dashboard-shell.tsx
│  └─ user-context.tsx
├─ content/
│  └─ legal.ts
├─ docs/
│  ├─ BACKEND_PLAN.md
│  ├─ QUOTE_INVOICE_SPEC.md
│  ├─ SITE_NOMENCLATURE_TREE.md
│  ├─ UI_CODE_DUMP.md
│  └─ UI_PAGES_DUMP.md
├─ lib/
│  ├─ admin.ts
│  ├─ api.ts
│  ├─ apiClient.ts
│  ├─ auth.ts
│  ├─ cn.ts
│  ├─ fetcher.ts
│  ├─ guards.ts
│  ├─ numbering.ts
│  ├─ prisma.ts
│  ├─ quoteInvoice.ts
│  ├─ routeErrors.ts
│  ├─ scrollLock.ts
│  ├─ stripe.ts
│  ├─ tax.ts
│  └─ theme.ts
├─ prisma/
│  ├─ migrations/
│  ├─ prisma/
│  │  └─ dev.db
│  ├─ schema.prisma
│  └─ seed.js
├─ public/
│  ├─ screenshots/
│  │  └─ home.png
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ og.png
│  ├─ vercel.svg
│  └─ window.svg
├─ scripts/
│  ├─ backfill-garage.js
│  ├─ create-admin.js
│  ├─ dump-nomenclature.js
│  ├─ dump-pages-ui.js
│  ├─ dump-ui.js
│  ├─ eslint-run.js
│  ├─ fetch_endpoints.js
│  ├─ next-build.js
│  ├─ next-dev-daemon.js
│  ├─ next-dev-stop-fg.js
│  ├─ next-dev-stop.js
│  ├─ next-dev.js
│  ├─ next-lint.js
│  ├─ quote-invoice-tests.ts
│  └─ smoke.js
├─ types/
│  └─ pdfkit-standalone.d.ts
├─ .dev.log
├─ .env
├─ .gitignore
├─ .next-dev.pid
├─ .node-version
├─ .npmrc
├─ .nvmrc
├─ docker-compose.yml
├─ Dockerfile
├─ eslint.config.mjs
├─ next-env.d.ts
├─ next-panic.log
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ README.md
├─ tailwind.config.js
├─ tsconfig.json
├─ tsconfig.tsbuildinfo
└─ UI_REFACTOR_PROGRESS.md
```

## Notes

- `app/api/` contient les routes backend (pas UI).
- `app/(dashboard)/` contient les pages authentifiées.
- `components/ui/` = UI kit (tokens + composants).