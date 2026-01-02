# Nomenclature SafeMotor (format branche)

Arborescence du repo (hors `node_modules`, `.next`, `.git`, etc.).

```text
motorsafe/
├─ app/
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
│  │  ├─ clients/
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
│  │  └─ vehicules/
│  │     ├─ [id]/
│  │     │  └─ route.ts
│  │     ├─ interventions/
│  │     │  └─ route.ts
│  │     └─ route.ts
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
│  ├─ vehicules/
│  │  └─ [id]/
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ common/
│  │  ├─ BadgeStatus.tsx
│  │  ├─ DataCards.tsx
│  │  ├─ DataTable.tsx
│  │  ├─ EmptyState.tsx
│  │  ├─ ErrorBanner.tsx
│  │  ├─ LegalReferencesConfig.ts
│  │  ├─ LegalReferencesPanel.tsx
│  │  ├─ Loading.tsx
│  │  ├─ PageHeader.tsx
│  │  ├─ Skeleton.tsx
│  │  └─ StatCard.tsx
│  ├─ layout/
│  │  ├─ AppShell.tsx
│  │  ├─ MobileNav.tsx
│  │  ├─ nav-config.ts
│  │  ├─ Sidebar.tsx
│  │  └─ Topbar.tsx
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
│  │  ├─ KpiCard.tsx
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
│  └─ UI_CODE_DUMP.md
├─ lib/
│  ├─ admin.ts
│  ├─ api.ts
│  ├─ apiClient.ts
│  ├─ auth.ts
│  ├─ cn.ts
│  ├─ fetcher.ts
│  ├─ prisma.ts
│  └─ theme.ts
├─ prisma/
│  ├─ migrations/
│  ├─ prisma/
│  │  └─ dev.db
│  └─ schema.prisma
├─ public/
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ scripts/
│  ├─ backfill-garage.js
│  ├─ create-admin.js
│  ├─ dump-nomenclature.js
│  ├─ dump-ui.js
│  ├─ fetch_endpoints.js
│  ├─ next-build.js
│  └─ smoke.js
├─ types/
│  └─ pdfkit-standalone.d.ts
├─ .env
├─ .gitignore
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
└─ tsconfig.tsbuildinfo
```

## Notes

- `app/api/` contient les routes backend (pas UI).
- `app/(dashboard)/` contient les pages authentifiées.
- `components/ui/` = UI kit (tokens + composants).