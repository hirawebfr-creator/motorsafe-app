-- AlterTable
ALTER TABLE "Garage" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "Garage" ADD COLUMN "reviewedAt" DATETIME;

-- CreateTable
CREATE TABLE "LegalReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sourceUrl" TEXT,
    "code" TEXT,
    "articleRef" TEXT,
    "tags" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LegalReferenceAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    CONSTRAINT "LegalReferenceAssignment_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "LegalReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LegalReferenceAssignment_referenceId_idx" ON "LegalReferenceAssignment"("referenceId");

-- CreateIndex
CREATE INDEX "LegalReferenceAssignment_interventionType_idx" ON "LegalReferenceAssignment"("interventionType");
