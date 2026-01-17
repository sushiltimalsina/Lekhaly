"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPartyQuerySchema = exports.UpdatePartySchema = exports.CreatePartySchema = void 0;
const zod_1 = require("zod");
exports.CreatePartySchema = zod_1.z.object({
    type: zod_1.z.enum(["customer", "supplier", "both"]).default("customer"),
    name: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().trim().max(40).optional(),
    address: zod_1.z.string().trim().max(200).optional(),
    panNumber: zod_1.z.string().trim().max(40).optional(),
    vatNumber: zod_1.z.string().trim().max(40).optional()
});
exports.UpdatePartySchema = exports.CreatePartySchema.partial().extend({
    isActive: zod_1.z.boolean().optional()
});
exports.ListPartyQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(["customer", "supplier", "both"]).optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(100).optional()
});
//# sourceMappingURL=party.schemas.js.map