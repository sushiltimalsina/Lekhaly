"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportReportSchema = exports.LedgerQuerySchema = exports.PartyAgingQuerySchema = exports.ReportQuerySchema = void 0;
const zod_1 = require("zod");
exports.ReportQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    fromBs: zod_1.z.string().trim().max(20).optional(),
    to: zod_1.z.coerce.date().optional(),
    toBs: zod_1.z.string().trim().max(20).optional()
});
exports.PartyAgingQuerySchema = exports.ReportQuerySchema.extend({
    asOf: zod_1.z.coerce.date().optional(),
    asOfBs: zod_1.z.string().trim().max(20).optional()
});
exports.LedgerQuerySchema = zod_1.z
    .object({
    accountId: zod_1.z.string().uuid().optional(),
    partyId: zod_1.z.string().uuid().optional(),
    from: zod_1.z.coerce.date().optional(),
    fromBs: zod_1.z.string().trim().max(20).optional(),
    to: zod_1.z.coerce.date().optional(),
    toBs: zod_1.z.string().trim().max(20).optional()
})
    .refine((value) => !!value.accountId || !!value.partyId, {
    message: "Either accountId or partyId is required."
});
exports.ExportReportSchema = zod_1.z.object({
    report: zod_1.z.enum(["trial-balance", "profit-loss", "balance-sheet"]),
    format: zod_1.z.enum(["pdf", "csv"]).default("pdf"),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional()
});
//# sourceMappingURL=report.schemas.js.map