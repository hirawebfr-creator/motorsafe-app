-- Add garage branding/profile fields
-- AlterTable
ALTER TABLE "Garage" ADD COLUMN "displayName" TEXT;
ALTER TABLE "Garage" ADD COLUMN "legalName" TEXT;
ALTER TABLE "Garage" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "Garage" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "Garage" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "Garage" ADD COLUMN "city" TEXT;
ALTER TABLE "Garage" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'France';
ALTER TABLE "Garage" ADD COLUMN "logoKey" TEXT;
