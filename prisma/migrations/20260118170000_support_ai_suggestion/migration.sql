-- AI-SUGGEST-01: AI Suggestions for Support Tickets
-- Stores AI-generated suggestions with caching and rate limiting

-- SupportAiSuggestion table
CREATE TABLE "SupportAiSuggestion" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    
    -- Input hash for cache deduplication
    "inputHash" TEXT NOT NULL,
    
    -- AI output (JSON structured)
    "suggestedCategory" TEXT,
    "suggestedPriority" TEXT,
    "confidence" DOUBLE PRECISION,
    "summaryInternal" TEXT,
    "draftReplyFr" TEXT,
    "clarifyingQuestions" TEXT[],
    "kbSuggestions" TEXT[],
    "nextActionsInternal" TEXT[],
    
    -- Meta
    "provider" TEXT,
    "model" TEXT,
    "tokensUsed" INTEGER,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "SupportAiSuggestion_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "SupportAiSuggestion_ticketId_idx" ON "SupportAiSuggestion"("ticketId");
CREATE INDEX "SupportAiSuggestion_requestedBy_idx" ON "SupportAiSuggestion"("requestedBy");
CREATE INDEX "SupportAiSuggestion_inputHash_idx" ON "SupportAiSuggestion"("inputHash");
CREATE INDEX "SupportAiSuggestion_createdAt_idx" ON "SupportAiSuggestion"("createdAt");
CREATE INDEX "SupportAiSuggestion_expiresAt_idx" ON "SupportAiSuggestion"("expiresAt");

-- Foreign key to ticket (optional, allows orphan suggestions)
ALTER TABLE "SupportAiSuggestion" ADD CONSTRAINT "SupportAiSuggestion_ticketId_fkey" 
    FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign key to user
ALTER TABLE "SupportAiSuggestion" ADD CONSTRAINT "SupportAiSuggestion_requestedBy_fkey" 
    FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
