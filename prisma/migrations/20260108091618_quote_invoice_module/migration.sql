-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "NumberSequence_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "vehicleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "quoteNumber" TEXT,
    "quoteYear" INTEGER,
    "quoteSeq" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "vatMode" TEXT NOT NULL,
    "subtotalExcl" REAL NOT NULL DEFAULT 0,
    "totalVat" REAL NOT NULL DEFAULT 0,
    "totalIncl" REAL NOT NULL DEFAULT 0,
    "sentAt" DATETIME,
    "acceptedAt" DATETIME,
    "rejectedAt" DATETIME,
    "invoicedAt" DATETIME,
    "invoiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Quote_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" REAL NOT NULL DEFAULT 1,
    "unitPriceExcl" REAL NOT NULL,
    "vatRate" REAL NOT NULL DEFAULT 0.20,
    "lineTotalExcl" REAL NOT NULL DEFAULT 0,
    "lineVatAmount" REAL NOT NULL DEFAULT 0,
    "lineTotalIncl" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "vehicleId" TEXT,
    "quoteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "invoiceNumber" TEXT,
    "invoiceYear" INTEGER,
    "invoiceSeq" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "vatMode" TEXT NOT NULL,
    "subtotalExcl" REAL NOT NULL DEFAULT 0,
    "totalVat" REAL NOT NULL DEFAULT 0,
    "totalIncl" REAL NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "issuedAt" DATETIME,
    "dueAt" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Invoice_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" REAL NOT NULL DEFAULT 1,
    "unitPriceExcl" REAL NOT NULL,
    "vatRate" REAL NOT NULL DEFAULT 0.20,
    "lineTotalExcl" REAL NOT NULL DEFAULT 0,
    "lineVatAmount" REAL NOT NULL DEFAULT 0,
    "lineTotalIncl" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" INTEGER NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "garageId" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "vatProfile" TEXT NOT NULL DEFAULT 'PARTICULIER',
    "vatNumber" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'FR',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    CONSTRAINT "Client_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("address", "createdAt", "deletedAt", "email", "firstName", "garageId", "id", "lastName", "notes", "phone", "updatedAt") SELECT "address", "createdAt", "deletedAt", "email", "firstName", "garageId", "id", "lastName", "notes", "phone", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_garageId_idx" ON "Client"("garageId");
CREATE INDEX "Client_garageId_deletedAt_idx" ON "Client"("garageId", "deletedAt");
CREATE TABLE "new_Garage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "siret" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defaultVatRate" REAL NOT NULL DEFAULT 0.20,
    "defaultVatMode" TEXT NOT NULL DEFAULT 'EXCL',
    "vatRatesAllowed" JSONB NOT NULL DEFAULT [0,0.055,0.10,0.20],
    "quotePrefix" TEXT NOT NULL DEFAULT 'DEV',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'FAC',
    "numberPadding" INTEGER NOT NULL DEFAULT 4,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE',
    "currentPeriodEnd" DATETIME
);
INSERT INTO "new_Garage" ("address", "createdAt", "currentPeriodEnd", "email", "id", "name", "phone", "plan", "reviewNote", "reviewedAt", "siret", "slug", "status", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "updatedAt") SELECT "address", "createdAt", "currentPeriodEnd", "email", "id", "name", "phone", "plan", "reviewNote", "reviewedAt", "siret", "slug", "status", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "updatedAt" FROM "Garage";
DROP TABLE "Garage";
ALTER TABLE "new_Garage" RENAME TO "Garage";
CREATE UNIQUE INDEX "Garage_slug_key" ON "Garage"("slug");
CREATE UNIQUE INDEX "Garage_email_key" ON "Garage"("email");
CREATE UNIQUE INDEX "Garage_stripeCustomerId_key" ON "Garage"("stripeCustomerId");
CREATE UNIQUE INDEX "Garage_stripeSubscriptionId_key" ON "Garage"("stripeSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NumberSequence_organisationId_type_year_idx" ON "NumberSequence"("organisationId", "type", "year");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_organisationId_type_year_key" ON "NumberSequence"("organisationId", "type", "year");

-- CreateIndex
CREATE INDEX "Quote_organisationId_idx" ON "Quote"("organisationId");

-- CreateIndex
CREATE INDEX "Quote_organisationId_deletedAt_idx" ON "Quote"("organisationId", "deletedAt");

-- CreateIndex
CREATE INDEX "Quote_organisationId_clientId_idx" ON "Quote"("organisationId", "clientId");

-- CreateIndex
CREATE INDEX "Quote_organisationId_vehicleId_idx" ON "Quote"("organisationId", "vehicleId");

-- CreateIndex
CREATE INDEX "Quote_organisationId_status_idx" ON "Quote"("organisationId", "status");

-- CreateIndex
CREATE INDEX "Quote_organisationId_quoteNumber_idx" ON "Quote"("organisationId", "quoteNumber");

-- CreateIndex
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteLine_quoteId_deletedAt_idx" ON "QuoteLine"("quoteId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_quoteId_key" ON "Invoice"("quoteId");

-- CreateIndex
CREATE INDEX "Invoice_organisationId_idx" ON "Invoice"("organisationId");

-- CreateIndex
CREATE INDEX "Invoice_organisationId_deletedAt_idx" ON "Invoice"("organisationId", "deletedAt");

-- CreateIndex
CREATE INDEX "Invoice_organisationId_clientId_idx" ON "Invoice"("organisationId", "clientId");

-- CreateIndex
CREATE INDEX "Invoice_organisationId_vehicleId_idx" ON "Invoice"("organisationId", "vehicleId");

-- CreateIndex
CREATE INDEX "Invoice_organisationId_status_idx" ON "Invoice"("organisationId", "status");

-- CreateIndex
CREATE INDEX "Invoice_organisationId_invoiceNumber_idx" ON "Invoice"("organisationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_deletedAt_idx" ON "InvoiceLine"("invoiceId", "deletedAt");

-- CreateIndex
CREATE INDEX "Payment_organisationId_idx" ON "Payment"("organisationId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_organisationId_invoiceId_idx" ON "Payment"("organisationId", "invoiceId");
