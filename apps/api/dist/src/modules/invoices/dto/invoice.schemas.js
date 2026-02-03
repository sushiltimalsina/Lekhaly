"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceListQuerySchema = exports.CreateInvoiceDraftSchema = exports.InvoiceItemSchema = void 0;
const zod_1 = require("zod");
exports.InvoiceItemSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().trim().max(255).optional(),
    qty: zod_1.z.number().positive(),
    rate: zod_1.z.number().nonnegative(),
    taxCodeId: zod_1.z.string().uuid().optional(),
    taxCodeIds: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
exports.CreateInvoiceDraftSchema = zod_1.z.object({
    type: zod_1.z.enum(["sales", "sales_return"]),
    partyId: zod_1.z.string().uuid(),
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    dueDate: zod_1.z.coerce.date().optional(),
    dueDateBs: zod_1.z.string().trim().max(20).optional(),
    referenceNo: zod_1.z.string().trim().max(100).optional(),
    receivableAccountId: zod_1.z.string().uuid(),
    memo: zod_1.z.string().trim().max(500).optional(),
    additionalNote: zod_1.z.string().trim().max(2000).optional(),
    items: zod_1.z.array(exports.InvoiceItemSchema).min(1),
    sundries: zod_1.z.array(zod_1.z.object({
        billSundryId: zod_1.z.string().uuid().optional(),
        name: zod_1.z.string().min(1),
        type: zod_1.z.enum(["add", "less"]),
        rate: zod_1.z.number().optional().nullable(),
        amount: zod_1.z.number()
    })).optional()
}).superRefine((data, ctx) => {
    if (!data.date && !data.dateBs) {
        ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
    }
});
exports.InvoiceListQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(["sales", "sales_return"]).optional(),
    status: zod_1.z.enum(["draft", "posted", "void"]).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
//# sourceMappingURL=invoice.schemas.js.map