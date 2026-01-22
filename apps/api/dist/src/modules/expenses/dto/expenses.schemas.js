"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseListQuerySchema = exports.ExpenseDraftSchema = void 0;
const zod_1 = require("zod");
exports.ExpenseDraftSchema = zod_1.z.object({
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    vendorId: zod_1.z.string().uuid().optional(),
    amount: zod_1.z.number().positive(),
    taxCodeId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().trim().max(255).optional(),
    attachmentId: zod_1.z.string().uuid().optional(),
    expenseAccountId: zod_1.z.string().uuid(),
    paymentAccountId: zod_1.z.string().uuid()
}).superRefine((data, ctx) => {
    if (!data.date && !data.dateBs) {
        ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
    }
});
exports.ExpenseListQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    status: zod_1.z.enum(["draft", "posted", "void"]).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
//# sourceMappingURL=expenses.schemas.js.map