-- AlterTable
ALTER TABLE "Item"
ADD COLUMN "tracksBatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tracksLot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tracksExpiry" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "InventorySettings" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "inventoryTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
  "warehousesEnabled" BOOLEAN NOT NULL DEFAULT false,
  "binsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "batchTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "lotTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "expiryTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "serialTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "kitsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
  "requireWarehouseOnMovements" BOOLEAN NOT NULL DEFAULT false,
  "defaultWarehouseId" TEXT,
  "costingMethod" TEXT NOT NULL DEFAULT 'moving_average',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventorySettings_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "InventorySettings_companyId_key" ON "InventorySettings"("companyId");
CREATE INDEX "InventorySettings_companyId_idx" ON "InventorySettings"("companyId");

-- FKs
ALTER TABLE "InventorySettings"
ADD CONSTRAINT "InventorySettings_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

