-- Performance indexes for common queries
-- Safe migration: CREATE INDEX IF NOT EXISTS is not standard PostgreSQL,
-- so we use CREATE INDEX CONCURRENTLY wrapped in DO blocks for safety

-- Intervention: index on (garageId, createdAt) for sorted list queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Intervention_garageId_createdAt_idx" 
ON "Intervention" ("garageId", "createdAt" DESC);

-- Intervention: index on (garageId, status) for filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Intervention_garageId_status_idx" 
ON "Intervention" ("garageId", "status");

-- Client: index on (garageId, lastName, firstName) for sorted list
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Client_garageId_lastName_firstName_idx" 
ON "Client" ("garageId", "lastName", "firstName");

-- SignatureRequest: index on (status) for filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SignatureRequest_status_idx" 
ON "SignatureRequest" ("status");

-- SignatureRequest: index on (garageId, status) for garage-filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SignatureRequest_garageId_status_idx" 
ON "SignatureRequest" ("garageId", "status");

-- Document: index on (garageId, createdAt) for sorted document list
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Document_garageId_createdAt_idx" 
ON "Document" ("garageId", "createdAt" DESC);
