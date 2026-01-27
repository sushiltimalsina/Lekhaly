"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItemQuerySchema = exports.UpdateItemSchema = exports.CreateItemSchema = void 0;
const zod_1 = require("zod");
exports.CreateItemSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120),
    sku: zod_1.z.string().trim().max(64).optional(),
    hsCode: zod_1.z.string().trim().max(32).optional(),
    unit: zod_1.z.string().trim().max(32).optional(),
    type: zod_1.z.enum(["goods", "services"]).optional(),
    salesPrice: zod_1.z.number().nonnegative().optional(),
    purchasePrice: zod_1.z.number().nonnegative().optional(),
    openingQty: zod_1.z.number().optional(),
    openingPrice: zod_1.z.number().nonnegative().optional(),
    groupId: zod_1.z.string().uuid().optional(),
    incomeAccountId: zod_1.z.string().uuid().optional(),
    expenseAccountId: zod_1.z.string().uuid().optional(),
    taxCodeId: zod_1.z.string().uuid().optional(),
    taxCodeIds: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
exports.UpdateItemSchema = exports.CreateItemSchema.partial().extend({
    isActive: zod_1.z.boolean().optional()
});
exports.ListItemQuerySchema = zod_1.z.object({
    isActive: zod_1.z.coerce.boolean().optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    type: zod_1.z.enum(["goods", "services"]).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
//# sourceMappingURL=item.schemas.js.map