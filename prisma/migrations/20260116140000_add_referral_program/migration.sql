-- Add referral fields to Garage
ALTER TABLE "Garage" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "Garage" ADD COLUMN "referredByGarageId" INTEGER;
ALTER TABLE "Garage" ADD COLUMN "referralStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Garage" ADD COLUMN "referralRewardMonths" INTEGER NOT NULL DEFAULT 0;

-- Create unique index on referralCode
CREATE UNIQUE INDEX "Garage_referralCode_key" ON "Garage"("referralCode");

-- Add foreign key constraint
ALTER TABLE "Garage" ADD CONSTRAINT "Garage_referredByGarageId_fkey" FOREIGN KEY ("referredByGarageId") REFERENCES "Garage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create ReferralEvent table
CREATE TABLE "ReferralEvent" (
    "id" TEXT NOT NULL,
    "referrerGarageId" INTEGER NOT NULL,
    "refereeGarageId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metaJson" TEXT,

    CONSTRAINT "ReferralEvent_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ReferralEvent
CREATE INDEX "ReferralEvent_referrerGarageId_idx" ON "ReferralEvent"("referrerGarageId");
CREATE INDEX "ReferralEvent_refereeGarageId_idx" ON "ReferralEvent"("refereeGarageId");
CREATE INDEX "ReferralEvent_createdAt_idx" ON "ReferralEvent"("createdAt");
