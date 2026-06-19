ALTER TABLE "InventorySettings"
ADD COLUMN IF NOT EXISTS "adjustmentApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "transferApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "negativeStockApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "reversalApprovalRequired" BOOLEAN NOT NULL DEFAULT true;
