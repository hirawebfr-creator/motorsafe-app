-- Add public profile fields to Garage
ALTER TABLE "Garage" ADD COLUMN "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Garage" ADD COLUMN "publicPhone" TEXT;
ALTER TABLE "Garage" ADD COLUMN "publicWebsite" TEXT;
