"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportQuerySchema = void 0;
const zod_1 = require("zod");
exports.ReportQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional()
});
//# sourceMappingURL=report.schemas.js.map