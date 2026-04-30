-- AlterTable
ALTER TABLE "StockLedger"
ADD COLUMN "batchNo" TEXT,
ADD COLUMN "lotNo" TEXT,
ADD COLUMN "expiryDate" TIMESTAMP(3),
ADD COLUMN "expiryDateBs" TEXT;

-- Index for expiry lookups
CREATE INDEX "StockLedger_companyId_expiryDate_idx" ON "StockLedger"("companyId", "expiryDate");
