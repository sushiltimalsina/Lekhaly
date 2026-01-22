"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfLedgerSchema = exports.PdfVoucherSchema = exports.PdfInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.PdfInvoiceSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().uuid()
});
exports.PdfVoucherSchema = zod_1.z.object({
    voucherId: zod_1.z.string().uuid()
});
exports.PdfLedgerSchema = zod_1.z.object({
    partyId: zod_1.z.string().uuid(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional()
});
//# sourceMappingURL=pdf.schemas.js.map