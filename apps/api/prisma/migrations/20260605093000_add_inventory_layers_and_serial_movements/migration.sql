-- Inventory valuation layers for FIFO / moving-average costing.
CREATE TABLE "InventoryLayer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sourceLedgerId" TEXT,
    "sourceVoucherId" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'movement',
    "warehouseId" TEXT,
    "binId" TEXT,
    "batchNo" TEXT,
    "lotNo" TEXT,
    "expiryDate" TIMESTAMP(3),
    "expiryDateBs" TEXT,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "qtyIn" DECIMAL(14,2) NOT NULL,
    "remainingQty" DECIMAL(14,2) NOT NULL,
    "unitCost" DECIMAL(14,6) NOT NULL,
    "totalCost" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLayer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryLayer_companyId_itemId_remainingQty_idx" ON "InventoryLayer"("companyId", "itemId", "remainingQty");
CREATE INDEX "InventoryLayer_companyId_itemId_warehouseId_binId_idx" ON "InventoryLayer"("companyId", "itemId", "warehouseId", "binId");
CREATE INDEX "InventoryLayer_companyId_itemId_batchNo_lotNo_expiryDate_idx" ON "InventoryLayer"("companyId", "itemId", "batchNo", "lotNo", "expiryDate");
CREATE INDEX "InventoryLayer_sourceLedgerId_idx" ON "InventoryLayer"("sourceLedgerId");

-- Serial audit trail. SerialNumber keeps current state; this table records every movement.
CREATE TABLE "SerialNumberMovement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "serialNumberId" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "voucherId" TEXT,
    "stockLedgerId" TEXT,
    "movementType" TEXT NOT NULL,
    "statusFrom" TEXT,
    "statusTo" TEXT,
    "fromWarehouseId" TEXT,
    "fromBinId" TEXT,
    "toWarehouseId" TEXT,
    "toBinId" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "movementDateBs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SerialNumberMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SerialNumberMovement_companyId_itemId_movementDate_idx" ON "SerialNumberMovement"("companyId", "itemId", "movementDate");
CREATE INDEX "SerialNumberMovement_companyId_serialNo_idx" ON "SerialNumberMovement"("companyId", "serialNo");
CREATE INDEX "SerialNumberMovement_serialNumberId_movementDate_idx" ON "SerialNumberMovement"("serialNumberId", "movementDate");
CREATE INDEX "SerialNumberMovement_voucherId_idx" ON "SerialNumberMovement"("voucherId");
