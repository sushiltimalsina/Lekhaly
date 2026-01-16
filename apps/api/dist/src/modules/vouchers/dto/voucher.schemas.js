"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListVoucherQuerySchema = exports.UpdateVoucherDraftSchema = exports.CreateVoucherDraftSchema = exports.VoucherLineSchema = void 0;
const zod_1 = require("zod");
exports.VoucherLineSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid(),
    partyId: zod_1.z.string().uuid().optional(),
    itemId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().trim().max(255).optional(),
    debit: zod_1.z.number().nonnegative().default(0),
    credit: zod_1.z.number().nonnegative().default(0),
    taxCodeId: zod_1.z.string().uuid().optional(),
    taxAmount: zod_1.z.number().nonnegative().default(0)
});
exports.CreateVoucherDraftSchema = zod_1.z.object({
    voucherType: zod_1.z.enum(["sales_invoice", "receipt", "payment", "journal", "opening", "reversal"]),
    voucherDate: zod_1.z.coerce.date(),
    partyId: zod_1.z.string().uuid().optional(),
    memo: zod_1.z.string().trim().max(500).optional(),
    lines: zod_1.z.array(exports.VoucherLineSchema).min(1)
});
exports.UpdateVoucherDraftSchema = exports.CreateVoucherDraftSchema.partial().extend({
    lines: zod_1.z.array(exports.VoucherLineSchema).min(1).optional()
});
exports.ListVoucherQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["draft", "posted", "void"]).optional(),
    voucherType: zod_1.z.enum(["sales_invoice", "receipt", "payment", "journal", "opening", "reversal"]).optional(),
    partyId: zod_1.z.string().uuid().optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(100).optional()
});
//# sourceMappingURL=voucher.schemas.js.map