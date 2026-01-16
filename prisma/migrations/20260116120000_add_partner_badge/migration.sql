-- AlterTable: Add partner badge fields to Garage
ALTER TABLE "Garage" ADD COLUMN "partnerBadgeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Garage" ADD COLUMN "partnerBadgeAdminOverride" TEXT NOT NULL DEFAULT 'NONE';
