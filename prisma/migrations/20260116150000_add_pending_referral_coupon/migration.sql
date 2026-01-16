-- Add pending referral coupon fields to Garage
ALTER TABLE "Garage" ADD COLUMN "pendingReferralCouponId" TEXT;
ALTER TABLE "Garage" ADD COLUMN "pendingReferralMonthsApplied" INTEGER;
