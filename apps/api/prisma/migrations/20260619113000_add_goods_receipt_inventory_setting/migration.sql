ALTER TABLE "InventorySettings"
ADD COLUMN IF NOT EXISTS "goodsReceiptWorkflowEnabled" BOOLEAN NOT NULL DEFAULT true;
