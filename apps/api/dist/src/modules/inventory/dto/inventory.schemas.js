"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryAlertsQuerySchema = exports.StockTransferSchema = exports.StockQuerySchema = exports.StockAdjustmentSchema = void 0;
const zod_1 = require("zod");
exports.StockAdjustmentSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    qty: zod_1.z.number(),
    rate: zod_1.z.number().nonnegative().optional(),
    accountId: zod_1.z.string().uuid(),
    memo: zod_1.z.string().trim().max(255).optional(),
    batchNo: zod_1.z.string().trim().max(64).optional(),
    lotNo: zod_1.z.string().trim().max(64).optional(),
    expiryDate: zod_1.z.coerce.date().optional(),
    expiryDateBs: zod_1.z.string().trim().max(20).optional(),
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
//# sourceMappingURL=inventory.schemas.js.map