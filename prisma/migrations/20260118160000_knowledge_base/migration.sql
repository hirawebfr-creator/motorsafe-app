-- KNOWLEDGE-BASE-01: Knowledge Base tables for articles and categories
-- Categories for organizing KB articles

CREATE TABLE "KbCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KbCategory_pkey" PRIMARY KEY ("id")
);

-- Unique index on slug
CREATE UNIQUE INDEX "KbCategory_slug_key" ON "KbCategory"("slug");

-- KB Articles
CREATE TABLE "KbArticle" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KbArticle_pkey" PRIMARY KEY ("id")
);

-- Unique index on slug
CREATE UNIQUE INDEX "KbArticle_slug_key" ON "KbArticle"("slug");

-- Index for category + published filter
CREATE INDEX "KbArticle_categoryId_isPublished_idx" ON "KbArticle"("categoryId", "isPublished");

-- Foreign key to category
ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "KbCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign keys to User (optional, nullable)
ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_createdByUserId_fkey" 
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_updatedByUserId_fkey" 
    FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
