-- Make SKU unique per company and allow duplicate item names
DROP INDEX IF EXISTS "Item_companyId_name_key";
CREATE UNIQUE INDEX "Item_companyId_sku_key" ON "Item"("companyId", "sku");
