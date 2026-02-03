"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListVoucherQuerySchema = exports.UpdateVoucherDraftSchema = exports.CreateVoucherDraftSchema = exports.VoucherLineSchema = void 0;
const zod_1 = require("zod");
exports.VoucherLineSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid().optional(),
    partyId: zod_1.z.string().uuid().optional(),
    itemId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().trim().max(255).optional(),
    debit: zod_1.z.number().nonnegative().default(0),
    credit: zod_1.z.number().nonnegative().default(0),
    qty: zod_1.z.coerce.number().default(0),
    taxCodeId: zod_1.z.string().uuid().optional(),
    taxAmount: zod_1.z.number().nonnegative().default(0)
}).superRefine((data, ctx) => {
    if (data.taxCodeId && (!data.taxAmount || data.taxAmount <= 0)) {
        ctx.addIssue({ code: "custom", message: "Tax amount required when tax code is set", path: ["taxAmount"] });
    }
});
const VoucherDraftBaseSchema = zod_1.z.object({
    voucherType: zod_1.z.enum([
        "sales_invoice",
        "sales_return",
        "purchase",
        "purchase_return",
        "receipt",
        "payment",
        "journal",
        "opening",
        "reversal"
    ]),
    voucherDate: zod_1.z.coerce.date().optional(),
    voucherDateBs: zod_1.z.string().trim().max(20).optional(),
    referenceNo: zod_1.z.string().trim().max(100).optional(),
    vendorInvoiceNo: zod_1.z.string().trim().max(100).optional(),
    vendorInvoiceDate: zod_1.z.coerce.date().optional(),
    partyId: zod_1.z.string().uuid().optional(),
    memo: zod_1.z.string().trim().max(500).optional(),
    lines: zod_1.z.array(exports.VoucherLineSchema).min(1)
});
exports.CreateVoucherDraftSchema = VoucherDraftBaseSchema.superRefine((data, ctx) => {
    if (!data.voucherDate && !data.voucherDateBs) {
        ctx.addIssue({ code: "custom", message: "voucherDate or voucherDateBs is required", path: ["voucherDate"] });
    }
    const requiresParty = ["sales_invoice", "sales_return", "purchase", "purchase_return"];
    const forbidsParty = ["journal", "opening", "reversal"];
    if (requiresParty.includes(data.voucherType) && !data.partyId) {
        ctx.addIssue({ code: "custom", message: "Party is required for this voucher type", path: ["partyId"] });
    }
    if (forbidsParty.includes(data.voucherType) && data.partyId) {
        ctx.addIssue({ code: "custom", message: "Party is not allowed for this voucher type", path: ["partyId"] });
    }
});
exports.UpdateVoucherDraftSchema = VoucherDraftBaseSchema.partial().extend({
    lines: zod_1.z.array(exports.VoucherLineSchema).min(1).optional()
});
exports.ListVoucherQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["draft", "posted", "void"]).optional(),
    voucherType: zod_1.z.enum([
        "sales_invoice",
        "sales_return",
        "purchase",
        "purchase_return",
        "receipt",
        "payment",
        "journal",
        "opening",
        "reversal"
    ]).optional(),
    partyId: zod_1.z.string().uuid().optional(),
    createdByUserId: zod_1.z.string().uuid().optional(),
    postedByUserId: zod_1.z.string().uuid().optional(),
    voidedByUserId: zod_1.z.string().uuid().optional(),
    voucherNumber: zod_1.z.string().trim().max(64).optional(),
    memo: zod_1.z.string().trim().max(200).optional(),
    q: zod_1.z.string().trim().max(200).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(100).optional()
});
//# sourceMappingURL=voucher.schemas.js.map