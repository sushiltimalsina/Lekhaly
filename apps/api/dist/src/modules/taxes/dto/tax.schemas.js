"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VatReportQuerySchema = exports.TaxListQuerySchema = exports.TaxCodeSchema = void 0;
const zod_1 = require("zod");
exports.TaxCodeSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    rate: zod_1.z.number().min(0).max(100),
    isInclusive: zod_1.z.boolean().optional(),
    inputTaxAccountId: zod_1.z.string().uuid().optional(),
    outputTaxAccountId: zod_1.z.string().uuid().optional()
});
exports.TaxListQuerySchema = zod_1.z.object({
    isActive: zod_1.z.coerce.boolean().optional(),
    q: zod_1.z.string().trim().max(100).optional()
});
exports.VatReportQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    fromBs: zod_1.z.string().trim().max(20).optional(),
    to: zod_1.z.coerce.date().optional(),
    toBs: zod_1.z.string().trim().max(20).optional()
});
//# sourceMappingURL=tax.schemas.js.map