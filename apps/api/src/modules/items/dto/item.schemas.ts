import { z } from "zod";

export const CreateItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().max(64).optional(),
  hsCode: z.string().trim().max(32).optional(),
  unit: z.string().trim().max(32).optional(),
  baseUnit: z.string().trim().max(32).optional(),
  uomConversions: z.array(z.object({
    unit: z.string().trim().min(1).max(32),
    factor: z.number().positive(),
    isBase: z.boolean().optional()
  })).optional(),
  type: z.enum(["goods", "services"]).optional(),
  salesPrice: z.number().nonnegative().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  safetyStock: z.number().nonnegative().optional(),
  openingQty: z.number().optional(),
  openingPrice: z.number().nonnegative().optional(),
  groupId: z.string().uuid().optional(),
  incomeAccountId: z.string().uuid().optional(),
  expenseAccountId: z.string().uuid().optional(),
  taxCodeId: z.string().uuid().optional(),
  taxCodeIds: z.array(z.string().uuid()).optional(),
  // Reorder / Low Stock
  minStockLevel: z.number().nonnegative().optional(),
  reorderQty: z.number().nonnegative().optional(),
  // Advanced inventory flags
  trackInventory: z.boolean().optional(),
  isSerialized: z.boolean().optional(),
  isKit: z.boolean().optional(),
  tracksBatch: z.boolean().optional(),
  tracksLot: z.boolean().optional(),
  tracksExpiry: z.boolean().optional(),
  defaultWarehouseId: z.string().uuid().optional(),
  defaultBinId: z.string().uuid().optional(),
  defaultBatchNo: z.string().trim().max(64).optional(),
  defaultLotNo: z.string().trim().max(64).optional(),
  defaultExpiryDate: z.coerce.date().optional(),
  defaultExpiryDateBs: z.string().trim().max(20).optional(),
  // Bill of Materials (kit components)
  components: z.array(z.object({
    componentId: z.string().uuid(),
    qty: z.number().positive()
  })).optional()
});

export const UpdateItemSchema = CreateItemSchema.partial().extend({
  isActive: z.boolean().optional()
});

export const ListItemQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  q: z.string().trim().max(120).optional(),
  type: z.enum(["goods", "services"]).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});
