"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVoucherDraftSchema = exports.CreateVoucherDraftSchema = exports.VoucherLineSchema = void 0;
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
//# sourceMappingURL=voucher.schemas.js.map