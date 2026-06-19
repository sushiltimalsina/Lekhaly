CREATE TABLE IF NOT EXISTS "StockReservation" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "salesOrderId" TEXT,
  "salesOrderItemId" TEXT,
  "itemId" TEXT NOT NULL,
  "warehouseId" TEXT,
  "binId" TEXT,
  "batchNo" TEXT,
  "lotNo" TEXT,
  "expiryDate" TIMESTAMP(3),
  "expiryDateBs" TEXT,
  "serialNumbers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "qty" DECIMAL(14,2) NOT NULL,
  "reservedQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "releasedQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "fulfilledQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StockReservation_companyId_itemId_status_idx" ON "StockReservation"("companyId", "itemId", "status");
CREATE INDEX IF NOT EXISTS "StockReservation_companyId_salesOrderId_idx" ON "StockReservation"("companyId", "salesOrderId");
CREATE INDEX IF NOT EXISTS "StockReservation_companyId_warehouseId_binId_idx" ON "StockReservation"("companyId", "warehouseId", "binId");
CREATE INDEX IF NOT EXISTS "StockReservation_companyId_batchNo_lotNo_expiryDate_idx" ON "StockReservation"("companyId", "batchNo", "lotNo", "expiryDate");

CREATE TABLE IF NOT EXISTS "InventoryTrackedStockMaster" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "warehouseId" TEXT,
  "binId" TEXT,
  "batchNo" TEXT,
  "lotNo" TEXT,
  "expiryDate" TIMESTAMP(3),
  "expiryDateBs" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "firstReceivedAt" TIMESTAMP(3),
  "lastMovementAt" TIMESTAMP(3),
  "currentQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "reservedQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "unitCost" DECIMAL(14,6) NOT NULL DEFAULT 0,
  "value" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryTrackedStockMaster_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InventoryTrackedStockMaster_companyId_itemId_idx" ON "InventoryTrackedStockMaster"("companyId", "itemId");
CREATE INDEX IF NOT EXISTS "InventoryTrackedStockMaster_companyId_warehouseId_binId_idx" ON "InventoryTrackedStockMaster"("companyId", "warehouseId", "binId");
CREATE INDEX IF NOT EXISTS "InventoryTrackedStockMaster_companyId_batchNo_lotNo_expiryDate_idx" ON "InventoryTrackedStockMaster"("companyId", "batchNo", "lotNo", "expiryDate");

CREATE TABLE IF NOT EXISTS "GoodsReceipt" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "receiptNo" TEXT,
  "purchaseOrderId" TEXT,
  "supplierId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "dateBs" TEXT,
  "status" TEXT NOT NULL DEFAULT 'posted',
  "memo" TEXT,
  "postedByUserId" TEXT,
  "postedAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GoodsReceipt_companyId_date_idx" ON "GoodsReceipt"("companyId", "date");
CREATE INDEX IF NOT EXISTS "GoodsReceipt_companyId_purchaseOrderId_idx" ON "GoodsReceipt"("companyId", "purchaseOrderId");

CREATE TABLE IF NOT EXISTS "GoodsReceiptLine" (
  "id" TEXT NOT NULL,
  "goodsReceiptId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "qty" DECIMAL(14,2) NOT NULL,
  "rate" DECIMAL(14,6) NOT NULL DEFAULT 0,
  "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "warehouseId" TEXT,
  "binId" TEXT,
  "batchNo" TEXT,
  "lotNo" TEXT,
  "expiryDate" TIMESTAMP(3),
  "expiryDateBs" TEXT,
  "stockLedgerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GoodsReceiptLine_goodsReceiptId_idx" ON "GoodsReceiptLine"("goodsReceiptId");
CREATE INDEX IF NOT EXISTS "GoodsReceiptLine_itemId_idx" ON "GoodsReceiptLine"("itemId");
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "StockDispatch" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "dispatchNo" TEXT,
  "salesOrderId" TEXT,
  "customerId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "dateBs" TEXT,
  "status" TEXT NOT NULL DEFAULT 'posted',
  "memo" TEXT,
  "postedByUserId" TEXT,
  "postedAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockDispatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StockDispatch_companyId_date_idx" ON "StockDispatch"("companyId", "date");
CREATE INDEX IF NOT EXISTS "StockDispatch_companyId_salesOrderId_idx" ON "StockDispatch"("companyId", "salesOrderId");

CREATE TABLE IF NOT EXISTS "StockDispatchLine" (
  "id" TEXT NOT NULL,
  "stockDispatchId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "qty" DECIMAL(14,2) NOT NULL,
  "rate" DECIMAL(14,6) NOT NULL DEFAULT 0,
  "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "warehouseId" TEXT,
  "binId" TEXT,
  "batchNo" TEXT,
  "lotNo" TEXT,
  "expiryDate" TIMESTAMP(3),
  "expiryDateBs" TEXT,
  "stockLedgerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockDispatchLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StockDispatchLine_stockDispatchId_idx" ON "StockDispatchLine"("stockDispatchId");
CREATE INDEX IF NOT EXISTS "StockDispatchLine_itemId_idx" ON "StockDispatchLine"("itemId");
ALTER TABLE "StockDispatchLine" ADD CONSTRAINT "StockDispatchLine_stockDispatchId_fkey" FOREIGN KEY ("stockDispatchId") REFERENCES "StockDispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "InventoryMovementApproval" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "movementType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payloadJson" JSONB NOT NULL,
  "reason" TEXT,
  "requestedByUserId" TEXT,
  "approvedByUserId" TEXT,
  "rejectedByUserId" TEXT,
  "reversedByUserId" TEXT,
  "postedVoucherId" TEXT,
  "reversalVoucherId" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovementApproval_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InventoryMovementApproval_companyId_status_idx" ON "InventoryMovementApproval"("companyId", "status");
CREATE INDEX IF NOT EXISTS "InventoryMovementApproval_companyId_movementType_idx" ON "InventoryMovementApproval"("companyId", "movementType");

CREATE TABLE IF NOT EXISTS "InventoryPeriodClose" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "periodFrom" TIMESTAMP(3) NOT NULL,
  "periodFromBs" TEXT,
  "periodTo" TIMESTAMP(3) NOT NULL,
  "periodToBs" TEXT,
  "status" TEXT NOT NULL DEFAULT 'closed',
  "costingMethod" TEXT,
  "totalQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "snapshotJson" JSONB NOT NULL,
  "closedByUserId" TEXT,
  "reopenedByUserId" TEXT,
  "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reopenedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryPeriodClose_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InventoryPeriodClose_companyId_periodTo_idx" ON "InventoryPeriodClose"("companyId", "periodTo");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryPeriodClose_companyId_periodFrom_periodTo_key" ON "InventoryPeriodClose"("companyId", "periodFrom", "periodTo");
