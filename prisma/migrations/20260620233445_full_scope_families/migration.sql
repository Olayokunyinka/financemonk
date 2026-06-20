-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'ASSET_FINANCE';
ALTER TYPE "ProductType" ADD VALUE 'MORTGAGE';
ALTER TYPE "ProductType" ADD VALUE 'TRADE_FINANCE';
ALTER TYPE "ProductType" ADD VALUE 'DOMICILIARY';
ALTER TYPE "ProductType" ADD VALUE 'PREPAID_CARD';
ALTER TYPE "ProductType" ADD VALUE 'VIRTUAL_CARD';
ALTER TYPE "ProductType" ADD VALUE 'TRAVEL_INSURANCE';
ALTER TYPE "ProductType" ADD VALUE 'BUSINESS_INSURANCE';
ALTER TYPE "ProductType" ADD VALUE 'AGRIC_INSURANCE';
ALTER TYPE "ProductType" ADD VALUE 'FIXED_INCOME';
ALTER TYPE "ProductType" ADD VALUE 'PENSION';
ALTER TYPE "ProductType" ADD VALUE 'MONEY_TRANSFER';
ALTER TYPE "ProductType" ADD VALUE 'FX';
ALTER TYPE "ProductType" ADD VALUE 'REMITTANCE';

-- AlterTable
-- (Removed Prisma's spurious `ALTER COLUMN "searchVector" DROP DEFAULT` —
-- generated tsvector column with no default to drop.)
ALTER TABLE "Product" ADD COLUMN "terms" JSONB NOT NULL DEFAULT '{}';
