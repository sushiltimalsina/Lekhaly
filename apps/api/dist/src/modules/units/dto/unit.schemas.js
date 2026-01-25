"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnitQuerySchema = exports.CreateUnitSchema = void 0;
const zod_1 = require("zod");
exports.CreateUnitSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(50)
});
exports.ListUnitQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(50).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
//# sourceMappingURL=unit.schemas.js.map