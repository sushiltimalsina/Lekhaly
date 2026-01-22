"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserListQuerySchema = exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().trim().max(100).optional(),
    password: zod_1.z.string().min(8).max(128),
    roleIds: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
exports.UpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().max(100).optional(),
    status: zod_1.z.enum(["active", "disabled"]).optional(),
    roleIds: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
exports.UserListQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(200).optional(),
    status: zod_1.z.enum(["active", "disabled"]).optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
//# sourceMappingURL=users.schemas.js.map