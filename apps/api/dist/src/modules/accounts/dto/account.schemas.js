"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAccountQuerySchema = exports.UpdateAccountSchema = exports.CreateAccountSchema = void 0;
const zod_1 = require("zod");
exports.CreateAccountSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(2).max(16),
    name: zod_1.z.string().trim().min(2).max(120),
    type: zod_1.z.enum(["asset", "liability", "equity", "income", "expense"]),
    parentId: zod_1.z.string().uuid().optional(),
    isPostable: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional()
});
exports.UpdateAccountSchema = exports.CreateAccountSchema.partial();
exports.ListAccountQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(["asset", "liability", "equity", "income", "expense"]).optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(1000).optional()
});
//# sourceMappingURL=account.schemas.js.map