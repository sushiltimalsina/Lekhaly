"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextNumberSchema = exports.PullQuerySchema = exports.PushChangeSchema = exports.RegisterDeviceSchema = void 0;
const zod_1 = require("zod");
exports.RegisterDeviceSchema = zod_1.z.object({
    label: zod_1.z.string().trim().min(2).max(64),
    platform: zod_1.z.enum(["windows", "mac", "linux", "web"])
});
exports.PushChangeSchema = zod_1.z.object({
    deviceId: zod_1.z.string().uuid(),
    entries: zod_1.z
        .array(zod_1.z.object({
        seq: zod_1.z.coerce.number().int().min(1),
        entityType: zod_1.z.string().trim().min(1).max(64),
        entityId: zod_1.z.string().trim().min(1).max(128),
        op: zod_1.z.enum(["upsert", "delete", "command"]),
        payload: zod_1.z.any(),
        idempotencyKey: zod_1.z.string().trim().max(128).optional()
    }))
        .min(1)
});
exports.PullQuerySchema = zod_1.z.object({
    deviceId: zod_1.z.string().uuid(),
    since: zod_1.z.coerce.date().optional(),
    lastChangeId: zod_1.z.string().uuid().optional(),
    take: zod_1.z.coerce.number().int().min(1).max(500).optional()
});
exports.NextNumberSchema = zod_1.z.object({
    deviceId: zod_1.z.string().uuid(),
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
    ])
});
//# sourceMappingURL=sync.schemas.js.map