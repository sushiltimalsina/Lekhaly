"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditExportSchema = exports.AuditQuerySchema = void 0;
const zod_1 = require("zod");
exports.AuditQuerySchema = zod_1.z.object({
    entityType: zod_1.z.string().trim().max(64).optional(),
    entityId: zod_1.z.string().trim().max(128).optional(),
    actorUserId: zod_1.z.string().uuid().optional(),
    actorDeviceId: zod_1.z.string().uuid().optional(),
    q: zod_1.z.string().trim().max(200).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    cursorId: zod_1.z.string().uuid().optional(),
    cursorCreatedAt: zod_1.z.coerce.date().optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
exports.AuditExportSchema = exports.AuditQuerySchema.extend({
    format: zod_1.z.enum(["csv"]).default("csv")
});
//# sourceMappingURL=audit.schemas.js.map