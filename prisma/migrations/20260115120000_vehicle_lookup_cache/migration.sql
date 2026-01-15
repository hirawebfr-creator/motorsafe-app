-- CreateTable
CREATE TABLE "VehicleLookupCache" (
    "id" TEXT NOT NULL,
    "garageId" INTEGER NOT NULL,
    "plateNormalized" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'apiplaqueimmatriculation',
    "dataJson" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleLookupCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleLookupLog" (
    "id" TEXT NOT NULL,
    "garageId" INTEGER NOT NULL,
    "plateNormalized" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "source" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleLookupLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleLookupCache_garageId_idx" ON "VehicleLookupCache"("garageId");

-- CreateIndex
CREATE INDEX "VehicleLookupCache_expiresAt_idx" ON "VehicleLookupCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleLookupCache_garageId_plateNormalized_provider_key" ON "VehicleLookupCache"("garageId", "plateNormalized", "provider");

-- CreateIndex
CREATE INDEX "VehicleLookupLog_garageId_idx" ON "VehicleLookupLog"("garageId");

-- CreateIndex
CREATE INDEX "VehicleLookupLog_createdAt_idx" ON "VehicleLookupLog"("createdAt");
