-- AI-AUTO-TRIAGE-02: Add auto-triage fields to SupportTicket
-- Safe to run: all fields are nullable or have defaults

-- Triage source: "RULES" or "AI" (null if no auto-triage)
DO $$ BEGIN
  CREATE TYPE "TriageSource" AS ENUM ('RULES', 'AI');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "autoTriageSource" "TriageSource";
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "autoTriageAt" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}';

-- Index for filtering by tags (GIN index for array containment)
CREATE INDEX IF NOT EXISTS "SupportTicket_tags_idx" ON "SupportTicket" USING GIN ("tags");

-- Index for triage source queries
CREATE INDEX IF NOT EXISTS "SupportTicket_autoTriageSource_idx" ON "SupportTicket" ("autoTriageSource");
