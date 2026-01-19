"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTrustSchema = exports.DeviceListQuerySchema = void 0;
const zod_1 = require("zod");
exports.DeviceListQuerySchema = zod_1.z.object({
    trusted: zod_1.z.coerce.boolean().optional(),
    q: zod_1.z.string().trim().max(200).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
exports.DeviceTrustSchema = zod_1.z.object({
    trusted: zod_1.z.coerce.boolean()
});
//# sourceMappingURL=devices.schemas.js.map