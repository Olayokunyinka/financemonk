-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- (Removed Prisma's spurious `ALTER COLUMN "searchVector" DROP DEFAULT` — that
-- column is a STORED GENERATED tsvector with no default to drop.)

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created" INTEGER NOT NULL DEFAULT 0,
    "changed" INTEGER NOT NULL DEFAULT 0,
    "unchanged" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDraft" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "providerSlug" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "aprMin" DOUBLE PRECISION,
    "aprMax" DOUBLE PRECISION,
    "interestRate" DOUBLE PRECISION,
    "fees" JSONB NOT NULL DEFAULT '[]',
    "minAmount" DOUBLE PRECISION,
    "maxAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "minTenureMonths" INTEGER,
    "maxTenureMonths" INTEGER,
    "eligibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredDocs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceUrl" TEXT,
    "changeKind" TEXT NOT NULL,
    "diff" JSONB NOT NULL DEFAULT '{}',
    "issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "DraftStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductDraft_status_idx" ON "ProductDraft"("status");

-- CreateIndex
CREATE INDEX "ProductDraft_runId_idx" ON "ProductDraft"("runId");

-- AddForeignKey
ALTER TABLE "ProductDraft" ADD CONSTRAINT "ProductDraft_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
