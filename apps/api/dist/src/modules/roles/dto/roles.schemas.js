"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReorderSchema = exports.AssignRoleUserSchema = exports.RoleListQuerySchema = exports.UpdateRoleSchema = exports.CreateRoleSchema = void 0;
const zod_1 = require("zod");
exports.CreateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(64),
    permissionCodes: zod_1.z.array(zod_1.z.string().trim().min(1)).min(1)
});
exports.UpdateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(64).optional(),
    permissionCodes: zod_1.z.array(zod_1.z.string().trim().min(1)).optional()
});
exports.RoleListQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(200).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
exports.AssignRoleUserSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid()
});
exports.ReorderSchema = zod_1.z.array(zod_1.z.object({
    id: zod_1.z.string().uuid(),
    sortOrder: zod_1.z.number().int(),
}));
//# sourceMappingURL=roles.schemas.js.map