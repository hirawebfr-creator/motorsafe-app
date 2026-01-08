# Devis / Factures (TVA + numérotation + PDF + paiements)

## Objectifs
- Multi-tenant strict: toutes les lectures/écritures sont filtrées par `organisationId` (alias `Garage.id`).
- TVA flexible: profil TVA client + mode HT/TTC.
- Numérotation annuelle: séquences distinctes Devis/Factures.
- Conversion devis -> facture (idempotente).
- PDF simple + enregistrement en `Document`.
- Paiements manuels (cash/cb/virement/stripe/autre).

## Modèles (Prisma)
- `Garage` (Organisation)
  - `defaultVatRate` (float, défaut 0.20)
  - `defaultVatMode` ("EXCL"|"INCL", défaut "EXCL")
  - `vatRatesAllowed` (Json, défaut `[0,0.055,0.10,0.20]`)
  - `quotePrefix` (défaut "DEV"), `invoicePrefix` (défaut "FAC"), `numberPadding` (défaut 4)
- `Client`
  - `vatProfile` (PARTICULIER|PRO_FR|PRO_UE_VAT|EXPORT|EXONERE)
  - `vatNumber` (optionnel), `countryCode` (défaut "FR")
- `NumberSequence`
  - unique (`organisationId`,`type`,`year`), compteur `nextNumber`
- `Quote` / `QuoteLine`
  - statuts: DRAFT|SENT|ACCEPTED|REJECTED|INVOICED
  - soft-delete via `deletedAt`
  - totaux stockés: `subtotalExcl`, `totalVat`, `totalIncl`
- `Invoice` / `InvoiceLine`
  - statuts: DRAFT|ISSUED|PAID|PARTIALLY_PAID|OVERDUE|CANCELED
  - soft-delete via `deletedAt`
  - paiements: `amountPaid` + table `Payment`
- `Payment`
  - method: CASH|CARD|TRANSFER|STRIPE|OTHER

## Règles TVA
- `computeDefaultVatRate(org, client)`
  - `PRO_UE_VAT` -> TVA 0
  - `EXPORT` -> TVA 0
  - `EXONERE` -> TVA 0
  - sinon -> `org.defaultVatRate`

Les lignes stockent toujours:
- `unitPriceExcl` (HT)
- `vatRate`
- `lineTotalExcl`, `lineVatAmount`, `lineTotalIncl`

## Numérotation
- Helper: `allocateNumberTx(tx, { organisationId, type, year, prefix, padding })`
- Format: `${prefix}-${year}-${seq.padStart(padding,'0')}`
- Séquences indépendantes par type (QUOTE vs INVOICE) et par année.

## Endpoints

### Settings
- `GET /api/settings/tax`
- `PUT /api/settings/tax`
  - body: `{ defaultVatRate, defaultVatMode, vatRatesAllowed }`

- `GET /api/settings/numbering`
- `PUT /api/settings/numbering`
  - body: `{ quotePrefix, invoicePrefix, numberPadding }`

### Quotes
- `GET /api/quotes?page&pageSize&q&sortBy&sortOrder`
- `POST /api/quotes`
  - body:
    ```json
    {
      "clientId": 123,
      "vehicleId": "...",
      "vatMode": "EXCL",
      "currency": "EUR",
      "lines": [{"description":"Main d'oeuvre", "qty": 1, "unitPriceExcl": 100, "vatRate": 0.2}]
    }
    ```
- `GET /api/quotes/[id]`
- `PATCH /api/quotes/[id]`
  - stratégie simple: soft-delete des anciennes lignes puis recréation.
- `DELETE /api/quotes/[id]`
- `POST /api/quotes/[id]/send` -> `SENT`
- `POST /api/quotes/[id]/accept` -> `ACCEPTED`
- `POST /api/quotes/[id]/reject` -> `REJECTED`
- `POST /api/quotes/[id]/convert`
  - idempotent: si `invoiceId` présent, renvoie la facture existante
  - require: quote.status === `ACCEPTED` (sinon 409)
- `GET /api/quotes/[id]/pdf`
  - Génère un PDF et crée un `Document` de type `QUOTE_PDF`.

### Invoices
- `GET /api/invoices?page&pageSize&q`
- `POST /api/invoices` (création manuelle)
- `GET /api/invoices/[id]`
- `PATCH /api/invoices/[id]`
- `DELETE /api/invoices/[id]`
- `POST /api/invoices/[id]/issue` -> `ISSUED` + `issuedAt` + `dueAt` (30j par défaut)
- `POST /api/invoices/[id]/mark-paid`
  - body: `{ "amount": 50, "method": "CARD" }`
  - crée `Payment` + incrémente `amountPaid`
  - statut: `PAID` si `amountPaid >= totalIncl`, sinon `PARTIALLY_PAID`
- `GET /api/invoices/[id]/pdf`
  - Génère un PDF et crée un `Document` de type `INVOICE_PDF`.

## Erreurs
- Routes utilisent `RouteError` et `toErrorResponse()`.
- Payload contient `error: { code, message, details? }` (et `ok:false` pour compat UI existante).

## Notes
- Admin: les endpoints sont strictement tenant-scoped via `getTenantId()` (pas de mode cross-tenant).
