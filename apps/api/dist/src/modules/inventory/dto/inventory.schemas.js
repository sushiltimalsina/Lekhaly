"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockQuerySchema = exports.StockAdjustmentSchema = void 0;
const zod_1 = require("zod");
exports.StockAdjustmentSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    qty: zod_1.z.number(),
    rate: zod_1.z.number().nonnegative().optional(),
    accountId: zod_1.z.string().uuid(),
    memo: zod_1.z.string().trim().max(255).optional()
}).superRefine((data, ctx) => {
    if (!data.date && !data.dateBs) {
        ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
    }
});
exports.StockQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional()
});
//# sourceMappingURL=inventory.schemas.js.map