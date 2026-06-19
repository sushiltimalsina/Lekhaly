"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialMovementQuerySchema = exports.SerialQuerySchema = exports.InventorySettingsSchema = exports.InventoryAlertsQuerySchema = exports.StockTransferSchema = exports.TrackedStockQuerySchema = exports.StockValuationQuerySchema = exports.StockAgingQuerySchema = exports.BatchLotMasterQuerySchema = exports.InventoryPeriodCloseQuerySchema = exports.InventoryPeriodCloseSchema = exports.MovementApprovalActionSchema = exports.MovementApprovalQuerySchema = exports.MovementApprovalRequestSchema = exports.ReservationQuerySchema = exports.SalesOrderReservationSchema = exports.StockDispatchSchema = exports.StockDispatchQuerySchema = exports.GoodsReceiptQuerySchema = exports.GoodsReceiptSchema = exports.StockQuerySchema = exports.StockAdjustmentSchema = void 0;
const zod_1 = require("zod");
exports.StockAdjustmentSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    qty: zod_1.z.number(),
    rate: zod_1.z.number().nonnegative().optional(),
    accountId: zod_1.z.string().uuid().optional(),
    warehouseId: zod_1.z.string().uuid().optional(),
    binId: zod_1.z.string().uuid().optional(),
    memo: zod_1.z.string().trim().max(255).optional(),
    batchNo: zod_1.z.string().trim().max(64).optional(),
    lotNo: zod_1.z.string().trim().max(64).optional(),
    expiryDate: zod_1.z.coerce.date().optional(),
    expiryDateBs: zod_1.z.string().trim().max(20).optional(),
    serialNumbers: zod_1.z.array(zod_1.z.string().trim().min(1).max(120)).optional(),
    allowNegativeOverride: zod_1.z.boolean().optional(),
    overrideReason: zod_1.z.string().trim().max(255).optional()
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
exports.StockQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional()
});
const TrackedMovementLineSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    qty: zod_1.z.number().positive(),
    rate: zod_1.z.number().nonnegative().optional(),
    warehouseId: zod_1.z.string().uuid().optional(),
    binId: zod_1.z.string().uuid().optional(),
    batchNo: zod_1.z.string().trim().max(64).optional(),
    lotNo: zod_1.z.string().trim().max(64).optional(),
    expiryDate: zod_1.z.coerce.date().optional(),
    expiryDateBs: zod_1.z.string().trim().max(20).optional(),
    serialNumbers: zod_1.z.array(zod_1.z.string().trim().min(1).max(120)).optional()
});
exports.GoodsReceiptSchema = zod_1.z.object({
    receiptNo: zod_1.z.string().trim().max(64).optional(),
    purchaseOrderId: zod_1.z.string().uuid().optional(),
    supplierId: zod_1.z.string().uuid().optional(),
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    memo: zod_1.z.string().trim().max(255).optional(),
    lines: zod_1.z.array(TrackedMovementLineSchema).min(1)
}).superRefine((data, ctx) => {
    if (!data.date && !data.dateBs) {
        ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
    }
});
exports.GoodsReceiptQuerySchema = zod_1.z.object({
    purchaseOrderId: zod_1.z.string().uuid().optional(),
    supplierId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(["draft", "posted", "reversed"]).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(500).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional()
});
exports.StockDispatchQuerySchema = zod_1.z.object({
    salesOrderId: zod_1.z.string().uuid().optional(),
    customerId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(["draft", "posted", "reversed"]).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(500).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional()
});
exports.StockDispatchSchema = zod_1.z.object({
    dispatchNo: zod_1.z.string().trim().max(64).optional(),
    salesOrderId: zod_1.z.string().uuid().optional(),
    customerId: zod_1.z.string().uuid().optional(),
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    memo: zod_1.z.string().trim().max(255).optional(),
    lines: zod_1.z.array(TrackedMovementLineSchema).min(1)
}).superRefine((data, ctx) => {
    if (!data.date && !data.dateBs) {
        ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
    }
});
exports.SalesOrderReservationSchema = zod_1.z.object({
    salesOrderId: zod_1.z.string().uuid(),
    expiresAt: zod_1.z.coerce.date().optional()
});
exports.ReservationQuerySchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid().optional(),
    salesOrderId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(["active", "partial", "fulfilled", "released", "cancelled"]).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
exports.MovementApprovalRequestSchema = zod_1.z.object({
    movementType: zod_1.z.enum(["adjustment", "transfer"]),
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    reason: zod_1.z.string().trim().max(255).optional()
});
exports.MovementApprovalQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["pending", "approved", "rejected", "reversed"]).optional(),
    movementType: zod_1.z.enum(["adjustment", "transfer"]).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
exports.MovementApprovalActionSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().max(255).optional()
});
exports.InventoryPeriodCloseSchema = zod_1.z.object({
    periodFrom: zod_1.z.coerce.date().optional(),
    periodFromBs: zod_1.z.string().trim().max(20).optional(),
    periodTo: zod_1.z.coerce.date().optional(),
    periodToBs: zod_1.z.string().trim().max(20).optional()
}).superRefine((data, ctx) => {
    if (!data.periodFrom && !data.periodFromBs) {
        ctx.addIssue({ code: "custom", message: "periodFrom or periodFromBs is required", path: ["periodFrom"] });
    }
    if (!data.periodTo && !data.periodToBs) {
        ctx.addIssue({ code: "custom", message: "periodTo or periodToBs is required", path: ["periodTo"] });
    }
});
exports.InventoryPeriodCloseQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["closed", "reopened"]).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
exports.BatchLotMasterQuerySchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid().optional(),
    warehouseId: zod_1.z.string().uuid().optional(),
    binId: zod_1.z.string().uuid().optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    includeZero: zod_1.z.coerce.boolean().optional(),
    take: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
exports.StockAgingQuerySchema = zod_1.z.object({
    asOf: zod_1.z.coerce.date().optional(),
    asOfBs: zod_1.z.string().trim().max(20).optional(),
    includeZero: zod_1.z.coerce.boolean().optional(),
    valuationMethod: zod_1.z.enum(["fifo", "weighted_average"]).optional()
});
exports.StockValuationQuerySchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid().optional(),
    warehouseId: zod_1.z.string().uuid().optional(),
    binId: zod_1.z.string().uuid().optional(),
    groupId: zod_1.z.string().uuid().optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    includeZero: zod_1.z.coerce.boolean().optional()
});
exports.TrackedStockQuerySchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    warehouseId: zod_1.z.string().uuid().optional(),
    binId: zod_1.z.string().uuid().optional()
});
exports.StockTransferSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    fromWarehouseId: zod_1.z.string().uuid(),
    fromBinId: zod_1.z.string().uuid().optional(),
    toWarehouseId: zod_1.z.string().uuid(),
    toBinId: zod_1.z.string().uuid().optional(),
    qty: zod_1.z.number().positive(),
    rate: zod_1.z.number().nonnegative().optional(),
    batchNo: zod_1.z.string().trim().max(64).optional(),
    lotNo: zod_1.z.string().trim().max(64).optional(),
    expiryDate: zod_1.z.coerce.date().optional(),
    expiryDateBs: zod_1.z.string().trim().max(20).optional(),
    serialNumbers: zod_1.z.array(zod_1.z.string().trim().min(1).max(120)).optional(),
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    memo: zod_1.z.string().trim().max(255).optional()
}).superRefine((data, ctx) => {
    if (!data.date && !data.dateBs) {
        ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
    }
    if (data.fromWarehouseId === data.toWarehouseId && (data.fromBinId || null) === (data.toBinId || null)) {
        ctx.addIssue({ code: "custom", message: "Source and destination cannot be the same", path: ["toWarehouseId"] });
    }
});
exports.InventoryAlertsQuerySchema = zod_1.z.object({
    expiringWithinDays: zod_1.z.coerce.number().int().min(1).max(365).optional(),
    noMovementDays: zod_1.z.coerce.number().int().min(1).max(3650).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
exports.InventorySettingsSchema = zod_1.z.object({
    inventoryTrackingEnabled: zod_1.z.boolean().optional(),
    warehousesEnabled: zod_1.z.boolean().optional(),
    binsEnabled: zod_1.z.boolean().optional(),
    batchTrackingEnabled: zod_1.z.boolean().optional(),
    lotTrackingEnabled: zod_1.z.boolean().optional(),
    expiryTrackingEnabled: zod_1.z.boolean().optional(),
    serialTrackingEnabled: zod_1.z.boolean().optional(),
    kitsEnabled: zod_1.z.boolean().optional(),
    goodsReceiptWorkflowEnabled: zod_1.z.boolean().optional(),
    dispatchWorkflowEnabled: zod_1.z.boolean().optional(),
    allowNegativeStock: zod_1.z.boolean().optional(),
    requireWarehouseOnMovements: zod_1.z.boolean().optional(),
    defaultWarehouseId: zod_1.z.string().uuid().nullable().optional(),
    costingMethod: zod_1.z.enum(["moving_average", "fifo"]).optional()
}).superRefine((data, ctx) => {
    if (data.binsEnabled && data.warehousesEnabled === false) {
        ctx.addIssue({ code: "custom", message: "Bins require warehouses to be enabled", path: ["binsEnabled"] });
    }
    if (data.requireWarehouseOnMovements && data.warehousesEnabled === false) {
        ctx.addIssue({ code: "custom", message: "Required warehouse needs warehouses to be enabled", path: ["requireWarehouseOnMovements"] });
    }
});
exports.SerialQuerySchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(["available", "sold", "returned", "reserved", "damaged"]).optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
exports.SerialMovementQuerySchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid().optional(),
    serialNo: zod_1.z.string().trim().max(120).optional(),
    voucherId: zod_1.z.string().uuid().optional(),
    take: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
//# sourceMappingURL=inventory.schemas.js.map