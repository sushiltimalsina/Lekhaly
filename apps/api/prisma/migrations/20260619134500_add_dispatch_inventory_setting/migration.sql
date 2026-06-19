ALTER TABLE "InventorySettings"
ADD COLUMN IF NOT EXISTS "dispatchWorkflowEnabled" BOOLEAN NOT NULL DEFAULT true;
