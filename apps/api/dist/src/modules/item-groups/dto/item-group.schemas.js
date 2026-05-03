"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReorderSchema = exports.ListItemGroupQuerySchema = exports.CreateItemGroupSchema = void 0;
const zod_1 = require("zod");
exports.CreateItemGroupSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(80)
});
exports.ListItemGroupQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(80).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
exports.ReorderSchema = zod_1.z.array(zod_1.z.object({
    id: zod_1.z.string().uuid(),
    sortOrder: zod_1.z.number().int(),
}));
//# sourceMappingURL=item-group.schemas.js.map