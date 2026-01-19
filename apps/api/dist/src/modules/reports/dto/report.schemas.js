"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportReportSchema = exports.PartyAgingQuerySchema = exports.ReportQuerySchema = void 0;
const zod_1 = require("zod");
exports.ReportQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional()
});
exports.PartyAgingQuerySchema = exports.ReportQuerySchema.extend({
    asOf: zod_1.z.coerce.date().optional()
});
exports.ExportReportSchema = zod_1.z.object({
    report: zod_1.z.enum(["trial-balance", "profit-loss", "balance-sheet"]),
    format: zod_1.z.enum(["pdf", "csv"]).default("pdf"),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional()
});
//# sourceMappingURL=report.schemas.js.map