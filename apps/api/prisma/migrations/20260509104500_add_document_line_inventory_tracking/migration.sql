-- Add line-level inventory tracking fields to invoices and vouchers.
ALTER TABLE "InvoiceItem"
ADD COLUMN "warehouseId" TEXT,
ADD COLUMN "binId" TEXT,
ADD COLUMN "batchNo" TEXT,
ADD COLUMN "lotNo" TEXT,
ADD COLUMN "expiryDate" TIMESTAMP(3),
ADD COLUMN "expiryDateBs" TEXT,
ADD COLUMN "serialNumbers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "VoucherLine"
ADD COLUMN "warehouseId" TEXT,
ADD COLUMN "binId" TEXT,
ADD COLUMN "batchNo" TEXT,
ADD COLUMN "lotNo" TEXT,
ADD COLUMN "expiryDate" TIMESTAMP(3),
ADD COLUMN "expiryDateBs" TEXT,
ADD COLUMN "serialNumbers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "InvoiceItem_warehouseId_binId_idx" ON "InvoiceItem"("warehouseId", "binId");
CREATE INDEX "VoucherLine_warehouseId_binId_idx" ON "VoucherLine"("warehouseId", "binId");

ALTER TABLE "InvoiceItem"
ADD CONSTRAINT "InvoiceItem_warehouseId_fkey"
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvoiceItem"
ADD CONSTRAINT "InvoiceItem_binId_fkey"
FOREIGN KEY ("binId") REFERENCES "WarehouseBin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VoucherLine"
ADD CONSTRAINT "VoucherLine_warehouseId_fkey"
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VoucherLine"
ADD CONSTRAINT "VoucherLine_binId_fkey"
FOREIGN KEY ("binId") REFERENCES "WarehouseBin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
