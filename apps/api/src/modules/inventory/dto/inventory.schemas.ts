import { z } from "zod";

export const StockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  date: z.coerce.date().optional(),
  dateBs: z.string().trim().max(20).optional(),
  qty: z.number(),
  rate: z.number().nonnegative().optional(),
  accountId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  binId: z.string().uuid().optional(),
  memo: z.string().trim().max(255).optional(),
  batchNo: z.string().trim().max(64).optional(),
  lotNo: z.string().trim().max(64).optional(),
  expiryDate: z.coerce.date().optional(),
  expiryDateBs: z.string().trim().max(20).optional(),
  serialNumbers: z.array(z.string().trim().min(1).max(120)).optional(),
  allowNegativeOverride: z.boolean().optional(),
  overrideReason: z.string().trim().max(255).optional()
}).superRefine((data, ctx) => {
  if (!data.date && !data.dateBs) {
    ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
  }
  if (data.allowNegativeOverride && !data.overrideReason) {
    ctx.addIssue({
      code: "custom",
      message: "overrideReason is required when allowNegativeOverride is true",
      path: ["overrideReason"]
    });
  }
});

export const StockQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const StockAgingQuerySchema = z.object({
  asOf: z.coerce.date().optional(),
  asOfBs: z.string().trim().max(20).optional(),
  includeZero: z.coerce.boolean().optional(),
  valuationMethod: z.enum(["fifo", "weighted_average"]).optional()
});

export const StockTransferSchema = z.object({
  itemId: z.string().uuid(),
  fromWarehouseId: z.string().uuid(),
  fromBinId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid(),
  toBinId: z.string().uuid().optional(),
  qty: z.number().positive(),
  rate: z.number().nonnegative().optional(),
  batchNo: z.string().trim().max(64).optional(),
  lotNo: z.string().trim().max(64).optional(),
  expiryDate: z.coerce.date().optional(),
  expiryDateBs: z.string().trim().max(20).optional(),
  serialNumbers: z.array(z.string().trim().min(1).max(120)).optional(),
  date: z.coerce.date().optional(),
  dateBs: z.string().trim().max(20).optional(),
  memo: z.string().trim().max(255).optional()
}).superRefine((data, ctx) => {
  if (!data.date && !data.dateBs) {
    ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
  }
  if (data.fromWarehouseId === data.toWarehouseId && (data.fromBinId || null) === (data.toBinId || null)) {
    ctx.addIssue({ code: "custom", message: "Source and destination cannot be the same", path: ["toWarehouseId"] });
  }
});

export const InventoryAlertsQuerySchema = z.object({
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  noMovementDays: z.coerce.number().int().min(1).max(3650).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional()
});

export const InventorySettingsSchema = z.object({
  inventoryTrackingEnabled: z.boolean().optional(),
  warehousesEnabled: z.boolean().optional(),
  binsEnabled: z.boolean().optional(),
  batchTrackingEnabled: z.boolean().optional(),
  lotTrackingEnabled: z.boolean().optional(),
  expiryTrackingEnabled: z.boolean().optional(),
  serialTrackingEnabled: z.boolean().optional(),
  kitsEnabled: z.boolean().optional(),
  allowNegativeStock: z.boolean().optional(),
  requireWarehouseOnMovements: z.boolean().optional(),
  defaultWarehouseId: z.string().uuid().nullable().optional(),
  costingMethod: z.enum(["moving_average", "fifo"]).optional()
}).superRefine((data, ctx) => {
  if (data.binsEnabled && data.warehousesEnabled === false) {
    ctx.addIssue({ code: "custom", message: "Bins require warehouses to be enabled", path: ["binsEnabled"] });
  }
  if (data.requireWarehouseOnMovements && data.warehousesEnabled === false) {
    ctx.addIssue({ code: "custom", message: "Required warehouse needs warehouses to be enabled", path: ["requireWarehouseOnMovements"] });
  }
});

export const SerialQuerySchema = z.object({
  itemId: z.string().uuid().optional(),
  status: z.enum(["available", "sold", "returned", "reserved", "damaged"]).optional(),
  q: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});

export const SerialMovementQuerySchema = z.object({
  itemId: z.string().uuid().optional(),
  serialNo: z.string().trim().max(120).optional(),
  voucherId: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});
