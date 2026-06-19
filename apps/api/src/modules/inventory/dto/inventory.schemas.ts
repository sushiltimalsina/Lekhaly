import { z } from "zod";

export const StockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  date: z.coerce.date().optional(),
  dateBs: z.string().trim().max(20).optional(),
  qty: z.number(),
  rate: z.number().nonnegative().optional(),
  accountId: z.string().uuid().optional(),
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

const TrackedMovementLineSchema = z.object({
  itemId: z.string().uuid(),
  qty: z.number().positive(),
  rate: z.number().nonnegative().optional(),
  warehouseId: z.string().uuid().optional(),
  binId: z.string().uuid().optional(),
  batchNo: z.string().trim().max(64).optional(),
  lotNo: z.string().trim().max(64).optional(),
  expiryDate: z.coerce.date().optional(),
  expiryDateBs: z.string().trim().max(20).optional(),
  serialNumbers: z.array(z.string().trim().min(1).max(120)).optional()
});

export const GoodsReceiptSchema = z.object({
  receiptNo: z.string().trim().max(64).optional(),
  purchaseOrderId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
  dateBs: z.string().trim().max(20).optional(),
  memo: z.string().trim().max(255).optional(),
  lines: z.array(TrackedMovementLineSchema).min(1)
}).superRefine((data, ctx) => {
  if (!data.date && !data.dateBs) {
    ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
  }
});

export const GoodsReceiptQuerySchema = z.object({
  purchaseOrderId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.enum(["draft", "posted", "reversed"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
  skip: z.coerce.number().int().min(0).optional()
});

export const StockDispatchQuerySchema = z.object({
  salesOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(["draft", "posted", "reversed"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
  skip: z.coerce.number().int().min(0).optional()
});

export const StockDispatchSchema = z.object({
  dispatchNo: z.string().trim().max(64).optional(),
  salesOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
  dateBs: z.string().trim().max(20).optional(),
  memo: z.string().trim().max(255).optional(),
  lines: z.array(TrackedMovementLineSchema).min(1)
}).superRefine((data, ctx) => {
  if (!data.date && !data.dateBs) {
    ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
  }
});

export const SalesOrderReservationSchema = z.object({
  salesOrderId: z.string().uuid(),
  expiresAt: z.coerce.date().optional()
});

export const ReservationQuerySchema = z.object({
  itemId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
  status: z.enum(["active", "partial", "fulfilled", "released", "cancelled"]).optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});

export const MovementApprovalRequestSchema = z.object({
  movementType: z.enum(["adjustment", "transfer"]),
  payload: z.record(z.string(), z.any()),
  reason: z.string().trim().max(255).optional()
});

export const MovementApprovalQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "reversed"]).optional(),
  movementType: z.enum(["adjustment", "transfer"]).optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});

export const MovementApprovalActionSchema = z.object({
  reason: z.string().trim().max(255).optional()
});

export const InventoryPeriodCloseSchema = z.object({
  periodFrom: z.coerce.date().optional(),
  periodFromBs: z.string().trim().max(20).optional(),
  periodTo: z.coerce.date().optional(),
  periodToBs: z.string().trim().max(20).optional()
}).superRefine((data, ctx) => {
  if (!data.periodFrom && !data.periodFromBs) {
    ctx.addIssue({ code: "custom", message: "periodFrom or periodFromBs is required", path: ["periodFrom"] });
  }
  if (!data.periodTo && !data.periodToBs) {
    ctx.addIssue({ code: "custom", message: "periodTo or periodToBs is required", path: ["periodTo"] });
  }
});

export const InventoryPeriodCloseQuerySchema = z.object({
  status: z.enum(["closed", "reopened"]).optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});

export const BatchLotMasterQuerySchema = z.object({
  itemId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  binId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
  includeZero: z.coerce.boolean().optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});

export const StockAgingQuerySchema = z.object({
  asOf: z.coerce.date().optional(),
  asOfBs: z.string().trim().max(20).optional(),
  includeZero: z.coerce.boolean().optional(),
  valuationMethod: z.enum(["fifo", "weighted_average"]).optional()
});

export const StockValuationQuerySchema = z.object({
  itemId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  binId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
  includeZero: z.coerce.boolean().optional()
});

export const TrackedStockQuerySchema = z.object({
  itemId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  binId: z.string().uuid().optional()
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
  goodsReceiptWorkflowEnabled: z.boolean().optional(),
  dispatchWorkflowEnabled: z.boolean().optional(),
  adjustmentApprovalRequired: z.boolean().optional(),
  transferApprovalRequired: z.boolean().optional(),
  negativeStockApprovalRequired: z.boolean().optional(),
  reversalApprovalRequired: z.boolean().optional(),
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
