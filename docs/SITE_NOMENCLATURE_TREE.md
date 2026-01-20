# SAFEMOTOR — NOMENCLATURE COMPLÈTE DU PROJET

**Date de génération:** 20 janvier 2026  
**Version:** 3.0 (EVIDENCE-CAPTURE-01 ready)

---

## 📁 STRUCTURE RACINE

```
motorsafe/
├── .env                          # Variables environnement locales
├── .env.example                  # Template variables
├── .env.local                    # Override local
├── .env.prod                     # Production variables
├── .env.production.local         # Production local override
├── .env.test                     # Test environment
├── .env.vercel                   # Vercel deployment
├── .env.vercel.prod              # Vercel production
├── .gitignore
├── docker-compose.yml            # Dev PostgreSQL + Redis
├── Dockerfile                    # Container build
├── eslint.config.mjs             # ESLint config
├── middleware.ts                 # Next.js edge middleware (auth, i18n)
├── next-env.d.ts
├── next.config.ts                # Next.js configuration
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md                     # Projet overview
├── README_DEPLOY.md              # Deployment guide
├── sentry.client.config.ts       # Sentry browser config
├── sentry.edge.config.ts         # Sentry edge config
├── sentry.server.config.ts       # Sentry server config
├── tailwind.config.js            # Tailwind CSS config
├── tsconfig.json
├── UI_REFACTOR_PROGRESS.md       # UI refactoring tracker
└── vercel.json                   # Vercel deployment config
```

---

## 📁 APP/ — Next.js App Router

### Structure principale

```
app/
├── favicon.ico
├── globals.css                   # Styles globaux Tailwind
├── layout.tsx                    # Root layout (providers)
├── page.tsx                      # Landing page "/"
│
├── (dashboard)/                  # Route group dashboard (authentifié)
├── api/                          # API routes
├── app/                          # Sous-routes /app/*
├── assets/                       # Static assets (legacy)
├── auth/                         # Pages authentification
├── cgu/                          # CGU page
├── cgv/                          # CGV page
├── clients/                      # Route publique clients (legacy)
├── contact/                      # Contact page
├── demo/                         # Demo mode page
├── dpa/                          # DPA (Data Processing Agreement)
├── garages-partenaires/          # Partner garages listing
├── interventions/                # Public intervention view
├── legal/                        # Legal documents router
├── mentions-legales/             # Legal mentions page
├── objections/                   # Sales objection handling
├── politique-confidentialite/    # Privacy policy page
├── pro/                          # Pro signup landing
├── share/                        # Shared export links
├── sign/                         # Signature pages (token-based)
├── ui-debug/                     # UI debug pages (dev)
├── _ui-debug/                    # Alternative debug route
└── vehicules/                    # Public vehicle pages
```

---

### 📁 (dashboard)/ — Zone Garage Authentifiée

```
app/(dashboard)/
├── layout.tsx                    # Dashboard shell layout
│
├── admin/                        # 🔐 ADMIN ONLY - Backoffice
│   ├── page.tsx                  # Redirect to dashboard
│   ├── changelog/                # Changelog management
│   ├── clients/                  # Admin client lookup
│   ├── dashboard/
│   │   └── page.tsx              # Admin dashboard stats
│   ├── errors/                   # Error logs viewer
│   ├── garages/
│   │   └── page.tsx              # Garage management CRUD
│   ├── kb/                       # Knowledge Base admin
│   ├── leads/                    # CRM Leads management
│   ├── maintenance/              # Maintenance windows
│   ├── partners/                 # Partner program admin
│   ├── pro-demandes/             # Pro signup requests
│   ├── references/               # Legal references config
│   ├── support/
│   │   └── page.tsx              # Support tickets admin
│   ├── support-ops/              # Support ops dashboard
│   └── system/                   # System health checks
│
├── aide/                         # Help center
├── billing/
│   └── page.tsx                  # Subscription billing
├── clients/
│   ├── page.tsx                  # Clients list
│   ├── new/                      # New client form
│   ├── nouveau/                  # New client (fr alias)
│   └── [id]/
│       └── page.tsx              # Client detail
│
├── dashboard/                    # Main garage dashboard
├── devis/
│   ├── page.tsx                  # Quotes list
│   ├── nouveau/                  # New quote
│   └── [id]/                     # Quote detail
│
├── documents/
│   └── page.tsx                  # Documents library
│
├── equipe/
│   └── page.tsx                  # Team management
│
├── factures/
│   ├── page.tsx                  # Invoices list
│   └── [id]/                     # Invoice detail
│
├── garage/
│   └── page.tsx                  # Garage settings
│
├── incidents/
│   └── page.tsx                  # Incident cases list
│
├── interventions/
│   ├── page.tsx                  # Interventions list
│   ├── nouveau/                  # New intervention
│   └── [id]/
│       └── page.tsx              # Intervention detail
│
├── messages/
│   └── page.tsx                  # Support messages
│
├── notifications/
│   └── page.tsx                  # Notifications center
│
├── nouveautes/
│   ├── page.tsx                  # Changelog list
│   └── [id]/                     # Changelog detail
│
├── onboarding/
│   ├── page.tsx                  # Onboarding wizard
│   └── OnboardingWizard.tsx      # Wizard component
│
├── parametres/
│   ├── page.tsx                  # Settings page
│   └── ParametresClient.tsx      # Settings client component
│
├── partner/                      # Partner program
├── pdf/
│   └── page.tsx                  # PDF preview/debug
│
├── planning/
│   └── page.tsx                  # Appointment calendar
│
├── settings/
│   └── page.tsx                  # Settings (alias)
│
├── support/
│   └── page.tsx                  # Support tickets (garage)
│
├── vehicles/                     # Vehicles (en alias)
└── vehicules/
    ├── page.tsx                  # Vehicles list
    ├── nouveau/                  # New vehicle
    └── [id]/                     # Vehicle detail
```

---

### 📁 API/ — Routes API Backend

```
app/api/
│
├── admin/                        # 🔐 ADMIN APIs
│   ├── changelog/                # CRUD changelog entries
│   ├── clients/                  # Admin client search
│   ├── demo/                     # Demo mode toggle
│   ├── garages/
│   │   ├── route.ts              # List/create garages
│   │   └── [id]/                 # Garage CRUD + approve/reject
│   ├── health/                   # System health API
│   ├── kb/
│   │   ├── articles/             # KB article CRUD
│   │   └── categories/           # KB categories CRUD
│   ├── leads/                    # CRM leads API
│   ├── legal/                    # Legal docs admin
│   ├── maintenance/              # Maintenance window API
│   ├── partners/                 # Partner program API
│   ├── stats/                    # Admin analytics
│   └── support/
│       ├── ops/                  # Support ops dashboard
│       └── tickets/              # Admin ticket management
│
├── ai/
│   └── interventions/            # AI assist for interventions
│
├── appointments/                 # Appointment CRUD
├── auth/
│   ├── login/                    # POST login
│   ├── logout/                   # POST logout
│   ├── me/                       # GET current user
│   └── register-pro/             # POST pro registration
│
├── billing/
│   ├── checkout/                 # Stripe checkout session
│   ├── portal/                   # Stripe customer portal
│   └── status/                   # Subscription status
│
├── changelog/                    # Public changelog
├── clients/
│   ├── route.ts                  # List/create clients
│   └── [id]/
│       ├── route.ts              # Client CRUD
│       ├── anonymize/            # GDPR anonymization
│       └── export/               # Client data export
│
├── cron/                         # Scheduled jobs (Vercel)
├── dashboard/                    # Dashboard stats API
├── documents/
│   ├── route.ts                  # List/upload docs
│   └── [id]/
│       └── route.ts              # Doc CRUD
│
├── download/                     # Secure download tokens
├── garages/
│   ├── route.ts                  # Garage info
│   ├── branding/                 # Logo/branding upload
│   ├── export/                   # Garage data export
│   ├── options/                  # Garage options/toggles
│   └── profile/                  # Public profile
│
├── health/                       # Health check endpoint
├── import/                       # CSV import API
├── incidents/
│   └── status/                   # Incident status update
│
├── interventions/
│   ├── route.ts                  # List/create interventions
│   └── [id]/
│       ├── route.ts              # Intervention CRUD
│       ├── addendum/             # Add addendum (dispute mode)
│       ├── delivery/             # Delivery signature
│       ├── dispute/              # Open/close dispute
│       ├── export/               # Export intervention data
│       ├── export-expert-pack.pdf/  # Expert dossier PDF
│       ├── export-forensic/      # Forensic export ZIP
│       ├── export-insurance/     # Insurance-ready ZIP
│       ├── export-share/         # Share link generation
│       ├── incident/             # Incident case link
│       ├── insurance/            # Insurance info
│       ├── legal-memo/           # Legal memo PDF
│       ├── order/                # Order signature
│       ├── pdf/                  # Intervention PDF
│       ├── repair-order/         # Repair order API
│       ├── return-report/        # Return report API
│       ├── signature/            # Signature status
│       ├── signatures/           # Signature requests list
│       └── verify-integrity/     # Evidence chain verify
│
├── invoices/
│   ├── route.ts                  # List/create invoices
│   └── [id]/
│       ├── route.ts              # Invoice CRUD
│       ├── issue/                # Issue invoice
│       ├── mark-paid/            # Mark as paid
│       ├── payments/             # Payment records
│       ├── pdf/                  # Invoice PDF
│       └── send/                 # Send invoice email
│
├── kb/                           # Public KB articles
├── legal/                        # Public legal docs
├── legal-references/             # Legal references API
├── loan-contracts/
│   ├── route.ts                  # Loan contracts CRUD
│   └── [id]/                     # Contract detail
│
├── loan-vehicles/
│   └── route.ts                  # Loan vehicles CRUD
│
├── maintenance/                  # Maintenance status public
├── me/
│   └── route.ts                  # Current user info
│
├── partner/                      # Partner program API
├── public/                       # Public APIs (no auth)
├── quotes/
│   ├── route.ts                  # List/create quotes
│   └── [id]/
│       ├── route.ts              # Quote CRUD
│       ├── accept/               # Client accept
│       ├── convert/              # Convert to invoice
│       ├── pdf/                  # Quote PDF
│       ├── reject/               # Client reject
│       └── send/                 # Send quote email
│
├── repair-order/                 # Repair order endpoints
├── settings/
│   ├── notifications/            # Notification prefs
│   ├── numbering/                # Numbering config
│   ├── retention/                # Retention policy
│   └── tax/                      # VAT settings
│
├── share/
│   └── export/                   # Public share export
│
├── signatures/
│   ├── start/                    # Start signature flow
│   └── [token]/                  # Token-based signature
│
├── support/
│   └── tickets/
│       ├── route.ts              # Create/list tickets
│       └── [id]/                 # Ticket detail + messages
│
├── team/
│   ├── route.ts                  # Team members list
│   ├── accept/                   # Accept invitation
│   └── [id]/                     # Member CRUD
│
├── uploads/
│   ├── file/
│   │   └── [...key]/             # File access by key
│   ├── local/
│   │   └── route.ts              # Local file upload
│   └── presign/                  # S3 presigned URLs
│
├── vehicules/
│   ├── route.ts                  # List/create vehicles
│   ├── interventions/            # Vehicle interventions
│   ├── lookup/                   # Plate lookup API
│   └── [id]/
│       └── route.ts              # Vehicle CRUD
│
└── webhooks/
    └── stripe/                   # Stripe webhooks
```

---

### 📁 AUTH/ — Pages Authentification

```
app/auth/
├── accept-invite/                # Accept team invitation
├── login/                        # Login page
├── pending/                      # Pending approval page
└── register-pro/                 # Pro registration form
```

---

### 📁 SIGN/ — Pages Signature

```
app/sign/
└── [token]/
    └── page.tsx                  # Mobile-first signature page
```

---

### 📁 SHARE/ — Liens Partagés

```
app/share/
└── export/                       # Shared insurance export
```

---

## 📁 COMPONENTS/ — Composants React

```
components/
├── dashboard-shell.tsx           # Main dashboard wrapper
├── user-context.tsx              # User context provider
│
├── admin/
│   └── GarageEmulator.tsx        # Admin garage switcher
│
├── clients/
│   └── ClientCreateForm.tsx      # Client form component
│
├── common/
│   ├── AIAssistCard.tsx          # AI assistance widget
│   ├── DevOriginBanner.tsx       # Dev environment banner
│   ├── DevOverlay.tsx            # Dev tools overlay
│   ├── DevTools.tsx              # Dev tools panel
│   ├── DisputeActions.tsx        # Dispute open/close
│   ├── DisputeBadge.tsx          # Dispute status badge
│   ├── EmptyState.tsx            # Empty state component
│   ├── ErrorBanner.tsx           # Error display banner
│   ├── GDPRActions.tsx           # GDPR action buttons
│   ├── ImportTool.tsx            # CSV import wizard
│   ├── LegalReferencesConfig.ts  # Legal refs config
│   ├── LegalReferencesPanel.tsx  # Legal refs sidebar
│   ├── Loading.tsx               # Loading spinner
│   ├── QRCodeDialog.tsx          # QR code for signature
│   └── StatCard.tsx              # KPI stat card
│
├── dashboard/
│   └── StatCard.tsx              # Dashboard stat card
│
├── demo/                         # Demo mode components
│
├── interventions/
│   ├── ExportInsuranceButton.tsx # Insurance export button
│   ├── IncidentSection.tsx       # Incident case section
│   └── WorkshopSection.tsx       # Workshop tools section
│
├── layout/
│   ├── AppShell.tsx              # App shell wrapper
│   ├── DesktopSidebar.tsx        # Desktop nav sidebar
│   ├── MaintenanceBanner.tsx     # Maintenance alert
│   ├── MobileNav.tsx             # Mobile navigation
│   ├── nav-config.ts             # Navigation config
│   ├── responsive/               # Responsive utilities
│   ├── Sidebar.tsx               # Generic sidebar
│   └── Topbar.tsx                # Top navigation bar
│
├── marketing/                    # Marketing components
│
├── parametres/
│   ├── BrandingSettings.tsx      # Branding config
│   └── ComplianceToggles.tsx     # Compliance settings
│
└── ui/                           # Base UI components
    ├── Badge.tsx
    ├── Button.tsx
    ├── Card.tsx
    ├── container/
    ├── DataTable.tsx
    ├── Dialog.tsx
    ├── DropdownMenu.tsx
    ├── Input.tsx
    ├── KpiCard.tsx
    ├── navigation/
    ├── SectionHeader.tsx
    ├── Select.tsx
    ├── Skeleton.tsx
    ├── Table.tsx
    ├── Textarea.tsx
    ├── Toast.tsx
    ├── Toggle.tsx
    └── Tooltip.tsx
```

---

## 📁 LIB/ — Logique Métier

```
lib/
├── admin.ts                      # Admin helper functions
├── api.ts                        # API utilities
├── apiClient.ts                  # Typed fetch client
├── appointments.ts               # Appointment logic
├── auth.ts                       # Auth helpers + session
├── automations.ts                # Automation jobs
├── cache.ts                      # Caching utilities
├── cn.ts                         # className merger
├── csv.ts                        # CSV parser/exporter
├── demo.ts                       # Demo mode logic
├── email.ts                      # Email sending (Resend)
├── emulatedFetch.ts              # Dev fetch mock
├── encryption.ts                 # Field encryption (AES)
├── entitlements.ts               # Feature flags by plan
├── fetcher.ts                    # SWR fetcher
├── guards.ts                     # Permission guards
├── numbering.ts                  # Auto-numbering
├── permissions.ts                # Role permissions
├── prisma.ts                     # Prisma client singleton
├── quoteInvoice.ts               # Quote/Invoice logic
├── rateLimit.ts                  # Rate limiting
├── retention.ts                  # Data retention policies
├── routeErrors.ts                # API error handling
├── scrollLock.ts                 # Scroll lock utility
├── stripe.ts                     # Stripe integration
├── support.ts                    # Support ticket logic
├── systemHealth.ts               # Health check functions
├── tax.ts                        # VAT calculations
├── testOutbox.ts                 # Test email outbox
├── theme.ts                      # Theme utilities
└── vehicleLookup.ts              # Plate lookup API
│
├── ai/
│   ├── provider.ts               # AI provider abstraction
│   ├── redact.ts                 # PII redaction for AI
│   └── supportSuggestion.ts      # Support AI suggestions
│
├── export/
│   └── expertPack.ts             # Expert pack data builder
│
├── legal/
│   ├── evidenceChain.ts          # Hash chain logic
│   ├── evidenceLock.ts           # Dispute locking
│   ├── selectLegalModules.ts     # Clause selection
│   └── tags.ts                   # Intervention tags
│
├── observability/
│   ├── index.ts                  # Logging exports
│   ├── redact.ts                 # PII redaction
│   └── sentry.ts                 # Sentry integration
│
├── pdf/
│   ├── branding.ts               # PDF branding/logo
│   ├── expertDossier.ts          # Expert dossier PDF
│   ├── insuranceExport.ts        # Insurance export PDF
│   ├── insuranceInfo.ts          # Insurance info page
│   ├── legalMemo.ts              # Legal memo PDF
│   ├── orderMaster.ts            # Order PDF template
│   ├── partnerBadge.ts           # Partner badge SVG
│   └── repairOrder.ts            # Repair order PDF
│
└── support/
    └── triage.ts                 # Support auto-triage
```

---

## 📁 PRISMA/ — Base de Données

```
prisma/
├── schema.prisma                 # Full DB schema (2200+ lignes)
├── seed.js                       # Database seeder
│
├── prisma/                       # Prisma cache (ignored)
│
└── migrations/                   # Migration history
    ├── 20251231102725_init_multi_tenant/
    ├── 20251231174804_add_review_note/
    ├── 20260106170037_add_billing_docs_audit/
    ├── 20260108091618_quote_invoice_module/
    ├── 20260108165856_client_vat_rate_override/
    ├── 20260115120000_vehicle_lookup_cache/
    ├── 20260115150000_add_garage_branding/
    ├── 20260115160000_add_download_tokens/
    ├── 20260116120000_add_partner_badge/
    ├── 20260116130000_add_public_profile/
    ├── 20260116140000_add_referral_program/
    ├── 20260116150000_add_pending_referral_coupon/
    ├── 20260116200000_add_performance_indexes/
    ├── 20260116210000_add_rate_limit_bucket/
    ├── 20260118120000_support_omnicanal/
    ├── 20260118140000_support_sla/
    ├── 20260118160000_knowledge_base/
    ├── 20260118170000_support_ai_suggestion/
    ├── 20260119100000_support_auto_triage/
    └── migration_lock.toml
```

---

## 📁 SCRIPTS/ — Utilitaires Dev/Ops

```
scripts/
├── api-e2e-tests.ts              # API end-to-end tests
├── backfill-garage.js            # Backfill garage data
├── backup/                       # Backup scripts
├── check-stripe.js               # Stripe config check
├── create-admin.js               # Create admin user
├── create-test-data.js           # Generate test data
├── create-test-user.js           # Create test user
├── critical-flow-tests.ts        # Critical flow tests
├── crud-tests.ts                 # CRUD operations tests
├── dump-nomenclature.js          # Generate nomenclature
├── dump-pages-ui.js              # Dump pages UI code
├── dump-ui.js                    # Dump UI components
├── eslint-run.js                 # ESLint runner
├── feature-gate-tests.ts         # Feature gate tests
├── fetch_endpoints.js            # API endpoint discovery
├── fix-encrypted-clients.ts      # Fix encrypted clients
├── list-users.js                 # List all users
├── migrate-encrypt-clients.js    # Encrypt client data
├── multi-tenant-tests.ts         # Multi-tenant tests
├── next-build.js                 # Build wrapper
├── next-dev-daemon.js            # Dev daemon mode
├── next-dev-fg.js                # Dev foreground
├── next-dev-stop-fg.js           # Stop dev foreground
├── next-dev-stop.js              # Stop dev daemon
├── next-dev.js                   # Dev mode starter
├── next-lint.js                  # Lint runner
├── quote-invoice-tests.ts        # Quote/Invoice tests
├── reset-admin-password.js       # Reset admin password
├── reset-stripe-customer.js      # Reset Stripe customer
├── seed-kb.ts                    # Seed knowledge base
├── seed-legal.js                 # Seed legal docs
├── signature-api-tests.ts        # Signature API tests
├── smoke.js                      # Smoke tests
├── sync-stripe-subscriptions.js  # Sync Stripe subs
├── test-decrypt.ts               # Test decryption
├── test-free-api.js              # Test free tier API
└── test-free-limits.js           # Test free limits
```

---

## 📁 CONTENT/ — Contenu Statique

```
content/
├── gdpr.ts                       # GDPR compliance text
├── legal.ts                      # Legal document content
├── legalPackV1.ts                # Legal pack v1 content
├── salesTemplates.ts             # Sales email templates
└── supportMacros.ts              # Support response macros
```

---

## 📁 DOCS/ — Documentation Technique

```
docs/
├── BACKEND_PLAN.md               # Backend architecture
├── EVIDENCE_LOCKDOWN.md          # Evidence chain spec
├── QUOTE_INVOICE_SPEC.md         # Billing spec
├── RESTORE_RUNBOOK.md            # Disaster recovery
├── RUNBOOK_PROD.md               # Production runbook
├── SALES_PITCH.md                # Sales documentation
├── SECURITY_CHECKLIST.md         # Security audit list
├── SITE_NOMENCLATURE_TREE.md     # This file
├── UI_CODE_DUMP.md               # UI code reference
└── UI_PAGES_DUMP.md              # Pages structure dump
```

---

## 📁 TYPES/ — TypeScript Definitions

```
types/
└── pdfkit-standalone.d.ts        # PDFKit type defs
```

---

## 📁 PUBLIC/ — Assets Statiques

```
public/
├── favicon.ico
├── file.svg
├── globe.svg
├── next.svg
├── og.png                        # Open Graph image
├── vercel.svg
├── window.svg
│
├── brand/                        # Brand assets
└── screenshots/                  # App screenshots
```

---

## 🗃️ MODÈLES PRISMA — INVENTAIRE COMPLET

### Entités Principales (Core)

| Modèle | Description | Multi-tenant |
|--------|-------------|--------------|
| `Garage` | Garage/entreprise (tenant principal) | ✅ Root |
| `User` | Utilisateur (admin ou garage) | ✅ garageId |
| `Session` | Session authentification | — |
| `GarageMember` | Membre équipe garage | ✅ garageId |
| `Client` | Client du garage | ✅ garageId |
| `Vehicle` | Véhicule client | ✅ garageId |
| `Intervention` | Intervention/prestation | ✅ garageId |
| `Document` | Fichier uploadé | ✅ garageId |

### Facturation (Billing)

| Modèle | Description |
|--------|-------------|
| `Quote` | Devis |
| `QuoteLine` | Ligne de devis |
| `Invoice` | Facture |
| `InvoiceLine` | Ligne de facture |
| `Payment` | Paiement enregistré |
| `NumberSequence` | Numérotation auto |
| `QuoteDownloadToken` | Token sécurisé devis |
| `InvoiceDownloadToken` | Token sécurisé facture |

### Atelier (Workshop)

| Modèle | Description |
|--------|-------------|
| `RepairOrder` | Ordre de réparation (OR) |
| `ReturnReport` | PV de restitution |
| `LoanVehicle` | Véhicule de prêt |
| `LoanContract` | Contrat de prêt |
| `Appointment` | Rendez-vous |

### Preuves & Légal (Evidence & Legal)

| Modèle | Description |
|--------|-------------|
| `EvidenceChain` | Chaîne de preuves hashée (tamper-evident) |
| `EvidenceAddendum` | Addendum append-only |
| `DocumentVersion` | Versions documents (forensic) |
| `SignatureRequest` | Demande signature |
| `SignatureEvent` | Événements signature |
| `ConsentRecord` | Consentement client |
| `IncidentCase` | Dossier incident assurance |
| `InterventionRevision` | Révisions intervention |
| `DownloadToken` | Token téléchargement sécurisé |

### Support Client

| Modèle | Description |
|--------|-------------|
| `SupportTicket` | Ticket support |
| `SupportMessage` | Message dans ticket |
| `SupportAiSuggestion` | Suggestion IA support |
| `KbCategory` | Catégorie KB |
| `KbArticle` | Article KB |

### Système (System)

| Modèle | Description |
|--------|-------------|
| `AuditLog` | Journal d'audit |
| `Notification` | Notifications |
| `StripeEvent` | Événements Stripe |
| `AutomationJob` | Jobs automatisés |
| `RateLimitBucket` | Rate limiting |
| `SystemEvent` | Événements système |
| `GarageNotificationSettings` | Préfs notifications |

### CRM & Marketing

| Modèle | Description |
|--------|-------------|
| `Lead` | Prospect CRM interne |
| `LeadActivity` | Activité prospect |
| `Partner` | Partenaire affilié |
| `PartnerAttribution` | Attribution partenaire |
| `PartnerCommissionLine` | Commission partenaire |
| `PartnerPayout` | Paiement partenaire |
| `ReferralEvent` | Événement parrainage |
| `DemoState` | État mode démo |

### Import & Lookup

| Modèle | Description |
|--------|-------------|
| `ImportBatch` | Import CSV batch |
| `VehicleLookupCache` | Cache lookup plaque |
| `VehicleLookupUsage` | Usage lookup mensuel |
| `VehicleLookupLog` | Logs lookup API |
| `AiUsageLog` | Usage IA (quota) |

### Legal Documents

| Modèle | Description |
|--------|-------------|
| `LegalDoc` | Document légal (CGU, CGV, etc.) |
| `LegalDocVersion` | Version doc légal |
| `CompanyProfile` | Profil entreprise (mentions légales) |
| `Subprocessor` | Sous-traitant RGPD |
| `InterventionTypeRef` | Type d'intervention référence |
| `ClauseSet` | Set de clauses légales |
| `ClauseSetVersion` | Version clauses |
| `LegalReference` | Référence légale (articles code) |
| `LegalReferenceAssignment` | Assignation référence |

### Changelog & Maintenance

| Modèle | Description |
|--------|-------------|
| `ChangelogEntry` | Entrée changelog visible |
| `MaintenanceWindow` | Fenêtre maintenance planifiée |

---

## 🏷️ ENUMS PRISMA — LISTE COMPLÈTE

### Rôles & Permissions

```typescript
UserRole: ADMIN | GARAGE | OWNER | STAFF | PARTNER
GarageRole: OWNER | MANAGER | STAFF | RECEPTION | READONLY
MemberStatus: INVITED | ACTIVE | DISABLED
```

### Plans & Abonnements

```typescript
Plan: FREE | STARTER | PRO
SubscriptionStatus: INCOMPLETE | INCOMPLETE_EXPIRED | TRIALING | ACTIVE | PAST_DUE | CANCELED | UNPAID
```

### Statuts Entités

```typescript
GarageStatus: PENDING | ACTIVE | REJECTED
InterventionStatus: DRAFT | OPEN | DONE | CANCELED
IncidentCaseStatus: DRAFT | OPEN | CLOSED
RepairOrderStatus: DRAFT | SENT | SIGNED | CANCELLED
ReturnReportStatus: DRAFT | SENT | SIGNED
LoanContractStatus: OUT | RETURNED | DISPUTE
AppointmentStatus: SCHEDULED | DONE | CANCELLED | NO_SHOW
```

### Signatures

```typescript
SignatureDocumentType: INTERVENTION_ORDER | INTERVENTION_DELIVERY | INTERVENTION_DOSSIER | QUOTE | REPAIR_ORDER | RETURN_REPORT | LOAN_CONTRACT_OUT | LOAN_CONTRACT_IN
SignatureStatus: DRAFT | SENT | VIEWED | SIGNED | DECLINED | EXPIRED | VOID | SUPERSEDED
```

### Support

```typescript
SupportChannel: FORM | EMAIL | WHATSAPP
SupportCategory: BUG | BILLING | FEATURE | LEGAL | OTHER
SupportPriority: LOW | NORMAL | HIGH | URGENT
SupportTicketStatus: OPEN | IN_PROGRESS | WAITING_CUSTOMER | RESOLVED | CLOSED
SupportAuthorType: REQUESTER | GARAGE_USER | ADMIN
TriageSource: RULES | AI
```

### Documents

```typescript
DocumentType: INTERVENTION_REPORT | UPLOAD | QUOTE_PDF | INVOICE_PDF | SIGNED_DOCUMENT | AUDIT_TRAIL
DocumentVersionType: QUOTE | INVOICE | REPAIR_ORDER | RETURN_REPORT | INCIDENT_SUMMARY | SIGNATURE_PDF | ATTACHMENT | OTHER
DocumentVersionReason: GENERATED | SIGNED | REGENERATED | EXPORT
```

### Incidents & Véhicules

```typescript
IncidentType: ENGINE | GEARBOX | ELECTRICAL | BRAKES | SUSPENSION | BODY | FUEL_SYSTEM | OTHER
FuelLevel: EMPTY | QUARTER | HALF | THREE_QUARTERS | FULL
```

### CRM

```typescript
LeadStatus: NEW | CONTACTED | DEMO_SCHEDULED | DEMO_DONE | TRIAL_STARTED | WON | LOST
LeadChannel: INSTAGRAM | FACEBOOK | SMS | EMAIL | PHONE | LINKEDIN | REFERRAL | OTHER
LeadActivityType: NOTE | CALL | SMS | EMAIL | DM | DEMO | STATUS_CHANGE
PartnerType: GARAGE | INFLUENCER | AGENCY | OTHER
CommissionMode: FIRST_MONTH_PERCENT | THREE_MONTHS_PERCENT
PayoutStatus: DUE | PAID | CANCELLED
```

### Automatisation

```typescript
AutomationJobKind: SIGN_REMINDER | QUOTE_REMINDER | INVOICE_REMINDER | QUOTA_ALERT | ADMIN_DIGEST | APPOINTMENT_REMINDER
AutomationJobStatus: PENDING | RUNNING | DONE | FAILED | CANCELLED
ReminderPolicy: NONE | STANDARD
```

### Import

```typescript
ImportKind: CLIENTS | VEHICULES
ImportStatus: DRAFT | DRY_RUN_DONE | IMPORTED | ROLLED_BACK | FAILED
```

### Legal & Changelog

```typescript
LegalSeverity: INFO | WARNING | CRITICAL
LegalDocScope: PUBLIC | APP
ChangelogType: FEATURE | FIX | SECURITY | LEGAL
MaintenanceSeverity: INFO | WARNING
```

---

## 🔑 FEATURE FLAGS (lib/entitlements.ts)

```typescript
FeatureKey {
  INTERVENTIONS       // Toutes offres
  CLIENTS             // Toutes offres
  DOCUMENTS           // Toutes offres
  APPOINTMENTS        // Toutes offres
  QUOTES              // STARTER+
  INVOICES            // STARTER+
  VEHICLE_LOOKUP      // STARTER+ (quota)
  BRANDING_LOGO       // STARTER+
  BRANDING_COLOR      // PRO only
  TEAM_MEMBERS        // STARTER+
  EXPORT_ZIP          // STARTER+
  EXPORT_SHARE        // PRO only
  EXPERT_PACK         // PRO only
  AI_ASSIST           // PRO only
  LOAN_VEHICLES       // PRO only
  INCIDENT_CASES      // STARTER+
  PARTNER_BADGE       // STARTER+
  EMAIL_REMINDERS     // STARTER+
}
```

### Mapping Plan → Features

| Plan | Prix | Features |
|------|------|----------|
| **FREE** | 0€ | Interventions, Clients, Documents (limité) |
| **STARTER** | 49€/mois | + Quotes, Invoices, Lookup, Branding, Export ZIP |
| **PRO** | 129€/mois | + Expert Pack, Share, AI, Color, Loan Vehicles |

---

## 📄 ROUTES SIGNATURE

| Route | Method | Description |
|-------|--------|-------------|
| `/sign/[token]` | GET | Page signature mobile-first |
| `/api/signatures/start` | POST | Créer demande signature |
| `/api/signatures/[token]` | GET | Infos signature |
| `/api/signatures/[token]` | POST | Soumettre signature |

---

## 📄 ROUTES EXPORT

| Route | Method | Description | Plan requis |
|-------|--------|-------------|-------------|
| `/api/interventions/[id]/export-insurance` | GET | ZIP assurance | STARTER+ |
| `/api/interventions/[id]/export-expert-pack.pdf` | GET | PDF expert | PRO |
| `/api/interventions/[id]/export-forensic` | GET | Export forensic | ADMIN |
| `/api/interventions/[id]/export-share` | POST | Lien partagé | PRO |
| `/share/export/[token]` | GET | Page publique export | — |

---

## 🔒 SÉCURITÉ MULTI-TENANT

### Règles d'accès

1. **Toutes requêtes** garage scopées par `garageId`
2. `requireAuth()` → vérifie session + retourne `user.garageId`
3. Chaque query Prisma inclut `where: { garageId }`
4. Admin peut émuler via header `x-emulate-garage`
5. Données encryptées: `Client.email`, `Client.phone` (AES-256)

### Vérifications systématiques

```typescript
// Pattern standard API route
const user = await requireAuth();
if (!user.garageId) return json({ error: "Forbidden" }, 403);

const data = await prisma.intervention.findFirst({
  where: { id, garageId: user.garageId }
});
if (!data) return json({ error: "Not found" }, 404);
```

---

## 📋 TABLES À CRÉER — EVIDENCE-CAPTURE-01

### EvidenceCaptureSession

```prisma
model EvidenceCaptureSession {
  id              String   @id @default(cuid())
  garageId        Int
  interventionId  String
  status          EvidenceCaptureStatus @default(DRAFT)
  step            EvidenceCaptureStep   @default(INTAKE)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  garage          Garage       @relation(...)
  intervention    Intervention @relation(...)
  items           EvidenceItem[]
  
  @@index([garageId])
  @@index([interventionId])
}

enum EvidenceCaptureStatus {
  DRAFT
  READY
  SIGNED
}

enum EvidenceCaptureStep {
  INTAKE      // Réception
  TECH        // Technique (OBD)
  DELIVERY    // Restitution
}
```

### EvidenceItem

```prisma
model EvidenceItem {
  id              String          @id @default(cuid())
  garageId        Int
  interventionId  String
  sessionId       String
  type            EvidenceItemType
  label           String?          // "Front-left", "Dashboard", etc.
  storageKey      String?          // Key stockage fichier
  jsonData        Json?            // km, fuel, warnings, dtc, notes
  sha256          String           // Hash intégrité
  createdAt       DateTime         @default(now())
  createdByUserId String?
  
  garage          Garage           @relation(...)
  intervention    Intervention     @relation(...)
  session         EvidenceCaptureSession @relation(...)
  createdBy       User?            @relation(...)
  
  @@index([interventionId, type, createdAt])
  @@index([sessionId])
}

enum EvidenceItemType {
  PHOTO
  VIDEO
  FORM
  OBD_REPORT
  SIGNATURE
  NOTE
}
```

---

## 📋 PAGES À CRÉER — EVIDENCE-CAPTURE-01

```
app/(dashboard)/interventions/[id]/
├── reception/
│   └── page.tsx          # Wizard réception (km, fuel, photos, signature)
├── tech/
│   └── page.tsx          # OBD avant/après upload
└── restitution/
    └── page.tsx          # PV sortie + signature
```

---

## 📋 API À CRÉER — EVIDENCE-CAPTURE-01

```
app/api/interventions/[id]/
├── evidence-session/
│   └── route.ts          # GET/POST session capture
├── evidence-items/
│   └── route.ts          # POST photo/form/OBD
└── evidence-sign/
    └── route.ts          # POST signature intake/delivery
```

---

*Généré le 20 janvier 2026 — Version 3.0*
*Ne pas modifier manuellement — Régénérer via scripts/dump-nomenclature.js*
