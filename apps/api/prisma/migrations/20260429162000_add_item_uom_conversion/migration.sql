-- AlterTable
ALTER TABLE "Item"
ADD COLUMN "baseUnit" TEXT;

-- CreateTable
CREATE TABLE "ItemUomConversion" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "factor" DECIMAL(14,6) NOT NULL,
  "isBase" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItemUomConversion_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "ItemUomConversion_itemId_unit_key" ON "ItemUomConversion"("itemId", "unit");
CREATE INDEX "ItemUomConversion_itemId_isBase_idx" ON "ItemUomConversion"("itemId", "isBase");

-- FKs
ALTER TABLE "ItemUomConversion"
ADD CONSTRAINT "ItemUomConversion_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
