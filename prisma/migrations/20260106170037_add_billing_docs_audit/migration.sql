-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garageId" INTEGER,
    "vehicleId" TEXT,
    "interventionId" TEXT,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Document_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garageId" INTEGER,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garageId" INTEGER,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garageId" INTEGER,
    "type" TEXT NOT NULL,
    "apiVersion" TEXT,
    "created" INTEGER NOT NULL,
    "livemode" BOOLEAN NOT NULL,
    "processedAt" DATETIME,
    "lastError" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripeEvent_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    CONSTRAINT "Client_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("createdAt", "firstName", "garageId", "id", "lastName") SELECT "createdAt", "firstName", "garageId", "id", "lastName" FROM "Client";
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
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE',
    "currentPeriodEnd" DATETIME
);
INSERT INTO "new_Garage" ("address", "createdAt", "email", "id", "name", "phone", "reviewNote", "reviewedAt", "siret", "status") SELECT "address", "createdAt", "email", "id", "name", "phone", "reviewNote", "reviewedAt", "siret", "status" FROM "Garage";
DROP TABLE "Garage";
ALTER TABLE "new_Garage" RENAME TO "Garage";
CREATE UNIQUE INDEX "Garage_slug_key" ON "Garage"("slug");
CREATE UNIQUE INDEX "Garage_email_key" ON "Garage"("email");
CREATE UNIQUE INDEX "Garage_stripeCustomerId_key" ON "Garage"("stripeCustomerId");
CREATE UNIQUE INDEX "Garage_stripeSubscriptionId_key" ON "Garage"("stripeSubscriptionId");
CREATE TABLE "new_Intervention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garageId" INTEGER,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT,
    "amountCents" INTEGER,
    "createdBy" TEXT,
    "clientIp" TEXT,
    "userAgent" TEXT,
    "hash" TEXT,
    "payload" TEXT,
    "performedAt" DATETIME,
    "odometerKm" INTEGER,
    "ecuType" TEXT,
    "softwareVersion" TEXT,
    "checksum" TEXT,
    CONSTRAINT "Intervention_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Intervention_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Intervention" ("checksum", "clientIp", "createdAt", "createdBy", "ecuType", "garageId", "hash", "id", "notes", "odometerKm", "payload", "performedAt", "softwareVersion", "type", "userAgent", "vehicleId") SELECT "checksum", "clientIp", "createdAt", "createdBy", "ecuType", "garageId", "hash", "id", "notes", "odometerKm", "payload", "performedAt", "softwareVersion", "type", "userAgent", "vehicleId" FROM "Intervention";
DROP TABLE "Intervention";
ALTER TABLE "new_Intervention" RENAME TO "Intervention";
CREATE UNIQUE INDEX "Intervention_hash_key" ON "Intervention"("hash");
CREATE INDEX "Intervention_garageId_idx" ON "Intervention"("garageId");
CREATE INDEX "Intervention_vehicleId_idx" ON "Intervention"("vehicleId");
CREATE INDEX "Intervention_garageId_deletedAt_idx" ON "Intervention"("garageId", "deletedAt");
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garageId" INTEGER,
    "clientId" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "vin" TEXT,
    "fuel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "year" INTEGER,
    "engine" TEXT,
    CONSTRAINT "Vehicle_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("brand", "clientId", "createdAt", "fuel", "garageId", "id", "model", "plate", "vin") SELECT "brand", "clientId", "createdAt", "fuel", "garageId", "id", "model", "plate", "vin" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE INDEX "Vehicle_garageId_idx" ON "Vehicle"("garageId");
CREATE INDEX "Vehicle_clientId_idx" ON "Vehicle"("clientId");
CREATE INDEX "Vehicle_garageId_deletedAt_idx" ON "Vehicle"("garageId", "deletedAt");
CREATE UNIQUE INDEX "Vehicle_garageId_plate_key" ON "Vehicle"("garageId", "plate");
CREATE UNIQUE INDEX "Vehicle_garageId_vin_key" ON "Vehicle"("garageId", "vin");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Document_garageId_idx" ON "Document"("garageId");

-- CreateIndex
CREATE INDEX "Document_vehicleId_idx" ON "Document"("vehicleId");

-- CreateIndex
CREATE INDEX "Document_interventionId_idx" ON "Document"("interventionId");

-- CreateIndex
CREATE INDEX "Document_garageId_deletedAt_idx" ON "Document"("garageId", "deletedAt");

-- CreateIndex
CREATE INDEX "Notification_garageId_idx" ON "Notification"("garageId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_garageId_idx" ON "AuditLog"("garageId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "StripeEvent_garageId_idx" ON "StripeEvent"("garageId");

-- CreateIndex
CREATE INDEX "StripeEvent_type_idx" ON "StripeEvent"("type");

-- CreateIndex
CREATE INDEX "StripeEvent_processedAt_idx" ON "StripeEvent"("processedAt");
