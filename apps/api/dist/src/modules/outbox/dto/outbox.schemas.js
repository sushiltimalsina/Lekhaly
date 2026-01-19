"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxAckSchema = exports.OutboxListQuerySchema = void 0;
const zod_1 = require("zod");
exports.OutboxListQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["pending", "processed", "failed"]).optional(),
    type: zod_1.z.string().trim().max(128).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
exports.OutboxAckSchema = zod_1.z.object({
    status: zod_1.z.enum(["processed", "failed"]),
    lastError: zod_1.z.string().trim().max(500).optional()
});
//# sourceMappingURL=outbox.schemas.js.map