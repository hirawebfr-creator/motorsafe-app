-- SUPPORT-SLA-01: Add SLA fields to SupportTicket
-- Safe to run: all new fields are nullable or have defaults

-- SLA tracking fields
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "slaTargetAt" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "slaBreachedAt" TIMESTAMP(3);

-- Message timestamp tracking for SLA
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "lastRequesterMessageAt" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "lastAdminMessageAt" TIMESTAMP(3);

-- Index for SLA breach queries (cron)
CREATE INDEX IF NOT EXISTS "SupportTicket_slaTargetAt_slaBreachedAt_idx" 
  ON "SupportTicket" ("slaTargetAt", "slaBreachedAt") 
  WHERE "status" IN ('OPEN', 'IN_PROGRESS');

-- Index for incident status page (SystemEvent queries)
CREATE INDEX IF NOT EXISTS "SystemEvent_service_createdAt_idx"
  ON "SystemEvent" ("service", "createdAt" DESC);
