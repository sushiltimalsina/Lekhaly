ALTER TABLE "Item" ADD COLUMN "defaultWarehouseId" TEXT;
ALTER TABLE "Item" ADD COLUMN "defaultBinId" TEXT;
ALTER TABLE "Item" ADD COLUMN "defaultBatchNo" TEXT;
ALTER TABLE "Item" ADD COLUMN "defaultLotNo" TEXT;
ALTER TABLE "Item" ADD COLUMN "defaultExpiryDate" TIMESTAMP(3);
ALTER TABLE "Item" ADD COLUMN "defaultExpiryDateBs" TEXT;
