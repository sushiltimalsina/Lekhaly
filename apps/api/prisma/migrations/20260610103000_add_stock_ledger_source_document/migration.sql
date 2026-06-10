-- Add source-document references so stock ledger rows can open the exact originating page.
ALTER TABLE "StockLedger"
  ADD COLUMN "sourceDocumentType" TEXT,
  ADD COLUMN "sourceDocumentId" TEXT;

CREATE INDEX "StockLedger_companyId_sourceDocumentType_sourceDocumentId_idx"
  ON "StockLedger"("companyId", "sourceDocumentType", "sourceDocumentId");

UPDATE "StockLedger"
SET "sourceDocumentType" = 'voucher',
    "sourceDocumentId" = "voucherId"
WHERE "voucherId" IS NOT NULL
  AND "sourceDocumentType" IS NULL;

UPDATE "StockLedger"
SET "sourceDocumentType" = 'opening',
    "sourceDocumentId" = "itemId"
WHERE "voucherId" IS NULL
  AND "sourceDocumentType" IS NULL;
